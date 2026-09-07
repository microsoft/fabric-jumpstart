"""Tests for the declarative data_load feature."""

import pytest
from pydantic import ValidationError

from fabric_jumpstart.data_loader import infer_kusto_type, sanitize_table_name, shift_timestamps

from .schemas import DataLoad

# ─── table name sanitization ─────────────────────────────────────────────────

def test_sanitize_table_name_basic():
    assert sanitize_table_name("events_data/clinical_records.csv") == "clinical_records"


def test_sanitize_table_name_special_chars_and_digits():
    assert sanitize_table_name("My-Table Name.CSV") == "my_table_name"
    assert sanitize_table_name("2024_sales.csv") == "t_2024_sales"


# ─── kusto type inference ────────────────────────────────────────────────────

def test_infer_kusto_type_datetime():
    assert infer_kusto_type(["2024-01-01 10:00:00", "2024-01-02 11:30:00"]) == "datetime"


def test_infer_kusto_type_long_real_bool_string():
    assert infer_kusto_type(["1", "42", "-7"]) == "long"
    assert infer_kusto_type(["1.5", "2"]) == "real"
    assert infer_kusto_type(["true", "False"]) == "bool"
    assert infer_kusto_type(["abc", "1"]) == "string"


def test_infer_kusto_type_empty_defaults_to_string():
    assert infer_kusto_type(["", ""]) == "string"


# ─── timestamp shifting ──────────────────────────────────────────────────────

def _member(rows):
    header = "record_id,timestamp_utc,value\n"
    return (header + "\n".join(rows) + "\n").encode("utf-8")


def test_shift_timestamps_moves_newest_to_yesterday():
    members = {
        "events_data/a.csv": _member(["r1,2020-01-01 10:00:00,5", "r2,2020-01-03 12:00:00,6"]),
        "definition/schema.json": b"{}",
    }
    shifted = shift_timestamps(members, ["events_data/"])
    text = shifted["events_data/a.csv"].decode()
    assert "2020-01-01" not in text
    # relative 2-day gap preserved
    lines = text.strip().splitlines()[1:]
    days = sorted(line.split(",")[1][:10] for line in lines)
    from datetime import datetime
    d0 = datetime.strptime(days[0], "%Y-%m-%d")
    d1 = datetime.strptime(days[1], "%Y-%m-%d")
    assert (d1 - d0).days == 2
    # non-csv member untouched
    assert shifted["definition/schema.json"] == b"{}"


def test_shift_timestamps_idempotent_when_current():
    from datetime import datetime, timedelta, timezone
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
    members = {"events_data/a.csv": _member([f"r1,{yesterday},5"])}
    shifted = shift_timestamps(members, ["events_data/"])
    assert shifted["events_data/a.csv"] == members["events_data/a.csv"]


def test_shift_timestamps_no_ts_columns_is_noop():
    members = {"events_data/a.csv": b"id,value\n1,2\n"}
    assert shift_timestamps(members, ["events_data/"]) == members


# ─── parquet support ─────────────────────────────────────────────────────────

def _parquet_bytes(columns: dict) -> bytes:
    import io

    import pyarrow as pa
    import pyarrow.parquet as pq

    buf = io.BytesIO()
    pq.write_table(pa.table(columns), buf)
    return buf.getvalue()


def test_sanitize_table_name_parquet():
    assert sanitize_table_name("instance_data/Machine-List.PARQUET") == "machine_list"


def test_select_members_prefers_parquet_per_table():
    from fabric_jumpstart.data_loader import select_members

    members = {
        "instance_data/machines.csv": b"a,b\n1,2\n",
        "instance_data/machines.parquet": b"PARQ",
        "instance_data/sensors.csv": b"a,b\n1,2\n",
        "instance_data/readme.txt": b"skip",
        "events_data/other.csv": b"a\n1\n",
    }
    selected = select_members(members, "instance_data/")
    assert set(selected) == {"instance_data/machines.parquet", "instance_data/sensors.csv"}


def test_shift_timestamps_parquet_typed_and_string_columns():
    from datetime import datetime, timedelta, timezone

    data = _parquet_bytes(
        {
            "record_id": ["r1", "r2"],
            "timestamp_utc": [datetime(2020, 1, 1, 10, 0, 0), datetime(2020, 1, 3, 12, 0, 0)],
            "timestamp_text": ["2020-01-01 10:00:00", "2020-01-03 12:00:00"],
            "value": [5, 6],
        }
    )
    shifted = shift_timestamps({"events_data/a.parquet": data}, ["events_data/"])

    import io

    import pyarrow.parquet as pq

    table = pq.read_table(io.BytesIO(shifted["events_data/a.parquet"]))
    typed = table.column("timestamp_utc").to_pylist()
    text = table.column("timestamp_text").to_pylist()
    yesterday = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
    assert abs((max(typed) - yesterday).days) <= 1
    assert (max(typed) - min(typed)) == timedelta(days=2, hours=2)
    assert text[1].startswith(f"{max(typed):%Y-%m-%d}"[:8])
    assert table.column("value").to_pylist() == [5, 6]


def test_shift_timestamps_mixed_formats_share_one_offset():
    from datetime import datetime

    parquet = _parquet_bytes({"timestamp_utc": [datetime(2020, 1, 1)], "v": [1]})
    csv_member = _member(["r1,2020-01-05 09:00:00,5"])
    shifted = shift_timestamps(
        {"events_data/a.parquet": parquet, "events_data/b.csv": csv_member},
        ["events_data/"],
    )

    import io

    import pyarrow.parquet as pq

    typed = pq.read_table(io.BytesIO(shifted["events_data/a.parquet"])).column("timestamp_utc").to_pylist()
    csv_day = shifted["events_data/b.csv"].decode().splitlines()[1].split(",")[1][:10]
    gap = datetime.strptime(csv_day, "%Y-%m-%d") - typed[0]
    assert gap.days == 4  # original 4-day gap preserved by the single global offset


def test_parquet_kusto_table_types_and_rows():
    from datetime import datetime

    from fabric_jumpstart.data_loader import _parquet_kusto_table

    data = _parquet_bytes(
        {
            "name": ["a", None],
            "count": [1, 2],
            "score": [1.5, 2.5],
            "ok": [True, False],
            "ts": [datetime(2024, 1, 1, 10, 0, 0), datetime(2024, 1, 2, 11, 0, 0)],
        }
    )
    schema, rows = _parquet_kusto_table(data)
    assert schema == [
        ("name", "string"),
        ("count", "long"),
        ("score", "real"),
        ("ok", "bool"),
        ("ts", "datetime"),
    ]
    assert rows[0] == ["a", "1", "1.5", "true", "2024-01-01T10:00:00"]
    assert rows[1][0] == ""  # None -> empty


def test_format_options_per_extension():
    from fabric_jumpstart.data_loader import _format_options

    assert _format_options("machines.parquet") == {"format": "Parquet"}
    assert _format_options("machines.csv") == {"format": "Csv", "header": True, "delimiter": ","}


# ─── schema validation ───────────────────────────────────────────────────────

def test_data_load_schema_valid():
    spec = DataLoad.model_validate({
        "source": "my-jumpstart/data/{install_option}_package.iq",
        "shift_timestamps_to_now": True,
        "lakehouse_tables": {"lakehouse": "my_lakehouse", "archive_path": "instance_data/"},
        "kusto_tables": {"database": "my_eventhouse", "archive_path": "events_data/"},
        "refresh_definitions": ["MyOntology.Ontology"],
    })
    assert spec.lakehouse_tables is not None
    assert spec.lakehouse_tables.lakehouse == "my_lakehouse"


def test_data_load_schema_requires_a_target():
    with pytest.raises(ValidationError, match="lakehouse_tables and/or kusto_tables"):
        DataLoad.model_validate({"source": "data/x.zip"})


def test_data_load_schema_rejects_bad_refresh_entry():
    with pytest.raises(ValidationError, match="must be '<Name>.<ItemType>'"):
        DataLoad.model_validate({
            "source": "data/x.zip",
            "lakehouse_tables": {"lakehouse": "lh"},
            "refresh_definitions": ["NoTypeSuffix"],
        })


def test_data_load_schema_forbids_unknown_fields():
    with pytest.raises(ValidationError):
        DataLoad.model_validate({
            "source": "data/x.zip",
            "lakehouse_tables": {"lakehouse": "lh"},
            "bogus_field": True,
        })

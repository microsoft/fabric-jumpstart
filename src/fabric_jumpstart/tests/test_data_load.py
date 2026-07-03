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

"""Declarative post-deploy data loading (the ``data_load`` YAML block).

Runs entirely client-side against public Fabric/Kusto REST APIs — no Spark, no
notebook execution, and no code from the jumpstart's content repository is ever
executed. The library only interprets data files.

YAML shape::

    data_load:
      source: my-jumpstart/data/{install_option}_package.zip   # repo-relative file or folder
      shift_timestamps_to_now: true          # optional, default false
      lakehouse_tables:                      # optional
        lakehouse: my_lakehouse
        archive_path: instance_data/         # csv/parquet members -> one Delta table each
      kusto_tables:                          # optional
        database: my_eventhouse
        archive_path: events_data/           # csv/parquet members -> one KQL table each
      refresh_definitions:                   # optional; re-save items after load
        - MyOntology.Ontology

Members may be CSV or Parquet; when a table exists in both formats the Parquet
file wins (better types, smaller payloads). Parquet handling uses ``pyarrow``,
which ships in Fabric notebook runtimes and is imported lazily elsewhere.

Data file names map to table names (sanitized: non-alphanumerics -> ``_``,
lowercased, ``t_`` prefix when starting with a digit).
"""

from __future__ import annotations

import csv
import io
import json
import logging
import re
import time
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests

from .utils import resolve_token_credential

logger = logging.getLogger(__name__)

FABRIC_API = "https://api.fabric.microsoft.com/v1"
ONELAKE_DFS = "https://onelake.dfs.fabric.microsoft.com"

_TS_FORMATS = ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d")
_INGEST_CHUNK_BYTES = 900_000  # stay under the 1MB inline ingest limit


def sanitize_table_name(file_name: str) -> str:
    """Data member name -> table name (accelerator-compatible sanitization)."""
    base = file_name.rsplit("/", 1)[-1]
    base = re.sub(r"\.(csv|parquet)$", "", base, flags=re.I)
    base = re.sub(r"[^0-9a-zA-Z]+", "_", base).strip("_").lower()
    if base and base[0].isdigit():
        base = f"t_{base}"
    return base


def _member_format(name: str) -> Optional[str]:
    low = name.lower()
    if low.endswith(".parquet"):
        return "parquet"
    if low.endswith(".csv"):
        return "csv"
    return None


def select_members(members: Dict[str, bytes], prefix: str) -> Dict[str, bytes]:
    """Pick the loadable members under ``prefix`` — Parquet wins over CSV per table."""
    by_table: Dict[str, Dict[str, str]] = {}
    for name in sorted(members):
        fmt = _member_format(name)
        if fmt is None or not name.startswith(prefix):
            continue
        by_table.setdefault(sanitize_table_name(name), {}).setdefault(fmt, name)
    selected: Dict[str, bytes] = {}
    for formats in by_table.values():
        chosen = formats.get("parquet") or formats["csv"]
        selected[chosen] = members[chosen]
    return selected


def _load_pyarrow():
    """Lazy pyarrow import — present in Fabric runtimes, optional elsewhere."""
    try:
        import pyarrow
        import pyarrow.parquet  # noqa: F401
    except ImportError as e:  # pragma: no cover - environment specific
        raise RuntimeError(
            "This data_load source contains Parquet files, which require the "
            "'pyarrow' package (preinstalled in Fabric notebooks; "
            "'pip install pyarrow' elsewhere)"
        ) from e
    return pyarrow


def _is_ts_column(col: Optional[str]) -> bool:
    return bool(col) and "timestamp" in str(col).lower()


def _read_parquet_table(data: bytes):
    pa = _load_pyarrow()
    return pa, pa.parquet.read_table(io.BytesIO(data))


def _write_parquet_table(pa, table) -> bytes:
    buf = io.BytesIO()
    pa.parquet.write_table(table, buf)
    return buf.getvalue()


def _parquet_max_timestamp(data: bytes) -> Optional[datetime]:
    """Max value across timestamp-named columns (typed or string)."""
    pa, table = _read_parquet_table(data)
    result: Optional[datetime] = None
    for idx, field in enumerate(table.schema):
        if not _is_ts_column(field.name):
            continue
        for value in table.column(idx).to_pylist():
            ts: Optional[datetime] = None
            if isinstance(value, datetime):
                ts = value.replace(tzinfo=None)
            elif isinstance(value, str) and value:
                ts, _ = _parse_ts(value)
            if ts and (result is None or ts > result):
                result = ts
    return result


def _shift_parquet(data: bytes, delta: timedelta) -> bytes:
    """Return parquet bytes with timestamp-named columns shifted by ``delta``."""
    pa, table = _read_parquet_table(data)
    changed = False
    for idx, field in enumerate(table.schema):
        if not _is_ts_column(field.name):
            continue
        values = table.column(idx).to_pylist()
        shifted_values = []
        column_changed = False
        for value in values:
            if isinstance(value, datetime):
                shifted_values.append(value + delta)
                column_changed = True
            elif isinstance(value, str) and value:
                ts, fmt = _parse_ts(value)
                if ts and fmt:
                    shifted_values.append((ts + delta).strftime(fmt))
                    column_changed = True
                else:
                    shifted_values.append(value)
            else:
                shifted_values.append(value)
        if column_changed:
            table = table.set_column(idx, field, pa.array(shifted_values, type=field.type))
            changed = True
    return _write_parquet_table(pa, table) if changed else data


def _parse_ts(value: str) -> Tuple[Optional[datetime], Optional[str]]:
    for fmt in _TS_FORMATS:
        try:
            return datetime.strptime(value, fmt), fmt
        except ValueError:
            continue
    return None, None


def shift_timestamps(members: Dict[str, bytes], paths: List[str]) -> Dict[str, bytes]:
    """Shift timestamp-ish columns in csv/parquet members so the newest lands ~yesterday.

    A single global day-offset preserves relative order and time-of-day.
    Idempotent: re-running shifts by ~0 days.
    """
    def in_scope(name: str) -> bool:
        return any(name.startswith(p) for p in paths) and _member_format(name) is not None

    global_max: Optional[datetime] = None
    for name, data in members.items():
        if not in_scope(name):
            continue
        if _member_format(name) == "parquet":
            ts = _parquet_max_timestamp(data)
            if ts and (global_max is None or ts > global_max):
                global_max = ts
            continue
        reader = csv.DictReader(io.StringIO(data.decode("utf-8")))
        for row in reader:
            for col, val in row.items():
                if _is_ts_column(col) and val:
                    ts, _ = _parse_ts(val)
                    if ts and (global_max is None or ts > global_max):
                        global_max = ts

    if global_max is None:
        logger.info("No timestamp columns found - skipping shift")
        return members

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    delta = timedelta(days=(now_utc - timedelta(days=1) - global_max).days)
    if delta.days <= 0:
        logger.info(f"Timestamps already current (max {global_max:%Y-%m-%d}) - no shift needed")
        return members

    shifted = dict(members)
    for name in list(shifted):
        if not in_scope(name):
            continue
        if _member_format(name) == "parquet":
            shifted[name] = _shift_parquet(shifted[name], delta)
            continue
        reader = csv.DictReader(io.StringIO(shifted[name].decode("utf-8")))
        fieldnames = list(reader.fieldnames or [])
        if not fieldnames:
            continue
        out = io.StringIO()
        writer = csv.DictWriter(out, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        for row in reader:
            for col in fieldnames:
                if _is_ts_column(col) and row[col]:
                    ts, fmt = _parse_ts(row[col])
                    if ts and fmt:
                        row[col] = (ts + delta).strftime(fmt)
            writer.writerow(row)
        shifted[name] = out.getvalue().encode("utf-8")
    logger.info(f"Shifted timestamps forward by {delta.days} days (was max {global_max:%Y-%m-%d})")
    return shifted


def infer_kusto_type(values: List[str]) -> str:
    """Infer a Kusto column type from sample values (port of the notebook logic)."""
    non_empty = [v for v in values if v not in (None, "")]
    if not non_empty:
        return "string"
    ts_hits = sum(1 for v in non_empty if _parse_ts(v)[0] is not None)
    if ts_hits / len(non_empty) >= 0.9:
        return "datetime"
    if all(re.fullmatch(r"[+-]?\d+", v) for v in non_empty):
        return "long"
    try:
        for v in non_empty:
            float(v)
        return "real"
    except ValueError:
        pass
    if all(v.lower() in ("true", "false") for v in non_empty):
        return "bool"
    return "string"


def _parquet_kusto_table(data: bytes) -> Tuple[List[Tuple[str, str]], List[List[str]]]:
    """Parquet bytes -> ([(column, kusto_type), ...], stringified data rows)."""
    pa, table = _read_parquet_table(data)
    schema: List[Tuple[str, str]] = []
    for field in table.schema:
        t = field.type
        if pa.types.is_boolean(t):
            kusto = "bool"
        elif pa.types.is_integer(t):
            kusto = "long"
        elif pa.types.is_floating(t) or pa.types.is_decimal(t):
            kusto = "real"
        elif pa.types.is_timestamp(t) or pa.types.is_date(t):
            kusto = "datetime"
        else:
            kusto = "string"
        schema.append((field.name, kusto))
    columns = [table.column(i).to_pylist() for i in range(table.num_columns)]
    rows: List[List[str]] = []
    for values in (zip(*columns) if columns else []):
        row: List[str] = []
        for v in values:
            if v is None:
                row.append("")
            elif isinstance(v, bool):
                row.append("true" if v else "false")
            elif isinstance(v, datetime):
                row.append(v.isoformat())
            else:
                row.append(str(v))
        rows.append(row)
    return schema, rows


def _format_options(file_name: str) -> dict:
    """Load Table API formatOptions for a staged file."""
    if file_name.lower().endswith(".parquet"):
        return {"format": "Parquet"}
    return {"format": "Csv", "header": True, "delimiter": ","}


class DataLoader:
    """Executes a jumpstart's declarative ``data_load`` block."""

    def __init__(
        self,
        config: dict,
        workspace_id: str,
        working_repo_path: Path,
        install_option: Optional[str] = None,
        item_prefix: Optional[str] = None,
        on_progress=None,
    ):
        self.spec = config.get("data_load") or {}
        self.workspace_id = workspace_id
        self.working_repo_path = working_repo_path
        self.install_option = install_option
        self.item_prefix = item_prefix or ""
        self.on_progress = on_progress or (lambda msg: None)
        self._credential = None
        self._items_cache: Optional[list] = None

    # ── auth / REST helpers ─────────────────────────────────────────────

    def _token(self, scope: str) -> str:
        from .utils import _is_fabric_runtime

        if _is_fabric_runtime():
            # The Fabric notebook runtime credential ignores requested scopes,
            # so map the scope to the matching notebookutils audience instead.
            import notebookutils  # type: ignore[import-untyped]

            if scope.startswith("https://storage.azure.com"):
                audience = "storage"
            elif scope.startswith("https://api.fabric.microsoft.com"):
                audience = "pbi"
            else:
                audience = scope.removesuffix("/.default")
            return notebookutils.credentials.getToken(audience)

        if self._credential is None:
            self._credential = resolve_token_credential()
            if self._credential is None:
                from azure.identity import DefaultAzureCredential

                self._credential = DefaultAzureCredential()
        return self._credential.get_token(scope).token

    def _fabric_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._token('https://api.fabric.microsoft.com/.default')}",
            "Content-Type": "application/json",
        }

    def _wait_lro(self, response: requests.Response, timeout_s: int = 600) -> None:
        if response.status_code not in (200, 202):
            raise RuntimeError(f"Fabric API error {response.status_code}: {response.text[:300]}")
        if response.status_code == 200:
            return
        location = response.headers.get("Location") or response.headers.get("Azure-AsyncOperation")
        if not location:
            return
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            status = requests.get(location, headers=self._fabric_headers(), timeout=60)
            body = status.json() if status.text else {}
            state = body.get("status", "")
            if state == "Succeeded":
                return
            if state in ("Failed", "Cancelled"):
                raise RuntimeError(f"Fabric operation {state}: {json.dumps(body)[:400]}")
            time.sleep(3)
        raise RuntimeError("Fabric operation timed out")

    def _workspace_item(self, name: str, item_type: str) -> dict:
        if self._items_cache is None:
            r = requests.get(
                f"{FABRIC_API}/workspaces/{self.workspace_id}/items",
                headers=self._fabric_headers(),
                timeout=60,
            )
            r.raise_for_status()
            self._items_cache = r.json()["value"]
        prefixed = f"{self.item_prefix}{name}"
        for item in self._items_cache:
            if item["displayName"] == prefixed and item["type"] == item_type:
                return item
        raise RuntimeError(f"Deployed item '{prefixed}' ({item_type}) not found in workspace")

    # ── source resolution ───────────────────────────────────────────────

    def _read_members(self) -> Dict[str, bytes]:
        raw_source = self.spec["source"]
        if "{install_option}" in raw_source:
            if not self.install_option:
                raise RuntimeError("data_load.source uses {install_option} but no install option was provided")
            raw_source = raw_source.replace("{install_option}", self.install_option)
        source = self.working_repo_path / raw_source.lstrip("/\\")
        if not source.exists():
            raise RuntimeError(f"data_load source not found in repository: {raw_source}")
        members: Dict[str, bytes] = {}
        if source.is_dir():
            for f in source.rglob("*"):
                if f.is_file() and _member_format(f.name) is not None:
                    members[str(f.relative_to(source)).replace("\\", "/")] = f.read_bytes()
        else:
            with zipfile.ZipFile(source) as z:
                for n in z.namelist():
                    members[n] = z.read(n)
        return members

    # ── lakehouse ───────────────────────────────────────────────────────

    def _upload_to_files(self, lakehouse_id: str, rel_path: str, data: bytes) -> None:
        token = self._token("https://storage.azure.com/.default")
        headers = {"Authorization": f"Bearer {token}"}
        base = f"{ONELAKE_DFS}/{self.workspace_id}/{lakehouse_id}/{rel_path}"
        r = requests.put(f"{base}?resource=file", headers=headers, timeout=60)
        if r.status_code not in (200, 201):
            raise RuntimeError(f"OneLake create failed {r.status_code}: {r.text[:200]}")
        r = requests.patch(
            f"{base}?action=append&position=0",
            headers={**headers, "Content-Type": "application/octet-stream"},
            data=data,
            timeout=300,
        )
        if r.status_code not in (200, 202):
            raise RuntimeError(f"OneLake append failed {r.status_code}: {r.text[:200]}")
        r = requests.patch(f"{base}?action=flush&position={len(data)}", headers=headers, timeout=60)
        if r.status_code not in (200, 202):
            raise RuntimeError(f"OneLake flush failed {r.status_code}: {r.text[:200]}")

    def load_lakehouse_tables(self, members: Dict[str, bytes]) -> List[str]:
        block = self.spec.get("lakehouse_tables")
        if not block:
            return []
        lakehouse = self._workspace_item(block["lakehouse"], "Lakehouse")
        prefix = block.get("archive_path", "")

        # Upload the selected members (Parquet preferred) and map file -> table.
        mapping: Dict[str, str] = {}
        for name, data in sorted(select_members(members, prefix).items()):
            table = sanitize_table_name(name)
            file_name = f"{table}.{_member_format(name)}"
            rel = f"Files/_jumpstart_load/{file_name}"
            self.on_progress(f"Uploading data for table '{table}'...")
            self._upload_to_files(lakehouse["id"], rel, data)
            mapping[file_name] = table
        if not mapping:
            return []

        # Preferred path: the public Load Table API (schema-less lakehouses).
        first_file, first_table = next(iter(mapping.items()))
        r = requests.post(
            f"{FABRIC_API}/workspaces/{self.workspace_id}/lakehouses/{lakehouse['id']}/tables/{first_table}/load",
            headers=self._fabric_headers(),
            json={
                "relativePath": f"Files/_jumpstart_load/{first_file}",
                "pathType": "File",
                "mode": "Overwrite",
                "formatOptions": _format_options(first_file),
            },
            timeout=60,
        )
        if r.status_code == 400 and "SchemasEnabledLakehouse" in r.text:
            # Schema-enabled lakehouse: load through a short-lived Livy Spark
            # session (library-generated code; nothing from the repo executes).
            self.on_progress("Lakehouse uses schemas - loading tables via a temporary Spark session...")
            self._livy_bulk_load(lakehouse["id"], mapping)
            return sorted(mapping.values())

        self._wait_lro(r)
        loaded = [first_table]
        logger.info(f"Lakehouse table loaded: {first_table}")
        for file_name, table in mapping.items():
            if table == first_table:
                continue
            self.on_progress(f"Loading lakehouse table '{table}'...")
            rr = requests.post(
                f"{FABRIC_API}/workspaces/{self.workspace_id}/lakehouses/{lakehouse['id']}/tables/{table}/load",
                headers=self._fabric_headers(),
                json={
                    "relativePath": f"Files/_jumpstart_load/{file_name}",
                    "pathType": "File",
                    "mode": "Overwrite",
                    "formatOptions": _format_options(file_name),
                },
                timeout=60,
            )
            self._wait_lro(rr)
            loaded.append(table)
            logger.info(f"Lakehouse table loaded: {table}")
        return loaded

    def _livy_bulk_load(self, lakehouse_id: str, mapping: Dict[str, str], schema: str = "dbo") -> None:
        """Load uploaded CSVs into schema tables via a short-lived Livy session."""
        base = (
            f"{FABRIC_API}/workspaces/{self.workspace_id}/lakehouses/{lakehouse_id}"
            f"/livyapi/versions/2023-12-01/sessions"
        )
        create = requests.post(base, headers=self._fabric_headers(), json={}, timeout=60)
        if create.status_code not in (200, 201, 202):
            raise RuntimeError(f"Livy session create failed {create.status_code}: {create.text[:200]}")
        session_id = create.json().get("id") or create.json().get("livyId")
        if not session_id:
            raise RuntimeError(f"Livy session id missing in response: {create.text[:200]}")
        try:
            deadline = time.time() + 600
            while time.time() < deadline:
                s = requests.get(f"{base}/{session_id}", headers=self._fabric_headers(), timeout=60)
                state = (s.json().get("state") or "").lower()
                if state == "idle":
                    break
                if state in ("dead", "error", "killed"):
                    raise RuntimeError(f"Livy session failed to start: {s.text[:300]}")
                self.on_progress("Starting the temporary Spark session...")
                time.sleep(10)
            else:
                raise RuntimeError("Livy session did not become idle within 10 minutes")

            code_lines = ["results = {}"]
            for file_name, table in mapping.items():
                if file_name.lower().endswith(".parquet"):
                    code_lines.append(
                        f"df = spark.read.parquet('Files/_jumpstart_load/{file_name}')"
                    )
                else:
                    code_lines.append(
                        f"df = spark.read.option('header', True).option('inferSchema', True)"
                        f".csv('Files/_jumpstart_load/{file_name}')"
                    )
                code_lines.append(
                    f"df.write.mode('overwrite').saveAsTable('{schema}.{table}')"
                )
                code_lines.append(f"results['{table}'] = df.count()")
            code_lines.append("print(results)")
            statement = {"code": "\n".join(code_lines), "kind": "pyspark"}
            st = requests.post(f"{base}/{session_id}/statements", headers=self._fabric_headers(), json=statement, timeout=60)
            if st.status_code not in (200, 201, 202):
                raise RuntimeError(f"Livy statement submit failed {st.status_code}: {st.text[:200]}")
            st_id = st.json().get("id", 0)
            deadline = time.time() + 900
            while time.time() < deadline:
                out = requests.get(f"{base}/{session_id}/statements/{st_id}", headers=self._fabric_headers(), timeout=60).json()
                if out.get("state") == "available":
                    output = out.get("output") or {}
                    if output.get("status") == "error":
                        raise RuntimeError(
                            f"Spark load failed: {output.get('ename')}: {output.get('evalue', '')[:300]}"
                        )
                    logger.info(f"Spark load output: {json.dumps(output.get('data', {}))[:300]}")
                    return
                self.on_progress("Loading lakehouse tables via Spark...")
                time.sleep(10)
            raise RuntimeError("Spark load statement timed out")
        finally:
            try:
                requests.delete(f"{base}/{session_id}", headers=self._fabric_headers(), timeout=60)
            except Exception:  # noqa: BLE001
                pass

    # ── kusto ───────────────────────────────────────────────────────────

    def _kusto_mgmt(self, cluster: str, db: str, csl: str, timeout: int = 120) -> requests.Response:
        token = self._token(f"{cluster}/.default")
        return requests.post(
            f"{cluster}/v1/rest/mgmt",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"db": db, "csl": csl},
            timeout=timeout,
        )

    def _wait_for_database(self, cluster: str, db_display_name: str, timeout_s: int = 600) -> None:
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            try:
                r = self._kusto_mgmt(cluster, "NetDefaultDB", ".show databases | project DatabaseName, PrettyName")
                if r.status_code == 200:
                    rows = r.json()["Tables"][0]["Rows"]
                    for row in rows:
                        if db_display_name in (row[0], row[1]):
                            return
            except Exception as e:  # noqa: BLE001
                logger.debug(f"Waiting for eventhouse database... ({type(e).__name__})")
            self.on_progress("Waiting for the eventhouse database to provision...")
            time.sleep(15)
        raise RuntimeError(f"Eventhouse database '{db_display_name}' not provisioned within {timeout_s}s")

    def load_kusto_tables(self, members: Dict[str, bytes]) -> List[str]:
        block = self.spec.get("kusto_tables")
        if not block:
            return []
        db_name = block["database"]
        eventhouse = self._workspace_item(db_name, "Eventhouse")
        detail = requests.get(
            f"{FABRIC_API}/workspaces/{self.workspace_id}/eventhouses/{eventhouse['id']}",
            headers=self._fabric_headers(),
            timeout=60,
        ).json()
        cluster = detail["properties"]["queryServiceUri"]
        prefixed_db = f"{self.item_prefix}{db_name}"
        self._wait_for_database(cluster, prefixed_db)

        prefix = block.get("archive_path", "")
        loaded = []
        for name, data in sorted(select_members(members, prefix).items()):
            table = sanitize_table_name(name)
            self.on_progress(f"Loading eventhouse table '{table}'...")
            if _member_format(name) == "parquet":
                typed_schema, body = _parquet_kusto_table(data)
                schema = ", ".join(f"['{col}']:{kusto}" for col, kusto in typed_schema)
            else:
                rows = list(csv.reader(io.StringIO(data.decode("utf-8"))))
                header, body = rows[0], rows[1:]
                samples = list(zip(*body[:200])) if body else [[] for _ in header]
                schema = ", ".join(
                    f"['{col}']:{infer_kusto_type(list(vals))}" for col, vals in zip(header, samples)
                )
            r = self._kusto_mgmt(cluster, prefixed_db, f".create-merge table ['{table}'] ({schema})")
            if r.status_code != 200:
                raise RuntimeError(f"Kusto table create failed for '{table}': {r.status_code} {r.text[:300]}")

            # inline ingest in <1MB chunks (data rows only, no header)
            chunk: List[str] = []
            size = 0
            def flush_chunk():
                if not chunk:
                    return
                payload = "\n".join(chunk)
                rr = self._kusto_mgmt(cluster, prefixed_db, f".ingest inline into table ['{table}'] <|\n{payload}", timeout=300)
                if rr.status_code != 200:
                    raise RuntimeError(f"Kusto ingest failed for '{table}': {rr.status_code} {rr.text[:300]}")
            out = io.StringIO()
            w = csv.writer(out, lineterminator="\n")
            for row in body:
                out.seek(0)
                out.truncate(0)
                w.writerow(row)
                line = out.getvalue().rstrip("\n")
                if size + len(line) > _INGEST_CHUNK_BYTES:
                    flush_chunk()
                    chunk, size = [], 0
                chunk.append(line)
                size += len(line) + 1
            flush_chunk()
            loaded.append(table)
            logger.info(f"Eventhouse table loaded: {table} ({len(body)} rows)")
        return loaded

    # ── definition refresh ──────────────────────────────────────────────

    def refresh_definitions(self) -> List[str]:
        refreshed = []
        for entry in self.spec.get("refresh_definitions", []) or []:
            name, _, item_type = entry.partition(".")
            item = self._workspace_item(name, item_type)
            self.on_progress(f"Refreshing '{name}' so it ingests the loaded data...")
            r = requests.post(
                f"{FABRIC_API}/workspaces/{self.workspace_id}/items/{item['id']}/getDefinition",
                headers=self._fabric_headers(),
                timeout=60,
            )
            if r.status_code == 202:
                location = r.headers["Location"]
                deadline = time.time() + 300
                while time.time() < deadline:
                    s = requests.get(location, headers=self._fabric_headers(), timeout=60)
                    if s.json().get("status") in ("Succeeded", "Failed"):
                        break
                    time.sleep(2)
                definition = requests.get(f"{location}/result", headers=self._fabric_headers(), timeout=60).json()
            else:
                r.raise_for_status()
                definition = r.json()
            u = requests.post(
                f"{FABRIC_API}/workspaces/{self.workspace_id}/items/{item['id']}/updateDefinition",
                headers=self._fabric_headers(),
                json={"definition": definition["definition"]},
                timeout=120,
            )
            self._wait_lro(u)
            refreshed.append(entry)
            logger.info(f"Definition refreshed: {entry}")
        return refreshed

    # ── orchestration ───────────────────────────────────────────────────

    def run(self) -> dict:
        """Execute the full data_load block. Returns a summary dict."""
        if not self.spec:
            return {}
        self.on_progress("Reading sample data from the jumpstart source...")
        members = self._read_members()

        if self.spec.get("shift_timestamps_to_now"):
            shift_paths = []
            if self.spec.get("kusto_tables"):
                shift_paths.append(self.spec["kusto_tables"].get("archive_path", ""))
            if self.spec.get("lakehouse_tables"):
                shift_paths.append(self.spec["lakehouse_tables"].get("archive_path", ""))
            members = shift_timestamps(members, shift_paths)

        lakehouse_tables = self.load_lakehouse_tables(members)
        kusto_tables = self.load_kusto_tables(members)
        refreshed = self.refresh_definitions()

        summary = {
            "lakehouse_tables": lakehouse_tables,
            "kusto_tables": kusto_tables,
            "refreshed": refreshed,
        }
        logger.info(f"Data load complete: {json.dumps(summary)}")
        return summary

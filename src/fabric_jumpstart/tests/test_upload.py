"""Tests for lakehouse file upload feature."""

from unittest.mock import MagicMock, patch

import pytest
from pydantic import ValidationError

from fabric_jumpstart.installer import JumpstartInstaller
from fabric_jumpstart.utils import upload_files_to_lakehouse

from .schemas import JumpstartSource


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_config(**source_overrides):
    """Return a minimal jumpstart config dict with optional source overrides."""
    source = {
        "repo_url": "https://github.com/example/repo.git",
        "repo_ref": "v1.0.0",
        "workspace_path": "demo/",
        "preview_image_path": "demo/preview.png",
    }
    source.update(source_overrides)
    return {
        "id": 1,
        "logical_id": "test-jumpstart",
        "source": source,
    }


def _mock_response(status_code, text=""):
    resp = MagicMock()
    resp.status_code = status_code
    resp.text = text
    return resp


# ---------------------------------------------------------------------------
# Group 1: upload_files_to_lakehouse (utils.py)
# ---------------------------------------------------------------------------


class TestUploadFilesToLakehouse:
    """Tests for the upload_files_to_lakehouse utility function."""

    @patch("fabric_jumpstart.utils._is_fabric_runtime", return_value=False)
    @patch("fabric_jumpstart.utils.resolve_token_credential")
    @patch("fabric_jumpstart.utils.requests")
    def test_upload_single_file(self, mock_requests, mock_cred, _mock_rt, tmp_path):
        """A single file triggers exactly one create + append + flush cycle."""
        single_file = tmp_path / "data.csv"
        single_file.write_text("a,b,c")

        cred = MagicMock()
        cred.get_token.return_value = MagicMock(token="tok")
        mock_cred.return_value = cred

        mock_requests.put.return_value = _mock_response(201)
        mock_requests.patch.side_effect = [
            _mock_response(202),  # append
            _mock_response(200),  # flush
        ]

        count = upload_files_to_lakehouse("ws-1", "lh-1", single_file)

        assert count == 1
        mock_requests.put.assert_called_once()
        assert mock_requests.patch.call_count == 2

    @patch("fabric_jumpstart.utils._is_fabric_runtime", return_value=False)
    @patch("fabric_jumpstart.utils.resolve_token_credential")
    @patch("fabric_jumpstart.utils.requests")
    def test_upload_folder_recursively(
        self, mock_requests, mock_cred, _mock_rt, tmp_path
    ):
        """A folder with nested files uploads all files recursively."""
        (tmp_path / "sub").mkdir()
        (tmp_path / "a.csv").write_text("1")
        (tmp_path / "sub" / "b.csv").write_text("2")

        cred = MagicMock()
        cred.get_token.return_value = MagicMock(token="tok")
        mock_cred.return_value = cred

        mock_requests.put.return_value = _mock_response(201)
        mock_requests.patch.return_value = _mock_response(202)
        # flush needs status 200
        mock_requests.patch.side_effect = None
        # We need alternating 202/200 for each file (append then flush)
        mock_requests.patch.side_effect = [
            _mock_response(202),
            _mock_response(200),  # file 1
            _mock_response(202),
            _mock_response(200),  # file 2
        ]

        count = upload_files_to_lakehouse("ws-1", "lh-1", tmp_path)

        assert count == 2
        assert mock_requests.put.call_count == 2

    @patch("fabric_jumpstart.utils._is_fabric_runtime", return_value=False)
    @patch("fabric_jumpstart.utils.resolve_token_credential")
    @patch("fabric_jumpstart.utils.requests")
    def test_upload_with_destination_path(
        self, mock_requests, mock_cred, _mock_rt, tmp_path
    ):
        """destination_path is included in the upload URL."""
        f = tmp_path / "file.json"
        f.write_text("{}")

        cred = MagicMock()
        cred.get_token.return_value = MagicMock(token="tok")
        mock_cred.return_value = cred

        mock_requests.put.return_value = _mock_response(201)
        mock_requests.patch.side_effect = [_mock_response(202), _mock_response(200)]

        upload_files_to_lakehouse("ws-1", "lh-1", f, destination_path="ref-data")

        put_url = mock_requests.put.call_args[0][0]
        assert "/Files/ref-data/file.json" in put_url

    @patch("fabric_jumpstart.utils._is_fabric_runtime", return_value=False)
    @patch("fabric_jumpstart.utils.resolve_token_credential")
    @patch("fabric_jumpstart.utils.requests")
    def test_upload_empty_destination_path(
        self, mock_requests, mock_cred, _mock_rt, tmp_path
    ):
        """Empty destination_path uploads to the root of Files/."""
        f = tmp_path / "file.json"
        f.write_text("{}")

        cred = MagicMock()
        cred.get_token.return_value = MagicMock(token="tok")
        mock_cred.return_value = cred

        mock_requests.put.return_value = _mock_response(201)
        mock_requests.patch.side_effect = [_mock_response(202), _mock_response(200)]

        upload_files_to_lakehouse("ws-1", "lh-1", f, destination_path="")

        put_url = mock_requests.put.call_args[0][0]
        assert put_url.endswith("/Files/file.json")

    def test_upload_source_not_found_raises(self, tmp_path):
        """Non-existent source_path raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError):
            upload_files_to_lakehouse("ws-1", "lh-1", tmp_path / "nope")

    @patch("fabric_jumpstart.utils._is_fabric_runtime", return_value=False)
    @patch("fabric_jumpstart.utils.resolve_token_credential")
    @patch("fabric_jumpstart.utils.requests")
    def test_upload_create_failure_raises(
        self, mock_requests, mock_cred, _mock_rt, tmp_path
    ):
        """A non-201/409 status on file create raises RuntimeError."""
        f = tmp_path / "file.csv"
        f.write_text("x")

        cred = MagicMock()
        cred.get_token.return_value = MagicMock(token="tok")
        mock_cred.return_value = cred

        mock_requests.put.return_value = _mock_response(403, "Forbidden")

        with pytest.raises(RuntimeError, match="Failed to create file"):
            upload_files_to_lakehouse("ws-1", "lh-1", f)

    @patch("fabric_jumpstart.utils._is_fabric_runtime", return_value=False)
    @patch("fabric_jumpstart.utils.resolve_token_credential")
    @patch("fabric_jumpstart.utils.requests")
    def test_upload_empty_folder_returns_zero(
        self, mock_requests, mock_cred, _mock_rt, tmp_path
    ):
        """An empty directory results in 0 uploads."""
        empty_dir = tmp_path / "empty"
        empty_dir.mkdir()

        cred = MagicMock()
        cred.get_token.return_value = MagicMock(token="tok")
        mock_cred.return_value = cred

        count = upload_files_to_lakehouse("ws-1", "lh-1", empty_dir)

        assert count == 0
        mock_requests.put.assert_not_called()


# ---------------------------------------------------------------------------
# Group 2: JumpstartInstaller.upload_files (installer.py)
# ---------------------------------------------------------------------------


class TestInstallerUploadFiles:
    """Tests for JumpstartInstaller.upload_files orchestration."""

    def test_returns_zero_when_not_configured(self):
        """Config without files_source_path returns 0 immediately."""
        installer = JumpstartInstaller(
            _make_config(), workspace_id="ws-1", instance_name="js"
        )
        result = installer.upload_files(MagicMock(), prefix=None)
        assert result == 0

    @patch("fabric_jumpstart.installer.upload_files_to_lakehouse", return_value=3)
    @patch(
        "fabric_cicd._parameter._utils._extract_item_attribute",
        return_value="lh-id-123",
    )
    def test_applies_prefix_to_lakehouse_name(
        self, mock_extract, mock_upload, tmp_path
    ):
        """Prefix is prepended to the lakehouse name when resolving the ID."""
        config = _make_config(
            files_source_path="data/",
            files_destination_lakehouse="MyLH",
            files_destination_path="output",
        )
        installer = JumpstartInstaller(config, workspace_id="ws-1", instance_name="js")
        installer.working_repo_path = tmp_path
        (tmp_path / "data").mkdir()

        target_ws = MagicMock()
        installer.upload_files(target_ws, prefix="js1_bl__")

        mock_extract.assert_called_once()
        attr_path = mock_extract.call_args[0][1]
        assert attr_path == "$items.Lakehouse.js1_bl__MyLH.$id"

    @patch("fabric_jumpstart.installer.upload_files_to_lakehouse", return_value=1)
    @patch(
        "fabric_cicd._parameter._utils._extract_item_attribute",
        return_value="lh-id-456",
    )
    def test_no_prefix(self, mock_extract, mock_upload, tmp_path):
        """Without prefix, the lakehouse name is used as-is."""
        config = _make_config(
            files_source_path="data/",
            files_destination_lakehouse="MyLH",
        )
        installer = JumpstartInstaller(config, workspace_id="ws-1", instance_name="js")
        installer.working_repo_path = tmp_path
        (tmp_path / "data").mkdir()

        target_ws = MagicMock()
        installer.upload_files(target_ws, prefix=None)

        attr_path = mock_extract.call_args[0][1]
        assert attr_path == "$items.Lakehouse.MyLH.$id"

    def test_raises_without_working_repo_path(self):
        """Raises RuntimeError if working_repo_path is not set."""
        config = _make_config(
            files_source_path="data/",
            files_destination_lakehouse="MyLH",
        )
        installer = JumpstartInstaller(config, workspace_id="ws-1", instance_name="js")
        # working_repo_path is None by default

        with pytest.raises(RuntimeError, match="working_repo_path"):
            installer.upload_files(MagicMock(), prefix=None)

    @patch("fabric_jumpstart.installer.upload_files_to_lakehouse", return_value=2)
    @patch(
        "fabric_cicd._parameter._utils._extract_item_attribute", return_value="lh-id"
    )
    def test_passes_destination_path(self, mock_extract, mock_upload, tmp_path):
        """files_destination_path from config is forwarded to the upload utility."""
        config = _make_config(
            files_source_path="data/",
            files_destination_lakehouse="MyLH",
            files_destination_path="ref-data",
        )
        installer = JumpstartInstaller(config, workspace_id="ws-1", instance_name="js")
        installer.working_repo_path = tmp_path
        (tmp_path / "data").mkdir()

        installer.upload_files(MagicMock(), prefix=None)

        _, kwargs = mock_upload.call_args
        assert kwargs["destination_path"] == "ref-data"

    @patch("fabric_jumpstart.installer.upload_files_to_lakehouse", return_value=1)
    @patch(
        "fabric_cicd._parameter._utils._extract_item_attribute", return_value="lh-id"
    )
    def test_default_destination_path(self, mock_extract, mock_upload, tmp_path):
        """When files_destination_path is omitted, defaults to empty string."""
        config = _make_config(
            files_source_path="data/",
            files_destination_lakehouse="MyLH",
        )
        installer = JumpstartInstaller(config, workspace_id="ws-1", instance_name="js")
        installer.working_repo_path = tmp_path
        (tmp_path / "data").mkdir()

        installer.upload_files(MagicMock(), prefix=None)

        _, kwargs = mock_upload.call_args
        assert kwargs["destination_path"] == ""


# ---------------------------------------------------------------------------
# Group 3: Schema validation (schemas.py)
# ---------------------------------------------------------------------------


class TestSourceFilesSchemaValidation:
    """Tests for files_source_path / files_destination_lakehouse schema rules."""

    def test_both_files_fields_present_is_valid(self):
        src = JumpstartSource(
            workspace_path="demo/",
            preview_image_path="demo/preview.png",
            files_source_path="data/",
            files_destination_lakehouse="MyLH",
        )
        assert src.files_source_path == "data/"
        assert src.files_destination_lakehouse == "MyLH"

    def test_both_files_fields_omitted_is_valid(self):
        src = JumpstartSource(
            workspace_path="demo/",
            preview_image_path="demo/preview.png",
        )
        assert src.files_source_path is None
        assert src.files_destination_lakehouse is None

    def test_only_source_path_raises(self):
        with pytest.raises(
            ValidationError, match="files_source_path and files_destination_lakehouse"
        ):
            JumpstartSource(
                workspace_path="demo/",
                preview_image_path="demo/preview.png",
                files_source_path="data/",
            )

    def test_only_destination_lakehouse_raises(self):
        with pytest.raises(
            ValidationError, match="files_source_path and files_destination_lakehouse"
        ):
            JumpstartSource(
                workspace_path="demo/",
                preview_image_path="demo/preview.png",
                files_destination_lakehouse="MyLH",
            )

    def test_files_destination_path_alone_is_valid(self):
        """files_destination_path by itself is harmless (no-op without the other two)."""
        src = JumpstartSource(
            workspace_path="demo/",
            preview_image_path="demo/preview.png",
            files_destination_path="output",
        )
        assert src.files_destination_path == "output"

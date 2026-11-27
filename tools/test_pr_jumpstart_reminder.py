import re

from tools.pr_jumpstart_reminder import build_comment, build_snippet


def test_build_snippet_escapes_manifest_values_as_python_literals():
    snippet = build_snippet(
        {
            "logical_id": 'lab"`\n--',
            "source": {
                "repo_url": 'https://example.com/"`',
                "repo_ref": "v1\nprint('injected')",
                "workspace_path": "folder/`name",
            },
            "entry_point": 'notebook"`\nprint("injected")',
            "items_in_scope": ['Notebook"`', "Lakehouse"],
        }
    )

    compile(snippet, "<reminder>", "exec")


def test_build_comment_uses_a_fence_longer_than_manifest_backticks():
    snippet = build_snippet(
        {
            "logical_id": "lab",
            "source": {"repo_url": "https://example.com/```"},
            "entry_point": "notebook",
        }
    )

    comment = build_comment(
        {
            "logical_id": "lab",
            "source": {"repo_url": "https://example.com/```"},
            "entry_point": "notebook",
        },
        "src/fabric_jumpstart/fabric_jumpstart/jumpstarts/core/lab.yml",
    )

    longest_backtick_run = max(len(run) for run in re.findall(r"`+", snippet))
    opening_fence = re.search(r"^(`+)python$", comment, flags=re.MULTILINE)

    assert opening_fence is not None
    assert len(opening_fence.group(1)) > longest_backtick_run

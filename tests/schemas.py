"""Pydantic schemas for jumpstart registry validation (test-only)."""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator

from fabric_jumpstart.constants import (
    VALID_JUMPSTART_TYPES,
    VALID_SCENARIO_TAGS,
    VALID_WORKLOAD_TAGS,
    _validate_tags,
)


class JumpstartSource(BaseModel):
    """Source configuration for a jumpstart."""
    workspace_path: str
    preview_image_path: str
    repo_url: Optional[str] = None
    repo_ref: Optional[str] = "main"


class Jumpstart(BaseModel):
    """Schema for a jumpstart entry."""
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    description: str
    date_added: str
    include_in_listing: Optional[bool] = True # excluded from listing if False or not set
    workload_tags: List[str]
    scenario_tags: List[str]
    type: Optional[str] = "Accelerator"
    source: JumpstartSource
    items_in_scope: Optional[List[str]] = None
    feature_flags: Optional[List[str]] = None
    jumpstart_docs_uri: Optional[str] = None
    entry_point: str
    test_suite: Optional[str] = None
    minutes_to_complete_jumpstart: Optional[int] = None
    minutes_to_deploy: Optional[int] = None

    @field_validator("workload_tags")
    @classmethod
    def validate_workloads(cls, value: List[str]):
        return _validate_tags(value, VALID_WORKLOAD_TAGS, "workload_tags")

    @field_validator("scenario_tags")
    @classmethod
    def validate_scenarios(cls, value: List[str]):
        return _validate_tags(value, VALID_SCENARIO_TAGS, "scenario_tags")

    @field_validator("type")
    @classmethod
    def validate_jumpstart_type(cls, value: Optional[str]):
        if value is None:
            return "Accelerator"
        if value not in VALID_JUMPSTART_TYPES:
            allowed_display = ", ".join(VALID_JUMPSTART_TYPES)
            raise ValueError(
                f"Unknown jumpstart_type: {value}. Allowed values: {allowed_display}."
            )
        return value

    @field_validator("minutes_to_complete_jumpstart", "minutes_to_deploy", mode="before")
    @classmethod
    def coerce_minutes(cls, value):
        if value in (None, ""):
            return None
        try:
            minutes = int(value)
        except (TypeError, ValueError):
            raise ValueError("Duration fields must be integers if provided")
        if minutes < 0:
            raise ValueError("Duration fields must be non-negative")
        return minutes

"""Pydantic schemas for jumpstart registry validation (test-only)."""

import re
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

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
    repo_ref: Optional[str] = None

    @model_validator(mode="after")
    def validate_repo_fields(self):
        if self.repo_url:
            ref = (self.repo_ref or "").strip()
            if not ref:
                raise ValueError("repo_ref, a tag of the repository, must be provided when repo_url is set")
        return self


class Jumpstart(BaseModel):
    """Schema for a jumpstart entry."""
    model_config = ConfigDict(extra="ignore")

    id: int
    logical_id: str
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

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: int):
        if value <= 0:
            raise ValueError("id must be a positive integer")
        return value

    @field_validator("logical_id")
    @classmethod
    def validate_logical_id(cls, value: str):
        slug_re = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
        if not value:
            raise ValueError("logical_id must be provided")
        if not slug_re.match(value):
            raise ValueError("logical_id must be lowercase alphanumeric with dashes")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str):
        if len(value) > 250:
            raise ValueError("description must be 250 characters or fewer")
        return value

    @model_validator(mode="after")
    def validate_description_not_prefixed_by_name(self):
        name = (self.name or "").strip()
        desc = (self.description or "").lstrip()
        if name and desc.lower().startswith(name.lower()):
            raise ValueError("description must not start with the jumpstart name")
        return self

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

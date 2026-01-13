"""Pydantic schemas for jumpstart registry."""

from typing import List, Optional

from pydantic import BaseModel, field_validator

VALID_WORKLOAD_TAGS = [
    "Data Engineering",
    "Data Warehouse",
    "Data Science",
    "Real Time Intelligence",
    "Data Factory",
    "SQL Database",
    "Power BI",
    "Test",
]

VALID_SCENARIO_TAGS = [
    "Streaming",
    "Modeling",
    "Monitoring",
    "Data Integration",
    "Batch Processing",
    "Test",
]

WORKLOAD_COLOR_MAP = {
    "Data Engineering": {
        "primary": "#1fb6ef", 
        "secondary": "#096bbc"
    },
    "Data Warehouse": {
        "primary": "#1fb6ef", 
        "secondary": "#096bbc"
    },
    "Data Science": {
        "primary": "#1fb6ef", 
        "secondary": "#096bbc"
    },
    "Real Time Intelligence": {
        "primary": "#fa4e56", 
        "secondary": "#a41836"
    },
    "Data Factory": {
        "primary": "#239C6E", 
        "secondary": "#0C695A"
    },
    "SQL Database": {
        "primary": "#7e5ca7", 
        "secondary": "#633e8f"
    },
    "Test": {
        "primary": "#117865", 
        "secondary": "#0C695A"
    },
    "Power BI": {
        "primary": "#ffe642", 
        "secondary": "#e2c718"
    },
}


#WORKLOAD_COLOR_MAP = {
#    "Data Engineering": {
#        "primary": "#2c72a8", 
#        "secondary": "#20547c"
#    },
#    "Data Warehouse": {
#        "primary": "#2c72a8", 
#        "secondary": "#20547c"
#    },
#    "Real Time Intelligence": {
#        "primary": "#bc2f32", 
#        "secondary": "#751d1f"
#    },
#    "Data Factory": {
#        "primary": "#11910d", 
#        "secondary": "#0e7a0b"
#    },
#    "SQL Database": {
#        "primary": "#9f3faf", 
#        "secondary": "#863593"
#    },
#    "Test": {
#        "primary": "#9f3faf", 
#        "secondary": "#863593"
#    },
#}

DEFAULT_WORKLOAD_COLORS = WORKLOAD_COLOR_MAP["Data Engineering"]


def _validate_tags(tags: List[str], allowed: List[str], field_name: str) -> List[str]:
    """Ensure tag values are non-empty and drawn from the approved list."""
    if not tags:
        raise ValueError(f"At least one value must be provided for {field_name}")

    unknown = [tag for tag in tags if tag not in allowed]
    if unknown:
        allowed_display = ", ".join(allowed)
        unknown_display = ", ".join(unknown)
        raise ValueError(
            f"Unknown {field_name}: {unknown_display}. Allowed values: {allowed_display}."
        )

    return tags


class JumpstartSource(BaseModel):
    """Source configuration for a jumpstart."""
    workspace_path: str
    repo_url: Optional[str] = None
    repo_ref: Optional[str] = "main"


class Jumpstart(BaseModel):
    """Schema for a jumpstart entry."""
    id: str
    name: str
    description: str
    date_added: str
    include_in_listing: Optional[bool] = True # excluded from listing if False or not set
    workload_tags: List[str]
    scenario_tags: List[str]
    preview_image: Optional[str] = None
    source: JumpstartSource
    items_in_scope: Optional[List[str]] = None
    feature_flags: Optional[List[str]] = None
    test_suite: Optional[str] = None

    @field_validator("workload_tags")
    @classmethod
    def validate_workloads(cls, value: List[str]):
        return _validate_tags(value, VALID_WORKLOAD_TAGS, "workload_tags")

    @field_validator("scenario_tags")
    @classmethod
    def validate_scenarios(cls, value: List[str]):
        return _validate_tags(value, VALID_SCENARIO_TAGS, "scenario_tags")

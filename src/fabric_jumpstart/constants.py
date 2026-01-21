"""Constants for jumpstart registry."""

from typing import List

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

VALID_JUMPSTART_TYPES = [
    "Accelerator",
    "Tutorial",
    "Demo",
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

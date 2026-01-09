"""Pydantic schemas for jumpstart registry."""

from typing import List, Optional

from pydantic import BaseModel


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
    workload_tags: Optional[List[str]] = None
    scenario_tags: Optional[List[str]] = None
    preview_image: Optional[str] = None
    source: JumpstartSource
    items_in_scope: Optional[List[str]] = None
    feature_flags: Optional[List[str]] = None
    test_suite: Optional[str] = None

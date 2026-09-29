from fastapi import APIRouter
from typing import Dict, Any
from backend.app.db import db
from backend.app.models.schemas import AOIStats

router = APIRouter(prefix="/api/stats", tags=["analytics"])

@router.get("", response_model=AOIStats)
def get_aoi_stats():
    """
    Returns executive-level cadastral stats, triage savings rate,
    and priority distribution for the current AOI.
    """
    return db.get_stats()

@router.get("/metadata", response_model=Dict[str, Any])
def get_aoi_metadata():
    """Returns AOI geographical bounding box, center, and survey authority."""
    return db.aoi_metadata

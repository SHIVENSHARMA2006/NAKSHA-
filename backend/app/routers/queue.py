from fastapi import APIRouter, Query
from typing import List, Optional
from backend.app.db import db
from backend.app.models.schemas import ParcelDetail

router = APIRouter(prefix="/api/queue", tags=["queue"])

@router.get("", response_model=List[ParcelDetail])
def get_verification_queue(status: Optional[str] = Query(None)):
    """
    Returns the triage verification queue sorted descending by priority score.
    Parcels with high conflict and severe divergence appear first.
    """
    return db.get_queue(status=status)

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
from backend.app.db import db
from backend.app.models.schemas import ParcelDetail, ConflictDetail, AuditLogEntry
from backend.app.services.audit_service import audit_service

router = APIRouter(prefix="/api/parcels", tags=["parcels"])

@router.get("", response_model=Dict[str, Any])
def get_all_parcels(
    min_priority: float = Query(0.0, ge=0.0, le=100.0),
    status: Optional[str] = Query(None, description="ai_proposed | flagged | field_verified | approved"),
    band: Optional[str] = Query(None, description="critical | high | moderate | low")
):
    """Returns GeoJSON FeatureCollection of all parcels filterable by priority and verification status."""
    return db.get_all_parcels_geojson(min_priority=min_priority, status=status, band=band)

@router.get("/{parcel_id}", response_model=ParcelDetail)
def get_parcel_detail(parcel_id: str):
    """Returns full parcel dossier including AI polygon, legacy polygon, GNSS points, and explainability."""
    parcel = db.get_parcel(parcel_id)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel {parcel_id} not found in AOI database")
    return parcel

@router.get("/{parcel_id}/conflicts", response_model=ConflictDetail)
def get_parcel_conflict(parcel_id: str):
    """Returns geometric divergence details between AI and legacy cadastral layer."""
    parcel = db.get_parcel(parcel_id)
    if not parcel or not parcel.conflict:
        raise HTTPException(status_code=404, detail=f"No conflict record for parcel {parcel_id}")
    return parcel.conflict

@router.get("/{parcel_id}/audit", response_model=List[AuditLogEntry])
def get_parcel_audit_log(parcel_id: str):
    """Returns immutable cadastral audit history for the parcel."""
    return audit_service.get_entries_for_parcel(parcel_id)

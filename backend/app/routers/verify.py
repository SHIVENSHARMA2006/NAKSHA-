from fastapi import APIRouter, HTTPException
from backend.app.db import db
from backend.app.models.schemas import VerifyActionRequest, ParcelDetail
from backend.app.services.audit_service import audit_service
from backend.app.routers.ws import ws_manager

router = APIRouter(prefix="/api/parcels", tags=["verification"])

@router.post("/{parcel_id}/verify", response_model=ParcelDetail)
async def verify_parcel(parcel_id: str, request: VerifyActionRequest):
    """
    Submits a surveyor verification decision (approve, edit, flag, reject).
    Writes an immutable audit entry and broadcasts queue re-ranking via WebSocket.
    """
    existing = db.get_parcel(parcel_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Parcel {parcel_id} not found")

    geom_before = existing.ai_geometry

    # Apply the verification transition
    updated = db.verify_parcel(
        parcel_id=parcel_id,
        action=request.action,
        actor=request.actor,
        edited_geometry=request.edited_geometry,
        notes=request.notes
    )

    # Immutable audit logging
    audit_entry = audit_service.record_action(
        parcel_code=parcel_id,
        actor=request.actor,
        action=request.action,
        geom_before=geom_before,
        geom_after=updated.ai_geometry,
        notes=request.notes
    )

    # Broadcast real-time update to all connected WebSocket clients
    await ws_manager.broadcast({
        "event": "parcel_verified",
        "parcel_id": parcel_id,
        "action": request.action,
        "status": updated.verification_status,
        "new_priority_score": updated.priority_score,
        "audit_id": audit_entry.id
    })

    return updated

@router.post("/{parcel_id}/snap-gnss", response_model=ParcelDetail)
async def snap_parcel_to_gnss(parcel_id: str, max_dist_m: float = 15.0):
    """
    Snaps the closest AI polygon vertex to the nearest Survey of India CORS station anchor.
    Logs the action and updates the parcel boundary.
    """
    existing = db.get_parcel(parcel_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Parcel {parcel_id} not found")

    geom_before = existing.ai_geometry
    updated = db.snap_parcel_to_gnss(parcel_id, max_dist_m=max_dist_m)
    if not updated:
        raise HTTPException(status_code=400, detail="No GNSS/CORS stations within snapping threshold")

    audit_entry = audit_service.record_action(
        parcel_code=parcel_id,
        actor="CORS Auto-Anchor Engine",
        action="gnss_vertex_snap",
        geom_before=geom_before,
        geom_after=updated.ai_geometry,
        notes="Automated snap to Survey of India CORS ground truth anchor."
    )

    await ws_manager.broadcast({
        "event": "parcel_snapped",
        "parcel_id": parcel_id,
        "action": "gnss_snap",
        "new_geometry": updated.ai_geometry.model_dump()
    })

    return updated

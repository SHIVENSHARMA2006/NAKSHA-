from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

class GeometryModel(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]

class GNSSPoint(BaseModel):
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    accuracy_cm: float = 1.2
    residual_m: float = 0.31
    is_cors_anchor: bool = True

class ConflictDetail(BaseModel):
    legacy_parcel_id: str
    iou: float
    hausdorff_distance_m: float
    divergence_area_sqm: float
    encroachment_detected: bool = False
    severity: str  # "minor" | "moderate" | "severe"

class ParcelBase(BaseModel):
    parcel_code: str
    khasra_number: str
    revenue_ward: str
    village_name: str
    area_sqm: float
    verification_status: str = "ai_proposed"  # "ai_proposed" | "flagged" | "field_verified" | "approved"
    priority_score: float = 0.0
    priority_band: str = "low"  # "low" | "moderate" | "high" | "critical"
    segmentation_confidence: float = 0.85
    landuse_class: str = "residential"
    landuse_confidence: float = 0.90
    floors: int = 1
    height_m: float = 3.5

class ParcelDetail(ParcelBase):
    id: str
    ai_geometry: GeometryModel
    legacy_geometry: Optional[GeometryModel] = None
    gnss_points: List[GNSSPoint] = []
    conflict: Optional[ConflictDetail] = None
    recommendation: str
    why_flagged: Dict[str, Any]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ParcelGeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    properties: Dict[str, Any]
    geometry: GeometryModel

class ParcelGeoJSONCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[ParcelGeoJSONFeature]

class VerifyActionRequest(BaseModel):
    action: str  # "approve" | "approve_with_edit" | "flag_for_field" | "reject"
    actor: str = "Surveyor Officer (DoLR)"
    notes: Optional[str] = None
    edited_geometry: Optional[GeometryModel] = None
    snap_to_gnss_station: Optional[str] = None

class AuditLogEntry(BaseModel):
    id: str
    parcel_code: str
    timestamp: datetime
    actor: str
    action: str
    notes: Optional[str] = None
    geom_before: Optional[GeometryModel] = None
    geom_after: Optional[GeometryModel] = None
    hash_signature: str

class AOIStats(BaseModel):
    aoi_name: str
    total_area_sqkm: float
    total_parcels: int
    critical_disputes: int
    high_priority: int
    moderate_priority: int
    low_priority: int
    field_verified_count: int
    approved_count: int
    triage_savings_percentage: float  # e.g., 87.5% need no field visit
    average_iou: float
    cors_stations_count: int

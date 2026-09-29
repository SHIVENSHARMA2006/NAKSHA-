export type VerificationStatus = 'ai_proposed' | 'flagged' | 'field_verified' | 'approved';
export type PriorityBand = 'low' | 'moderate' | 'high' | 'critical';

export interface GNSSPoint {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  accuracy_cm: number;
  residual_m: number;
  is_cors_anchor: boolean;
}

export interface ConflictDetail {
  legacy_parcel_id: string;
  iou: number;
  hausdorff_distance_m: number;
  divergence_area_sqm: number;
  encroachment_detected: boolean;
  severity: 'minor' | 'moderate' | 'severe';
}

export interface ParcelDetail {
  id: string;
  parcel_code: string;
  khasra_number: string;
  revenue_ward: string;
  village_name: string;
  area_sqm: number;
  verification_status: VerificationStatus;
  priority_score: number;
  priority_band: PriorityBand;
  segmentation_confidence: number;
  landuse_class: string;
  landuse_confidence: number;
  floors: number;
  height_m: number;
  ai_geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [[[lon, lat], ...]]
  };
  legacy_geometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  gnss_points: GNSSPoint[];
  conflict?: ConflictDetail;
  recommendation: string;
  why_flagged: {
    conflict_severity: number;
    seg_uncertainty: number;
    gnss_score: number;
    landuse_uncertainty: number;
    iou: number;
    hausdorff_m: number;
    gnss_residual_m?: number | null;
    has_nearby_gnss: boolean;
    weights: {
      conflict: number;
      segmentation: number;
      gnss: number;
      landuse: number;
    };
  };
  updated_at: string;
}

export interface ParcelGeoJSONFeature {
  type: 'Feature';
  id: string;
  properties: {
    id: string;
    parcel_code: string;
    khasra_number: string;
    revenue_ward: string;
    priority_score: number;
    priority_band: PriorityBand;
    verification_status: VerificationStatus;
    segmentation_confidence: number;
    landuse_class: string;
    area_sqm: number;
    floors: number;
    height_m: number;
    iou: number;
    hausdorff_m: number;
    has_gnss: boolean;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface ParcelGeoJSONCollection {
  type: 'FeatureCollection';
  features: ParcelGeoJSONFeature[];
}

export interface RoadFeature {
  type: 'Feature';
  id: string;
  properties: {
    road_id: string;
    name: string;
    type: string;
    width_m: number;
  };
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
}

export interface AuditLogEntry {
  id: string;
  parcel_code: string;
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
  geom_before?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  geom_after?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  hash_signature: string;
}

export interface AOIStats {
  aoi_name: string;
  total_area_sqkm: number;
  total_parcels: number;
  critical_disputes: number;
  high_priority: number;
  moderate_priority: number;
  low_priority: number;
  field_verified_count: number;
  approved_count: number;
  triage_savings_percentage: number;
  average_iou: number;
  cors_stations_count: number;
}

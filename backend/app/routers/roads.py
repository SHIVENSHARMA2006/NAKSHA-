from fastapi import APIRouter
from typing import Dict, Any, List
from backend.app.db import db
from backend.app.models.schemas import GNSSPoint

router = APIRouter(prefix="/api", tags=["geospatial_layers"])

@router.get("/roads", response_model=Dict[str, Any])
def get_road_network():
    """Returns GeoJSON FeatureCollection of road centerlines and access corridors."""
    features = []
    for r in db.roads:
        features.append({
            "type": "Feature",
            "id": r["road_id"],
            "properties": {
                "road_id": r["road_id"],
                "name": r["name"],
                "type": r["type"],
                "width_m": r["width_m"]
            },
            "geometry": {
                "type": "LineString",
                "coordinates": r["coordinates"]
            }
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/cors", response_model=List[GNSSPoint])
def get_cors_stations():
    """Returns Survey of India CORS ground control stations with sub-meter coordinates."""
    return db.cors_stations

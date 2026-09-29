import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import json

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed")

@router.get("/summary")
def get_dataset_summary():
    """Returns metadata summary of the authentic cadastral dataset."""
    json_path = os.path.join(DATA_DIR, "parcels_ml_dataset.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Dataset not found")

    with open(json_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    total_records = len(records)
    critical_count = sum(1 for r in records if r["priority_band"] == "critical")
    field_survey_needed = sum(1 for r in records if r["field_survey_required"] == 1)
    avg_area = sum(r["area_sqm"] for r in records) / max(1, total_records)
    avg_iou = sum(r["legacy_khasra_iou"] for r in records) / max(1, total_records)

    return {
        "dataset_name": "NAKSHA-AI Authentic Urban Cadastral Fabric (Zone 4 Delhi)",
        "authority": "Department of Land Resources (DoLR) / Survey of India (SVAMITVA)",
        "total_parcels": total_records,
        "critical_disputes": critical_count,
        "field_survey_required": field_survey_needed,
        "fast_track_automation_percentage": round((total_records - field_survey_needed) / total_records * 100, 1),
        "mean_parcel_area_sqm": round(avg_area, 2),
        "mean_legacy_concordance_iou": round(avg_iou, 3),
        "coordinate_reference_system": "EPSG:4326 (WGS84) with UTM 43N metric features",
        "cors_anchor_network": "Survey of India Geodetic CORS (5 stations)",
        "download_links": {
            "csv": "/api/dataset/download/csv",
            "geojson": "/api/dataset/download/geojson",
            "json": "/api/dataset/download/json"
        }
    }

@router.get("/download/csv")
def download_csv():
    """Download the prepared ML tabular dataset in CSV format."""
    path = os.path.join(DATA_DIR, "parcels_ml_dataset.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="CSV file not found")
    return FileResponse(path, media_type="text/csv", filename="naksha_cadastral_dataset.csv")

@router.get("/download/geojson")
def download_geojson():
    """Download the authentic cadastral fabric in GeoJSON format."""
    path = os.path.join(DATA_DIR, "cadastral_fabric.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="GeoJSON file not found")
    return FileResponse(path, media_type="application/geo+json", filename="naksha_cadastral_fabric.geojson")

@router.get("/download/json")
def download_json():
    """Download the prepared dataset in JSON format."""
    path = os.path.join(DATA_DIR, "parcels_ml_dataset.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="JSON file not found")
    return FileResponse(path, media_type="application/json", filename="naksha_cadastral_dataset.json")

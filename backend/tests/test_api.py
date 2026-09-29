import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.priority_service import compute_priority_score
from backend.app.services.spatial_engine import coords_to_polygon, compute_iou, compute_hausdorff_distance_m

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/api/system")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "NAKSHA-AI Cadastral Decision Support Engine"

def test_static_spa_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "NAKSHA-AI" in response.text

def test_get_parcels_geojson():
    response = client.get("/api/parcels")
    assert response.status_code == 200
    geojson = response.json()
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) > 0
    # Check property schema
    first = geojson["features"][0]
    assert "priority_score" in first["properties"]
    assert "verification_status" in first["properties"]
    assert "parcel_code" in first["properties"]

def test_flagship_parcel_aoi_0341():
    response = client.get("/api/parcels/AOI-0341")
    assert response.status_code == 200
    data = response.json()
    assert data["parcel_code"] == "AOI-0341"
    assert data["priority_score"] == 87.0
    assert data["priority_band"] == "critical"
    assert data["conflict"]["severity"] == "severe"
    assert data["conflict"]["iou"] == 0.42
    assert data["conflict"]["hausdorff_distance_m"] == 6.8
    assert len(data["gnss_points"]) > 0

def test_queue_sorting():
    response = client.get("/api/queue")
    assert response.status_code == 200
    queue = response.json()
    assert len(queue) > 0
    # Must be sorted descending by priority_score
    scores = [p["priority_score"] for p in queue]
    assert scores == sorted(scores, reverse=True)
    # First item should be critical
    assert queue[0]["priority_band"] == "critical"

def test_priority_score_formula():
    score, band, breakdown = compute_priority_score(
        iou=0.42,
        hausdorff_distance_m=6.8,
        segmentation_confidence=0.74,
        gnss_residual_m=0.31,
        has_nearby_gnss=True,
        landuse_confidence=0.88,
        encroachment_detected=True
    )
    assert 0.0 <= score <= 100.0
    assert band in ["critical", "high", "moderate", "low"]
    assert "conflict_severity" in breakdown
    assert "seg_uncertainty" in breakdown

def test_verify_action_flow():
    # Verify AOI-0205
    payload = {
        "action": "approve",
        "actor": "Senior Cadastral Officer Verma",
        "notes": "Desk review verified against registered sale deed 1994."
    }
    response = client.post("/api/parcels/AOI-0205/verify", json=payload)
    assert response.status_code == 200
    updated = response.json()
    assert updated["verification_status"] == "approved"
    assert updated["priority_band"] == "low"

    # Audit history must have logged this
    audit_resp = client.get("/api/parcels/AOI-0205/audit")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) > 0
    assert logs[-1]["action"] == "approve"
    assert logs[-1]["actor"] == "Senior Cadastral Officer Verma"

def test_gnss_snapping():
    response = client.post("/api/parcels/AOI-0341/snap-gnss?max_dist_m=25.0")
    assert response.status_code == 200
    data = response.json()
    assert "Snapped vertex to Survey of India CORS" in data["recommendation"]

def test_stats_endpoint():
    response = client.get("/api/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_parcels"] > 0
    assert stats["triage_savings_percentage"] > 70.0

def test_dataset_summary_endpoint():
    response = client.get("/api/dataset/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_parcels"] > 0
    assert "download_links" in data
    assert "cors_anchor_network" in data

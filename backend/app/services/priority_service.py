import math
from typing import Dict, Any, Tuple, Optional
from backend.app.services.spatial_engine import (
    coords_to_polygon, compute_iou, compute_hausdorff_distance_m, compute_polygon_area_sqm
)

def compute_priority_score(
    iou: float,
    hausdorff_distance_m: float,
    segmentation_confidence: float,
    gnss_residual_m: Optional[float],
    has_nearby_gnss: bool,
    landuse_confidence: float,
    encroachment_detected: bool = False
) -> Tuple[float, str, Dict[str, Any]]:
    """
    Computes the Verification Priority Score (0 - 100) per Section 8.4:
    Priority = clip(
        0.35 * conflict_severity +
        0.30 * seg_uncertainty +
        0.20 * gnss_score +
        0.15 * landuse_uncertainty,
        0, 100
    )
    """
    # 1. Conflict severity: 0 (perfect match) to 100 (severe mismatch)
    # Based on IoU (lower IoU = higher conflict) and Hausdorff distance
    iou_penalty = (1.0 - max(0.0, min(1.0, iou))) * 70.0  # up to 70 pts
    hausdorff_penalty = min(30.0, (hausdorff_distance_m / 10.0) * 30.0)  # up to 30 pts
    conflict_severity = min(100.0, iou_penalty + hausdorff_penalty)
    if encroachment_detected:
        conflict_severity = min(100.0, conflict_severity + 15.0)

    # 2. Segmentation uncertainty: 0 to 100 (lower model confidence = higher uncertainty)
    seg_uncertainty = (1.0 - max(0.0, min(1.0, segmentation_confidence))) * 100.0

    # 3. GNSS ground-truth residual penalty:
    if has_nearby_gnss and gnss_residual_m is not None:
        # If residual is small (< 0.5m), gnss confirms the boundary -> low score (trustworthy)
        # If residual is large (> 2.0m), strong disagreement with survey ground truth -> higher score
        gnss_score = min(100.0, (gnss_residual_m / 2.0) * 50.0)
    else:
        # No ground truth CORS/GCP nearby: moderate uncertainty penalty (50)
        gnss_score = 50.0

    # 4. Land-use ambiguity:
    landuse_uncertainty = (1.0 - max(0.0, min(1.0, landuse_confidence))) * 100.0

    # Weighted fusion
    raw_priority = (
        0.35 * conflict_severity +
        0.30 * seg_uncertainty +
        0.20 * gnss_score +
        0.15 * landuse_uncertainty
    )
    priority_score = round(max(0.0, min(100.0, raw_priority)), 1)

    # Band classification per Section 10.2
    if priority_score >= 85.0:
        band = "critical"
    elif priority_score >= 60.0:
        band = "high"
    elif priority_score >= 30.0:
        band = "moderate"
    else:
        band = "low"

    breakdown = {
        "conflict_severity": round(conflict_severity, 1),
        "seg_uncertainty": round(seg_uncertainty, 1),
        "gnss_score": round(gnss_score, 1),
        "landuse_uncertainty": round(landuse_uncertainty, 1),
        "iou": round(iou, 3),
        "hausdorff_m": round(hausdorff_distance_m, 2),
        "gnss_residual_m": round(gnss_residual_m, 2) if gnss_residual_m is not None else None,
        "has_nearby_gnss": has_nearby_gnss,
        "weights": {
            "conflict": 0.35,
            "segmentation": 0.30,
            "gnss": 0.20,
            "landuse": 0.15
        }
    }

    return priority_score, band, breakdown

def generate_recommendation(
    parcel_code: str,
    band: str,
    iou: float,
    hausdorff_m: float,
    has_nearby_gnss: bool,
    gnss_residual_m: Optional[float],
    encroachment_detected: bool,
    landuse_class: str
) -> str:
    """Generates an explainable, human-in-the-loop recommendation for the surveyor."""
    if band == "critical":
        if encroachment_detected or hausdorff_m > 5.0:
            rec = (
                f"CRITICAL DISCREPANCY: Boundary diverges by {hausdorff_m}m from legacy record (IoU: {iou:.2f}). "
            )
            if has_nearby_gnss and gnss_residual_m is not None:
                rec += (
                    f"Survey of India CORS station anchor available (residual: {gnss_residual_m:.2f}m). "
                    f"Recommend field surveyor verify ground markers or execute one-click GNSS snap before approval."
                )
            else:
                rec += "No CORS anchor available in immediate vicinity. Urgent physical ground verification required."
            return rec
        else:
            return (
                f"CRITICAL REVIEW: Severe divergence (IoU {iou:.2f}, {hausdorff_m}m drift). "
                f"Flagged for priority field inspection by DoLR ground survey team."
            )
    elif band == "high":
        return (
            f"HIGH REVIEW: Notable boundary variance ({hausdorff_m}m). Land-use tagged as {landuse_class}. "
            f"Review AI vertex alignment against cadastral record prior to official sign-off."
        )
    elif band == "moderate":
        return (
            f"MODERATE VARIANCE: Minor {hausdorff_m}m drift within acceptable legal tolerance buffer. "
            f"Eligible for surveyor desk verification."
        )
    else:
        return (
            f"VERIFIED CONCORDANCE: High IoU ({iou:.2f}) and sub-meter agreement with cadastral reference. "
            f"Recommended for fast-track automated approval."
        )

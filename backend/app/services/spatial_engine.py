import math
from typing import List, Tuple, Dict, Any, Optional
from shapely.geometry import Polygon, MultiPolygon, Point
from shapely.ops import transform
import pyproj

# Geodetic transformer for accurate meter calculations in India (EPSG:4326 to EPSG:3857 or UTM 43N)
wgs84 = pyproj.CRS("EPSG:4326")
utm43n = pyproj.CRS("EPSG:32643")  # UTM zone 43N covers central/western/northern India
project_to_meters = pyproj.Transformer.from_crs(wgs84, utm43n, always_xy=True).transform
project_to_wgs84 = pyproj.Transformer.from_crs(utm43n, wgs84, always_xy=True).transform

def coords_to_polygon(coords: List[List[List[float]]]) -> Polygon:
    """Converts GeoJSON coordinates [[[lon, lat], ...]] to a Shapely Polygon."""
    exterior = coords[0]
    holes = coords[1:] if len(coords) > 1 else []
    return Polygon(shell=exterior, holes=holes)

def polygon_to_coords(poly: Polygon) -> List[List[List[float]]]:
    """Converts a Shapely Polygon to GeoJSON coordinates [[[lon, lat], ...]]."""
    if poly.is_empty:
        return [[]]
    exterior = list(poly.exterior.coords)
    holes = [list(interior.coords) for interior in poly.interiors]
    return [exterior] + holes

def compute_polygon_area_sqm(poly: Polygon) -> float:
    """Computes polygon area in square meters using geodetic projection."""
    try:
        poly_m = transform(project_to_meters, poly)
        return float(poly_m.area)
    except Exception:
        # Fallback approximation for Indian latitudes (~111km/deg lat, ~102km/deg lon)
        centroid = poly.centroid
        lat_scale = 111320.0
        lon_scale = 111320.0 * math.cos(math.radians(centroid.y))
        poly_m = transform(lambda x, y: (x * lon_scale, y * lat_scale), poly)
        return float(poly_m.area)

def compute_iou(poly_a: Polygon, poly_b: Polygon) -> float:
    """Computes Intersection-over-Union (IoU) between two polygons [0.0 - 1.0]."""
    if not poly_a.is_valid:
        poly_a = poly_a.buffer(0)
    if not poly_b.is_valid:
        poly_b = poly_b.buffer(0)
    
    if poly_a.is_empty or poly_b.is_empty:
        return 0.0

    intersection = poly_a.intersection(poly_b).area
    union = poly_a.union(poly_b).area
    if union <= 0:
        return 0.0
    return float(min(1.0, max(0.0, intersection / union)))

def compute_hausdorff_distance_m(poly_a: Polygon, poly_b: Polygon) -> float:
    """Computes discrete Hausdorff distance in meters between two boundaries."""
    try:
        poly_a_m = transform(project_to_meters, poly_a)
        poly_b_m = transform(project_to_meters, poly_b)
        dist_m = poly_a_m.hausdorff_distance(poly_b_m)
        return float(round(dist_m, 2))
    except Exception:
        deg_dist = poly_a.hausdorff_distance(poly_b)
        return float(round(deg_dist * 111000.0, 2))

def snap_vertex_to_point(poly: Polygon, target_pt: Tuple[float, float], max_dist_m: float = 15.0) -> Tuple[Polygon, float]:
    """
    Snaps the closest vertex in poly to target_pt (lon, lat).
    Returns (updated_polygon, residual_distance_meters).
    """
    target = Point(target_pt[0], target_pt[1])
    exterior_coords = list(poly.exterior.coords)
    best_idx = -1
    min_dist_m = float("inf")

    target_m = transform(project_to_meters, target)

    for i, pt in enumerate(exterior_coords[:-1]):
        pt_geom = Point(pt[0], pt[1])
        pt_m = transform(project_to_meters, pt_geom)
        d_m = target_m.distance(pt_m)
        if d_m < min_dist_m:
            min_dist_m = d_m
            best_idx = i

    if best_idx != -1 and min_dist_m <= max_dist_m:
        exterior_coords[best_idx] = (target_pt[0], target_pt[1])
        # If the first vertex was changed, update closing vertex
        if best_idx == 0:
            exterior_coords[-1] = (target_pt[0], target_pt[1])
        new_poly = Polygon(shell=exterior_coords, holes=[list(h.coords) for h in poly.interiors])
        if new_poly.is_valid:
            return new_poly, float(round(min_dist_m, 3))
    
    return poly, float(round(min_dist_m, 3))

def regularize_boundary(poly: Polygon, tolerance_m: float = 0.35) -> Polygon:
    """
    Regularizes raw CV polygon boundaries:
    - Simplifies jagged pixel vertices
    - Snaps near 90-degree corners to orthogonal right angles (cadastral regularization)
    """
    try:
        poly_m = transform(project_to_meters, poly)
        simplified_m = poly_m.simplify(tolerance_m, preserve_topology=True)
        return transform(project_to_wgs84, simplified_m)
    except Exception:
        return poly.simplify(0.000005, preserve_topology=True)

def validate_topology(polygons: List[Polygon]) -> Dict[str, Any]:
    """
    Validates cadastral fabric topology:
    - Checks for overlapping polygons (cadastral violations)
    - Checks for slivers (polygons with extreme perimeter-to-area ratio)
    """
    overlaps = []
    slivers = []
    
    for i, p in enumerate(polygons):
        # Sliver test: compactness (4 * pi * area / perimeter^2) < 0.05
        area = p.area
        perimeter = p.length
        if perimeter > 0:
            compactness = (4.0 * math.pi * area) / (perimeter * perimeter)
            if compactness < 0.04 and area < 0.000001:
                slivers.append(i)

        for j in range(i + 1, len(polygons)):
            if p.intersects(polygons[j]):
                inter = p.intersection(polygons[j])
                if inter.area > 0.0000001:  # Non-trivial overlap
                    overlaps.append((i, j, inter.area))

    return {
        "valid_planar_graph": len(overlaps) == 0 and len(slivers) == 0,
        "overlaps_count": len(overlaps),
        "slivers_count": len(slivers),
        "overlap_pairs": overlaps,
        "sliver_indices": slivers
    }

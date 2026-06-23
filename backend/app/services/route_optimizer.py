"""
Pure-function route optimizer.
Algorithm: nearest-neighbor greedy construction + 2-opt local search.
No I/O — fully deterministic and unit-testable without a database.
"""
import math
from dataclasses import dataclass
from typing import Optional


@dataclass
class ContainerPoint:
    container_id: str
    qr_code: str
    lat: float
    lng: float
    fill_level: Optional[int]
    status: str


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance in km between two WGS-84 points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _route_distance(order: list[int], pts: list[ContainerPoint]) -> float:
    if len(order) < 2:
        return 0.0
    total = 0.0
    for i in range(len(order) - 1):
        a, b = pts[order[i]], pts[order[i + 1]]
        total += haversine(a.lat, a.lng, b.lat, b.lng)
    return total


def _nearest_neighbor(pts: list[ContainerPoint]) -> list[int]:
    n = len(pts)
    if n == 0:
        return []
    visited = [False] * n
    order = [0]
    visited[0] = True
    for _ in range(n - 1):
        last = order[-1]
        best_d, best_j = float("inf"), -1
        for j in range(n):
            if visited[j]:
                continue
            d = haversine(pts[last].lat, pts[last].lng, pts[j].lat, pts[j].lng)
            if d < best_d:
                best_d, best_j = d, j
        order.append(best_j)
        visited[best_j] = True
    return order


def _two_opt(order: list[int], pts: list[ContainerPoint]) -> list[int]:
    """Single pass 2-opt improvement."""
    improved = True
    while improved:
        improved = False
        n = len(order)
        for i in range(1, n - 1):
            for j in range(i + 1, n):
                a, b = order[i - 1], order[i]
                c, d = order[j], order[(j + 1) % n]
                before = (
                    haversine(pts[a].lat, pts[a].lng, pts[b].lat, pts[b].lng)
                    + haversine(pts[c].lat, pts[c].lng, pts[d].lat, pts[d].lng)
                )
                after = (
                    haversine(pts[a].lat, pts[a].lng, pts[c].lat, pts[c].lng)
                    + haversine(pts[b].lat, pts[b].lng, pts[d].lat, pts[d].lng)
                )
                if after < before - 1e-10:
                    order[i: j + 1] = order[i: j + 1][::-1]
                    improved = True
    return order


def optimize(pts: list[ContainerPoint]) -> tuple[list[ContainerPoint], float]:
    """
    Return (ordered_points, total_distance_km).
    Uses nearest-neighbor seeding + 2-opt local search.
    Skips optimization for ≤ 2 points.
    """
    if len(pts) == 0:
        return [], 0.0
    if len(pts) == 1:
        return pts, 0.0
    order = _nearest_neighbor(pts)
    if len(pts) >= 3:
        order = _two_opt(order, pts)
    dist = _route_distance(order, pts)
    return [pts[i] for i in order], round(dist, 3)

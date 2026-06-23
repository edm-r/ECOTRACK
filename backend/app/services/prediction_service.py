"""
Prédiction du niveau de remplissage par régression linéaire.
Utilise numpy.polyfit sur les N dernières mesures — pas de modèle pré-entraîné,
donc aucun fichier .pkl à gérer et aucune dépendance externe supplémentaire.
"""
import uuid
from typing import Optional

import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.analytics import PredictionPoint, PredictionResponse

HORIZONS = [24, 48]
HISTORY_HOURS = 72
MIN_POINTS = 2


async def predict_container(
    container_id: uuid.UUID,
    db: AsyncSession,
) -> PredictionResponse:
    rows = (await db.execute(
        text("""
            SELECT fill_level,
                   EXTRACT(EPOCH FROM measured_at) AS epoch
            FROM iot_measurements
            WHERE container_id = :cid
              AND measured_at > NOW() - INTERVAL ':h hours'
            ORDER BY measured_at ASC
        """.replace(":h", str(HISTORY_HOURS))),
        {"cid": container_id},
    )).fetchall()

    current_fill: Optional[float] = None
    if rows:
        current_fill = float(rows[-1][0])

    predictions = _predict(rows, current_fill)
    return PredictionResponse(
        container_id=container_id,
        current_fill=current_fill,
        predictions=predictions,
    )


def _predict(
    rows: list,
    current_fill: Optional[float],
) -> list[PredictionPoint]:
    if len(rows) < MIN_POINTS:
        base = current_fill or 50.0
        return [
            PredictionPoint(
                horizon_h=h,
                predicted_fill=_clip(base),
                confidence_low=_clip(base - 10),
                confidence_high=_clip(base + 10),
            )
            for h in HORIZONS
        ]

    epochs = np.array([r[1] for r in rows], dtype=float)
    fills = np.array([r[0] for r in rows], dtype=float)

    # Normalise to hours from first measurement
    t0 = epochs[0]
    hours = (epochs - t0) / 3600.0

    coeffs = np.polyfit(hours, fills, deg=1)
    trend = np.poly1d(coeffs)

    residuals = fills - trend(hours)
    std = float(np.std(residuals)) if len(residuals) > 1 else 5.0
    margin = max(std * 2, 3.0)

    last_h = hours[-1]
    return [
        PredictionPoint(
            horizon_h=h,
            predicted_fill=_clip(float(trend(last_h + h))),
            confidence_low=_clip(float(trend(last_h + h)) - margin),
            confidence_high=_clip(float(trend(last_h + h)) + margin),
        )
        for h in HORIZONS
    ]


def _clip(v: float) -> float:
    return round(max(0.0, min(100.0, v)), 1)

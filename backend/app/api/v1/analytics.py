import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.middleware.auth import require_role
from app.models.user import User, UserRole
from app.schemas.analytics import (
    ExportRequest,
    HeatmapResponse,
    KpiDashboard,
    PredictionResponse,
    TimeseriesResponse,
    TopZonesResponse,
)
from app.services.analytics_service import (
    get_heatmap,
    get_kpis,
    get_timeseries,
    get_top_zones,
)
from app.services.export_service import (
    export_reports_csv,
    export_reports_pdf,
)
from app.services.prediction_service import predict_container

router = APIRouter()

Manager = Annotated[
    User, Depends(require_role(UserRole.MANAGER, UserRole.ADMIN))
]


@router.get("/kpis", response_model=KpiDashboard)
async def kpis(
    current_user: Manager,
    db: AsyncSession = Depends(get_db),
) -> KpiDashboard:
    return await get_kpis(db)


@router.get("/timeseries", response_model=TimeseriesResponse)
async def timeseries(
    metric: str = Query(
        default="avg_fill", pattern="^(avg_fill|report_count)$"
    ),
    zone: Optional[uuid.UUID] = None,
    granularity: str = Query(default="day", pattern="^(hour|day)$"),
    from_date: Optional[str] = Query(default=None, alias="from"),
    to_date: Optional[str] = Query(default=None, alias="to"),
    current_user: Manager = ...,
    db: AsyncSession = Depends(get_db),
) -> TimeseriesResponse:
    now = datetime.now(timezone.utc)
    try:
        from_dt = (
            datetime.fromisoformat(from_date)
            if from_date
            else now - timedelta(days=7)
        )
        to_dt = datetime.fromisoformat(to_date) if to_date else now
    except ValueError:
        raise HTTPException(
            status_code=422, detail="Invalid date format, use ISO 8601"
        )

    if from_dt.tzinfo is None:
        from_dt = from_dt.replace(tzinfo=timezone.utc)
    if to_dt.tzinfo is None:
        to_dt = to_dt.replace(tzinfo=timezone.utc)

    return await get_timeseries(db, metric, zone, from_dt, to_dt, granularity)


@router.get("/zones/top", response_model=TopZonesResponse)
async def top_zones(
    limit: int = Query(default=5, ge=1, le=20),
    current_user: Manager = ...,
    db: AsyncSession = Depends(get_db),
) -> TopZonesResponse:
    return await get_top_zones(db, limit=limit)


@router.get("/heatmap", response_model=HeatmapResponse)
async def heatmap(
    zone: Optional[uuid.UUID] = None,
    days: int = Query(default=30, ge=1, le=365),
    current_user: Manager = ...,
    db: AsyncSession = Depends(get_db),
) -> HeatmapResponse:
    return await get_heatmap(db, zone_id=zone, days=days)


@router.get(
    "/predictions/containers/{container_id}",
    response_model=PredictionResponse,
)
async def prediction(
    container_id: uuid.UUID,
    current_user: Manager,
    db: AsyncSession = Depends(get_db),
) -> PredictionResponse:
    return await predict_container(container_id, db)


@router.post("/reports/export")
async def export_reports(
    body: ExportRequest,
    current_user: Manager,
    db: AsyncSession = Depends(get_db),
) -> Response:
    if body.format == "pdf":
        data = await export_reports_pdf(
            db,
            zone_id=body.zone_id,
            status=body.status,
            from_date=body.from_date,
            to_date=body.to_date,
        )
        return Response(
            content=data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    "attachment; filename=ecotrack-reports.pdf"
                )
            },
        )

    data = await export_reports_csv(
        db,
        zone_id=body.zone_id,
        status=body.status,
        from_date=body.from_date,
        to_date=body.to_date,
    )
    return Response(
        content=data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                "attachment; filename=ecotrack-reports.csv"
            )
        },
    )

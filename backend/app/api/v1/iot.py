import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.schemas.container import MeasurementOut
from app.schemas.iot import MeasurementIn
from app.services.iot_ingest import ingest_measurement

log = logging.getLogger(__name__)
router = APIRouter()


@router.post("/measurements", response_model=MeasurementOut, status_code=201)
async def post_measurement(
    data: MeasurementIn,
    x_iot_token: str = Header(..., alias="X-IoT-Token"),
    db: AsyncSession = Depends(get_db),
) -> MeasurementOut:
    if x_iot_token != settings.IOT_SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid IoT token")
    try:
        return await ingest_measurement(data, db)
    except ValueError as exc:
        msg = str(exc)
        status = 404 if "not found" in msg else 422
        raise HTTPException(status_code=status, detail=msg)

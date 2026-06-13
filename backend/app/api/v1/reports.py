import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.report import ReportStatus
from app.models.user import User, UserRole
from app.schemas.report import ReportIn, ReportOut, ReportStatusUpdate
from app.services.report_service import (
    DuplicateReportError,
    change_status,
    create_report,
    list_my_reports,
    list_reports,
)

router = APIRouter()


@router.post("", response_model=ReportOut, status_code=201)
async def post_report(
    data: ReportIn,
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.CITIZEN, UserRole.AGENT)),
    ],
    db: AsyncSession = Depends(get_db),
) -> ReportOut:
    try:
        return await create_report(data, current_user.id, db)
    except DuplicateReportError as exc:
        raise HTTPException(
            status_code=409,
            detail={"detail": "DUPLICATE_REPORT", "existing_id": exc.existing_id},
        )


@router.get("", response_model=dict)
async def get_reports(
    zone: Optional[uuid.UUID] = None,
    status: Optional[ReportStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.MANAGER, UserRole.ADMIN)),
    ] = ...,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await list_reports(db, zone_id=zone, status=status, limit=limit, offset=offset)


@router.get("/mine", response_model=dict)
async def get_my_reports(
    limit: int = 50,
    offset: int = 0,
    current_user: Annotated[User, Depends(get_current_user)] = ...,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await list_my_reports(current_user.id, db, limit=limit, offset=offset)


@router.patch("/{report_id}/status", response_model=ReportOut)
async def patch_report_status(
    report_id: uuid.UUID,
    payload: ReportStatusUpdate,
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.AGENT, UserRole.MANAGER, UserRole.ADMIN)),
    ],
    db: AsyncSession = Depends(get_db),
) -> ReportOut:
    try:
        return await change_status(report_id, payload, current_user.role, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

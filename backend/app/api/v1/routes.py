import uuid
from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.route import (
    RouteCreate,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    RouteOut,
    RouteStepOut,
)
from app.services.route_service import (
    assign_agent,
    complete_route,
    create_route,
    get_route,
    issue_step,
    list_my_routes,
    list_routes,
    preview_optimize,
    start_route,
    validate_step,
)

router = APIRouter()
steps_router = APIRouter()  # mounted at /route-steps

Manager = Annotated[
    User, Depends(require_role(UserRole.MANAGER, UserRole.ADMIN))
]
Agent = Annotated[User, Depends(require_role(UserRole.AGENT))]
AnyAuth = Annotated[User, Depends(get_current_user)]


def _require_route(route):
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return route


# ── optimize preview ──────────────────────────────────────────────────────


@router.post("/optimize", response_model=RouteOptimizeResponse)
async def optimize_preview(
    req: RouteOptimizeRequest,
    current_user: Manager,
    db: AsyncSession = Depends(get_db),
) -> RouteOptimizeResponse:
    return await preview_optimize(req, db)


# ── CRUD routes ───────────────────────────────────────────────────────────


@router.post("", response_model=RouteOut, status_code=201)
async def post_route(
    req: RouteCreate,
    current_user: Manager,
    db: AsyncSession = Depends(get_db),
) -> RouteOut:
    return await create_route(req, current_user.id, db)


@router.get("", response_model=dict)
async def get_routes(
    zone: Optional[uuid.UUID] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: Manager = ...,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await list_routes(db, zone_id=zone, limit=limit, offset=offset)


@router.get("/mine", response_model=list[RouteOut])
async def get_my_routes(
    current_user: Agent,
    db: AsyncSession = Depends(get_db),
) -> list[RouteOut]:
    return await list_my_routes(current_user.id, date.today(), db)


@router.get("/{route_id}", response_model=RouteOut)
async def get_one_route(
    route_id: uuid.UUID,
    current_user: AnyAuth,
    db: AsyncSession = Depends(get_db),
) -> RouteOut:
    route = await get_route(route_id, db)
    _require_route(route)
    is_agent = current_user.role == UserRole.AGENT
    if is_agent and route.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission insuffisante")
    return route


# ── manager actions ───────────────────────────────────────────────────────


@router.patch("/{route_id}/assign", response_model=RouteOut)
async def patch_assign(
    route_id: uuid.UUID,
    agent_id: uuid.UUID,
    current_user: Manager,
    db: AsyncSession = Depends(get_db),
) -> RouteOut:
    try:
        return await assign_agent(route_id, agent_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# ── agent actions ─────────────────────────────────────────────────────────


@router.patch("/{route_id}/start", response_model=RouteOut)
async def patch_start(
    route_id: uuid.UUID,
    current_user: Agent,
    db: AsyncSession = Depends(get_db),
) -> RouteOut:
    try:
        return await start_route(route_id, current_user.id, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.patch("/{route_id}/complete", response_model=RouteOut)
async def patch_complete(
    route_id: uuid.UUID,
    current_user: Agent,
    db: AsyncSession = Depends(get_db),
) -> RouteOut:
    try:
        return await complete_route(route_id, current_user.id, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# ── step actions (also mounted at /route-steps) ───────────────────────────


@steps_router.patch("/{step_id}/validate", response_model=RouteStepOut)
async def patch_step_validate(
    step_id: uuid.UUID,
    current_user: Agent,
    db: AsyncSession = Depends(get_db),
) -> RouteStepOut:
    try:
        return await validate_step(step_id, current_user.id, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@steps_router.patch("/{step_id}/issue", response_model=RouteStepOut)
async def patch_step_issue(
    step_id: uuid.UUID,
    current_user: Agent,
    db: AsyncSession = Depends(get_db),
) -> RouteStepOut:
    try:
        return await issue_step(step_id, current_user.id, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

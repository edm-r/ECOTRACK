from fastapi import APIRouter

from app.api.v1 import (
    alerts, analytics, auth, containers, iot, reports, routes, users, zones,
)
from app.api.v1.routes import steps_router

router = APIRouter()

router.include_router(auth.router,        prefix="/auth",        tags=["auth"])
router.include_router(users.router,       prefix="/users",       tags=["users"])
router.include_router(zones.router,       prefix="/zones",       tags=["zones"])
router.include_router(containers.router,  prefix="/containers",  tags=["containers"])
router.include_router(reports.router,     prefix="/reports",     tags=["reports"])
router.include_router(routes.router,      prefix="/routes",      tags=["routes"])
router.include_router(steps_router,       prefix="/route-steps", tags=["route-steps"])
router.include_router(alerts.router,      prefix="/alerts",      tags=["alerts"])
router.include_router(analytics.router,   prefix="/analytics",   tags=["analytics"])
router.include_router(iot.router,         prefix="/iot",         tags=["iot"])

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import PointsEvent

POINTS_TABLE: dict[str, int] = {
    "REPORT_CREATED": 10,
    "REPORT_CONFIRMED": 5,
}


async def award_points(
    user_id: uuid.UUID,
    source: str,
    db: AsyncSession,
    reason: str | None = None,
) -> PointsEvent:
    points = POINTS_TABLE.get(source, 0)
    event = PointsEvent(
        user_id=user_id,
        source=source,
        points=points,
        reason=reason,
    )
    db.add(event)
    return event

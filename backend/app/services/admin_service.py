import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.schemas.audit_log import AuditLogOut
from app.schemas.user import UserAdminCreate, UserAdminUpdate
from app.services.audit_service import log_event


async def list_users(
    db: AsyncSession,
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    q = select(User)
    if role is not None:
        q = q.where(User.role == role)
    if status is not None:
        q = q.where(User.status == status)
    if search:
        pattern = f"%{search}%"
        q = q.where(
            User.email.ilike(pattern) | User.full_name.ilike(pattern)
        )

    total_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(total_q)).scalar() or 0

    items = (
        await db.execute(
            q.order_by(User.created_at.desc()).limit(limit).offset(offset)
        )
    ).scalars().all()

    return {"items": list(items), "total": total, "limit": limit, "offset": offset}


async def create_user_admin(
    data: UserAdminCreate,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> User:
    existing = (
        await db.execute(select(User).where(User.email == data.email))
    ).scalar_one_or_none()
    if existing:
        raise ValueError("Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.flush()

    await log_event(
        "USER_CREATED_ADMIN",
        db,
        actor_id=actor_id,
        resource_type="user",
        resource_id=user.id,
        details={"role": data.role.value, "email": data.email},
    )
    await db.refresh(user)
    return user


async def update_user_admin(
    user_id: uuid.UUID,
    data: UserAdminUpdate,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> User:
    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()
    if user is None:
        raise ValueError("User not found")

    changes: dict = {}
    if data.full_name is not None:
        user.full_name = data.full_name
        changes["full_name"] = data.full_name
    if data.role is not None:
        user.role = data.role
        changes["role"] = data.role.value
    if data.status is not None:
        user.status = data.status
        changes["status"] = data.status.value

    await log_event(
        "USER_UPDATED_ADMIN",
        db,
        actor_id=actor_id,
        resource_type="user",
        resource_id=user_id,
        details=changes,
    )
    await db.refresh(user)
    return user


async def deactivate_user(
    user_id: uuid.UUID,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    if user_id == actor_id:
        raise ValueError("Cannot deactivate your own account")

    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()
    if user is None:
        raise ValueError("User not found")

    user.status = UserStatus.INACTIVE
    await log_event(
        "USER_DEACTIVATED",
        db,
        actor_id=actor_id,
        resource_type="user",
        resource_id=user_id,
    )


async def list_audit_logs(
    db: AsyncSession,
    actor_filter: Optional[uuid.UUID] = None,
    action_filter: Optional[str] = None,
    from_dt: Optional[datetime] = None,
    to_dt: Optional[datetime] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    where_parts = []
    params: dict = {}

    if actor_filter is not None:
        where_parts.append("a.actor_id = :actor_id")
        params["actor_id"] = actor_filter
    if action_filter:
        where_parts.append("a.action ILIKE :action")
        params["action"] = f"%{action_filter}%"
    if from_dt is not None:
        where_parts.append("a.created_at >= :from_dt")
        params["from_dt"] = from_dt
    if to_dt is not None:
        where_parts.append("a.created_at <= :to_dt")
        params["to_dt"] = to_dt

    where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    total = (
        await db.execute(
            text(f"SELECT COUNT(*) FROM audit_logs a {where_sql}"), params
        )
    ).scalar() or 0

    params["limit"] = limit
    params["offset"] = offset
    rows = (
        await db.execute(
            text(f"""
                SELECT a.id, a.actor_id, u.email AS actor_email,
                       a.action, a.resource_type, a.resource_id,
                       a.ip, a.details, a.created_at
                FROM audit_logs a
                LEFT JOIN users u ON u.id = a.actor_id
                {where_sql}
                ORDER BY a.created_at DESC
                LIMIT :limit OFFSET :offset
            """),
            params,
        )
    ).mappings().fetchall()

    items = [
        AuditLogOut(
            id=r["id"],
            actor_id=r["actor_id"],
            actor_email=r["actor_email"],
            action=r["action"],
            resource_type=r["resource_type"],
            resource_id=r["resource_id"],
            ip=r["ip"],
            details=r["details"],
            created_at=r["created_at"],
        )
        for r in rows
    ]
    return {"items": items, "total": total, "limit": limit, "offset": offset}

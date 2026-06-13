from app.models.container import ContainerStatus


def compute_status(
    latest_fill: int | None,
    recent_critical_report: bool = False,
    is_disabled: bool = False,
) -> ContainerStatus:
    """
    Single source of truth for container status transitions.
    Called by both the IoT ingest pipeline and the seed script.
    """
    if is_disabled:
        return ContainerStatus.MAINTENANCE
    if latest_fill is None:
        return ContainerStatus.UNKNOWN
    if latest_fill >= 90 or recent_critical_report:
        return ContainerStatus.CRITICAL
    if latest_fill >= 70:
        return ContainerStatus.WATCH
    return ContainerStatus.NORMAL

"""Canonical weekly competition clock (Europe/Kyiv).

A competition starts Monday 00:01 and ends at the next Monday 00:01.
No scheduled reset is required: every week has a different start-date key.
"""
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

WEEK_TIMEZONE = ZoneInfo('Europe/Kyiv')
WEEK_START_TIME = time(0, 1)


def get_week_start(now: datetime | None = None) -> date:
    """Return Monday date identifying the competition containing *now*."""
    if now is None:
        local = datetime.now(WEEK_TIMEZONE)
    elif now.tzinfo is None:
        raise ValueError('Expected a timezone-aware datetime')
    else:
        local = now.astimezone(WEEK_TIMEZONE)
    monday = local.date() - timedelta(days=local.weekday())
    if local.weekday() == 0 and local.time().replace(tzinfo=None) < WEEK_START_TIME:
        monday -= timedelta(days=7)
    return monday


def get_week_bounds(now: datetime | None = None) -> tuple[datetime, datetime]:
    """Return timezone-aware inclusive start and exclusive end."""
    monday = get_week_start(now)
    start = datetime.combine(monday, WEEK_START_TIME, WEEK_TIMEZONE)
    end = datetime.combine(monday + timedelta(days=7), WEEK_START_TIME, WEEK_TIMEZONE)
    return start, end

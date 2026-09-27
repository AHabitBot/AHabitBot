from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


DEFAULT_TIMEZONE = "Europe/Kyiv"


def normalize_timezone(
    timezone: str | None,
    *,
    fallback: str | None = DEFAULT_TIMEZONE,
) -> str | None:
    """Return a valid IANA timezone or the requested fallback."""
    value = str(timezone or "").strip()

    if value:
        try:
            ZoneInfo(value)
            return value
        except (ZoneInfoNotFoundError, ValueError):
            pass

    return fallback


def is_valid_timezone(timezone: str | None) -> bool:
    return normalize_timezone(timezone, fallback=None) is not None

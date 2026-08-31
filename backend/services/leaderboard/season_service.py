from dataclasses import dataclass
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

SEASON_START_DATE = date(2026, 6, 1)
SEASON_LENGTH_MONTHS = 3
SEASON_RESULTS_DAYS = 7
SEASON_TIMEZONE_NAME = "Europe/Kyiv"
SEASON_TIMEZONE = ZoneInfo(SEASON_TIMEZONE_NAME)


@dataclass(frozen=True)
class SeasonContext:
    number: int
    current_date: date
    start_date: date
    ranking_end_date: date
    results_start_date: date
    end_date: date
    status: str

    @property
    def xp_active(self) -> bool:
        return self.status == "active"


def get_current_season_date() -> date:
    """Single application-wide clock for season transitions and Season XP."""
    return datetime.now(SEASON_TIMEZONE).date()


def get_season_number(target_date: date) -> int:
    if target_date < SEASON_START_DATE:
        raise ValueError("Дата раньше начала первого сезона")
    months_from_start = (
        (target_date.year - SEASON_START_DATE.year) * 12
        + (target_date.month - SEASON_START_DATE.month)
    )
    return months_from_start // SEASON_LENGTH_MONTHS + 1


def get_season_dates(season_number: int) -> tuple[date, date]:
    if season_number < 1:
        raise ValueError("Номер сезона должен быть не меньше 1")
    starts_on = add_months(
        SEASON_START_DATE,
        (season_number - 1) * SEASON_LENGTH_MONTHS,
    )
    next_season_start = add_months(starts_on, SEASON_LENGTH_MONTHS)
    return starts_on, next_season_start - timedelta(days=1)


def get_season_ranking_end_date(season_number: int) -> date:
    _, official_end = get_season_dates(season_number)
    return official_end - timedelta(days=SEASON_RESULTS_DAYS)


def get_season_results_start_date(season_number: int) -> date:
    return get_season_ranking_end_date(season_number) + timedelta(days=1)


def get_season_status(target_date: date, season_number: int | None = None) -> str:
    number = season_number or get_season_number(target_date)
    starts_on, ends_on = get_season_dates(number)
    if not starts_on <= target_date <= ends_on:
        return "inactive"
    return "active" if target_date <= get_season_ranking_end_date(number) else "finished"


def get_season_context(target_date: date | None = None) -> SeasonContext:
    """Return the canonical current-season state used by every XP source and API."""
    current_date = target_date or get_current_season_date()
    number = get_season_number(current_date)
    start_date, end_date = get_season_dates(number)
    ranking_end_date = get_season_ranking_end_date(number)
    return SeasonContext(
        number=number,
        current_date=current_date,
        start_date=start_date,
        ranking_end_date=ranking_end_date,
        results_start_date=ranking_end_date + timedelta(days=1),
        end_date=end_date,
        status=get_season_status(current_date, number),
    )


def is_season_xp_active(target_date: date | None = None) -> bool:
    """Season XP is governed only by the canonical Europe/Kyiv season clock."""
    return get_season_context(target_date).xp_active


def get_next_season(season_number: int) -> tuple[int, date, date]:
    next_number = season_number + 1
    starts_on, ends_on = get_season_dates(next_number)
    return next_number, starts_on, ends_on


def add_months(source_date: date, months: int) -> date:
    total_months = source_date.year * 12 + source_date.month - 1 + months
    return date(total_months // 12, total_months % 12 + 1, 1)

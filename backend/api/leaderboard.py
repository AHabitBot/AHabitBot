from calendar import monthrange
from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter

from backend.api.dependencies import (
    CurrentUser,
)
from backend.repositories.leaderboard.leaderboard_components import (
    get_global_current_user,
    get_global_leaderboard_users,
    get_season_current_user,
    get_season_leaderboard_users,
)
from backend.services.leaderboard.season_service import (
    get_season_number,
)


LEADERBOARD_TIMEZONE = ZoneInfo(
    "Europe/Kyiv"
)

FIRST_SEASON_START_DATE = date(
    2026,
    6,
    1,
)

SEASON_DURATION_MONTHS = 3


router = APIRouter(
    prefix="/api/leaderboard",
    tags=["leaderboard"],
)


# =========================================================
# ГЛОБАЛЬНЫЙ РЕЙТИНГ
# =========================================================

@router.get("/global")
async def read_global_leaderboard(
    user: CurrentUser,
):
    leaderboard_users = (
        await get_global_leaderboard_users()
    )

    current_user = (
        await get_global_current_user(
            user["id"]
        )
    )

    return {
        "users": [
            dict(leaderboard_user)
            for leaderboard_user
            in leaderboard_users
        ],

        "current_user": (
            dict(current_user)
            if current_user is not None
            else None
        ),
    }


# =========================================================
# СЕЗОННЫЙ РЕЙТИНГ
# =========================================================

@router.get("/season")
async def read_season_leaderboard(
    user: CurrentUser,
):
    current_date = datetime.now(
        LEADERBOARD_TIMEZONE
    ).date()

    season_number = get_season_number(
        current_date
    )

    season_start_date, season_end_date = (
        get_season_period(
            season_number
        )
    )

    leaderboard_users = (
        await get_season_leaderboard_users(
            season_number
        )
    )

    current_user = (
        await get_season_current_user(
            season_number,
            user["id"],
        )
    )

    return {
        "season": {
            "number":
                season_number,

            "title":
                f"Сезон {season_number}",

            "start_date":
                season_start_date.isoformat(),

            "end_date":
                season_end_date.isoformat(),
        },

        # Оставляем поле для обратной совместимости.
        # После полного перехода frontend его можно удалить.
        "season_number":
            season_number,

        "users": [
            dict(leaderboard_user)
            for leaderboard_user
            in leaderboard_users
        ],

        "current_user": (
            dict(current_user)
            if current_user is not None
            else None
        ),
    }


# =========================================================
# ПЕРИОД СЕЗОНА
# =========================================================

def get_season_period(
    season_number: int,
) -> tuple[date, date]:
    """
    Возвращает дату начала и дату окончания сезона.

    Сезон 1:
    01.06.2026–31.08.2026

    Каждый следующий сезон длится три месяца.
    """

    safe_season_number = normalize_season_number(
        season_number
    )

    months_from_first_season = (
        safe_season_number - 1
    ) * SEASON_DURATION_MONTHS

    season_start_date = add_months(
        FIRST_SEASON_START_DATE,
        months_from_first_season,
    )

    next_season_start_date = add_months(
        season_start_date,
        SEASON_DURATION_MONTHS,
    )

    season_end_date = date.fromordinal(
        next_season_start_date.toordinal() - 1
    )

    return (
        season_start_date,
        season_end_date,
    )


def add_months(
    source_date: date,
    months: int,
) -> date:
    """
    Безопасно прибавляет календарные месяцы к дате.
    """

    total_months = (
        source_date.year * 12
        + source_date.month
        - 1
        + months
    )

    target_year = total_months // 12

    target_month = (
        total_months % 12
    ) + 1

    target_day = min(
        source_date.day,
        monthrange(
            target_year,
            target_month,
        )[1],
    )

    return date(
        target_year,
        target_month,
        target_day,
    )


def normalize_season_number(
    value,
) -> int:
    try:
        season_number = int(value)
    except (
        TypeError,
        ValueError,
    ):
        return 1

    if season_number < 1:
        return 1

    return season_number
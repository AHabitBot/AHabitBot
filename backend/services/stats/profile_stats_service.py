import calendar

from datetime import (
    date,
    datetime,
    time,
    timedelta,
)

import asyncio
import calendar

from typing import Any

from zoneinfo import (
    ZoneInfo,
    ZoneInfoNotFoundError,
)


from backend.repositories.stats.profile_stats_repository import (
    get_achievement_xp_for_period,
    get_achievements_for_period,
    get_confirmation_count_for_period,
    get_confirmation_xp_for_period,
    get_confirmations_by_weekday,
    get_daily_confirmation_counts,
    get_referral_xp_for_period,
    get_user_timezone_name,
)

from backend.services.achievements.achievements_config import (
    CONFIRMATION_ACHIEVEMENTS,
    INVITATION_ACHIEVEMENTS,
    STREAK_ACHIEVEMENTS,
)


# =========================================================
# PROFILE STATS SERVICE
# =========================================================


VALID_PERIODS = {
    "week",
    "month",
    "year",
}


WEEKDAY_KEYS = {
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
    7: "sun",
}


DEFAULT_TIMEZONE = "Europe/Kyiv"


# =========================================================
# TIMEZONE
# =========================================================

def _get_timezone(
    timezone_name: str | None,
) -> ZoneInfo:
    safe_name = (
        timezone_name
        or DEFAULT_TIMEZONE
    )

    try:
        return ZoneInfo(
            safe_name
        )

    except ZoneInfoNotFoundError:
        return ZoneInfo(
            DEFAULT_TIMEZONE
        )


# =========================================================
# ПРЕДЫДУЩИЙ МЕСЯЦ
# =========================================================

def _get_previous_month(
    value: date,
) -> tuple[int, int]:

    if value.month == 1:
        return (
            value.year - 1,
            12,
        )

    return (
        value.year,
        value.month - 1,
    )


# =========================================================
# БЕЗОПАСНАЯ ДАТА
# =========================================================

def _safe_date(
    year: int,
    month: int,
    day: int,
) -> date:
    """
    Нужна для сравнения одинаковой части
    текущего и прошлого периода.

    Например:
    31 марта -> февраль имеет меньше дней.
    """

    last_day = calendar.monthrange(
        year,
        month,
    )[1]

    safe_day = min(
        day,
        last_day,
    )

    return date(
        year,
        month,
        safe_day,
    )


# =========================================================
# ДИАПАЗОНЫ ПЕРИОДА
# =========================================================

def _get_period_dates(
    period: str,
    today: date,
) -> dict[str, date]:
    """
    Возвращает:

    current_start
    current_end
    previous_start
    previous_end

    ВАЖНО:
    предыдущий период сравниваем
    с такой же прошедшей частью текущего периода.

    Например:
    сегодня 13 августа.

    current:
        01.08 - 13.08

    previous:
        01.07 - 13.07

    Это честнее, чем сравнивать
    13 дней августа со всем июлем.
    """

    # =====================================================
    # WEEK
    # =====================================================

    if period == "week":

        current_start = (
            today
            -
            timedelta(
                days=today.weekday()
            )
        )

        elapsed_days = (
            today
            -
            current_start
        ).days

        current_end = today

        previous_start = (
            current_start
            -
            timedelta(days=7)
        )

        previous_end = (
            previous_start
            +
            timedelta(
                days=elapsed_days
            )
        )

        return {
            "current_start":
                current_start,

            "current_end":
                current_end,

            "previous_start":
                previous_start,

            "previous_end":
                previous_end,
        }

    # =====================================================
    # MONTH
    # =====================================================

    if period == "month":

        current_start = date(
            today.year,
            today.month,
            1,
        )

        current_end = today

        previous_year, previous_month = (
            _get_previous_month(
                today
            )
        )

        previous_start = date(
            previous_year,
            previous_month,
            1,
        )

        previous_end = _safe_date(
            previous_year,
            previous_month,
            today.day,
        )

        return {
            "current_start":
                current_start,

            "current_end":
                current_end,

            "previous_start":
                previous_start,

            "previous_end":
                previous_end,
        }

    # =====================================================
    # YEAR
    # =====================================================

    current_start = date(
        today.year,
        1,
        1,
    )

    current_end = today

    previous_start = date(
        today.year - 1,
        1,
        1,
    )

    # Защита для 29 февраля.
    try:
        previous_end = date(
            today.year - 1,
            today.month,
            today.day,
        )

    except ValueError:
        previous_end = date(
            today.year - 1,
            today.month,
            28,
        )

    return {
        "current_start":
            current_start,

        "current_end":
            current_end,

        "previous_start":
            previous_start,

        "previous_end":
            previous_end,
    }


# =========================================================
# DATETIME RANGE
# =========================================================

def _date_range_to_datetimes(
    date_from: date,
    date_to: date,
    timezone: ZoneInfo,
) -> tuple[
    datetime,
    datetime,
]:
    """
    DATE диапазон включительный.

    Переводим в:

    datetime_from <= value < datetime_to

    datetime_to = следующий день 00:00.
    """

    datetime_from = datetime.combine(
        date_from,
        time.min,
        tzinfo=timezone,
    )

    datetime_to = datetime.combine(
        date_to + timedelta(days=1),
        time.min,
        tzinfo=timezone,
    )

    return (
        datetime_from,
        datetime_to,
    )


# =========================================================
# ПРОЦЕНТ ИЗМЕНЕНИЯ
# =========================================================

def _calculate_change(
    current: int,
    previous: int,
) -> dict[str, Any]:
    """
    Возвращает состояние для UI.

    direction:
        up
        down
        same
        new
    """

    current = int(
        current or 0
    )

    previous = int(
        previous or 0
    )

    # =====================================================
    # ОБА НОЛЬ
    # =====================================================

    if (
        current == 0
        and
        previous == 0
    ):
        return {
            "direction": "same",
            "percent": 0,
        }

    # =====================================================
    # НОВЫЙ РЕЗУЛЬТАТ
    # =====================================================

    if previous == 0:
        return {
            "direction": "new",
            "percent": None,
        }

    # =====================================================
    # ПРОЦЕНТ
    # =====================================================

    difference = (
        current
        -
        previous
    )

    percent = round(
        abs(
            difference
            /
            previous
            *
            100
        )
    )

    if difference > 0:
        direction = "up"

    elif difference < 0:
        direction = "down"

    else:
        direction = "same"

    return {
        "direction":
            direction,

        "percent":
            int(percent),
    }


# =========================================================
# ACHIEVEMENTS LOOKUP
# =========================================================

def _build_achievement_lookup(
) -> dict[str, dict[str, Any]]:

    lookup: dict[
        str,
        dict[str, Any]
    ] = {}

    configs = [
        (
            "streak",
            STREAK_ACHIEVEMENTS,
        ),
        (
            "confirmation",
            CONFIRMATION_ACHIEVEMENTS,
        ),
        (
            "invitation",
            INVITATION_ACHIEVEMENTS,
        ),
    ]

    for (
        achievement_type,
        achievements,
    ) in configs:

        for achievement in achievements:

            code = str(
                achievement["code"]
            )

            lookup[code] = {
                "type":
                    achievement_type,

                "code":
                    code,

                "target":
                    int(
                        achievement["target"]
                    ),

                "xp_reward":
                    int(
                        achievement["xp_reward"]
                    ),

                "image":
                    achievement["image"],
            }

    return lookup


ACHIEVEMENT_LOOKUP = (
    _build_achievement_lookup()
)


# =========================================================
# ПОДГОТОВИТЬ ДОСТИЖЕНИЯ
# =========================================================

def _prepare_achievements(
    rows: list[dict[str, Any]],
    timezone: ZoneInfo,
) -> list[dict[str, Any]]:

    result: list[
        dict[str, Any]
    ] = []

    for row in rows:

        code = str(
            row["achievement_code"]
        )

        config = (
            ACHIEVEMENT_LOOKUP.get(
                code
            )
        )

        if config is None:
            continue

        earned_at = row[
            "earned_at"
        ]

        # TIMESTAMPTZ из asyncpg
        # обычно уже timezone-aware.
        if (
            isinstance(
                earned_at,
                datetime,
            )
            and
            earned_at.tzinfo is not None
        ):
            local_earned_at = (
                earned_at.astimezone(
                    timezone
                )
            )

        else:
            local_earned_at = (
                earned_at
            )

        result.append(
            {
                **config,

                "earned_at":
                    local_earned_at.isoformat(),

                "earned_date":
                    local_earned_at.date().isoformat(),

                "xp_amount":
                    int(
                        row.get(
                            "xp_amount",
                            0,
                        )
                        or 0
                    ),
            }
        )

    return result


# =========================================================
# АКТИВНОСТЬ ПО ДНЯМ НЕДЕЛИ
# =========================================================

def _prepare_weekday_activity(
    rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    values = {
        weekday: 0
        for weekday
        in range(1, 8)
    }

    for row in rows:

        weekday = int(
            row["weekday"]
        )

        values[weekday] = int(
            row["confirmations"]
            or 0
        )

    return [
        {
            "weekday":
                weekday,

            "key":
                WEEKDAY_KEYS[
                    weekday
                ],

            "confirmations":
                values[
                    weekday
                ],
        }
        for weekday
        in range(1, 8)
    ]


# =========================================================
# САМЫЙ АКТИВНЫЙ ДЕНЬ
# =========================================================

def _get_best_weekday(
    weekday_activity: list[
        dict[str, Any]
    ],
) -> dict[str, Any] | None:

    if not weekday_activity:
        return None

    best = max(
        weekday_activity,
        key=lambda item: int(
            item["confirmations"]
        ),
    )

    if int(
        best["confirmations"]
    ) <= 0:
        return None

    return {
        "weekday":
            int(
                best["weekday"]
            ),

        "key":
            best["key"],

        "confirmations":
            int(
                best["confirmations"]
            ),
    }


# =========================================================
# ДНЕВНЫЕ COUNTS -> DICT
# =========================================================

def _daily_counts_map(
    rows: list[dict[str, Any]],
) -> dict[date, int]:

    return {
        row["confirmation_date"]:
            int(
                row["confirmations"]
                or 0
            )

        for row
        in rows
    }


# =========================================================
# ДИНАМИКА ПО ДНЯМ
# =========================================================

def _build_daily_dynamics(
    date_from: date,
    date_to: date,
    today: date,
    daily_counts: dict[
        date,
        int
    ],
    achievements: list[
        dict[str, Any]
    ],
) -> list[dict[str, Any]]:
    """
    Логика:

    >= 1 подтверждение:
        +1

    полный прошедший день без подтверждений:
        -1

    минимум:
        0

    Сегодня без подтверждения НЕ считается пропуском,
    потому что день ещё не закончился.
    """

    achievements_by_date: dict[
        str,
        list[dict[str, Any]]
    ] = {}

    for achievement in achievements:

        earned_date = str(
            achievement[
                "earned_date"
            ]
        )

        achievements_by_date.setdefault(
            earned_date,
            [],
        ).append(
            achievement
        )

    result: list[
        dict[str, Any]
    ] = []

    score = 0

    current_date = (
        date_from
    )

    while (
        current_date
        <=
        date_to
    ):

        confirmations = int(
            daily_counts.get(
                current_date,
                0,
            )
        )

        if confirmations > 0:
            score += 1

        elif current_date < today:
            score = max(
                0,
                score - 1,
            )

        # Сегодня с 0:
        # score не уменьшаем.

        date_key = (
            current_date.isoformat()
        )

        result.append(
            {
                "date":
                    date_key,

                "score":
                    score,

                "confirmations":
                    confirmations,

                "achievements":
                    achievements_by_date.get(
                        date_key,
                        [],
                    ),
            }
        )

        current_date += timedelta(
            days=1
        )

    return result


# =========================================================
# ГОДОВОЙ ГРАФИК -> 12 МЕСЯЦЕВ
# =========================================================

def _compress_year_dynamics(
    daily_points: list[
        dict[str, Any]
    ],
    achievements: list[
        dict[str, Any]
    ],
) -> list[dict[str, Any]]:
    """
    На годовом графике не рисуем сотни точек.

    Берём последнее состояние каждого месяца.

    Все достижения месяца прикрепляются
    к этой месячной точке.
    """

    last_point_by_month: dict[
        str,
        dict[str, Any]
    ] = {}

    for point in daily_points:

        point_date = date.fromisoformat(
            point["date"]
        )

        month_key = (
            f"{point_date.year:04d}-"
            f"{point_date.month:02d}"
        )

        last_point_by_month[
            month_key
        ] = point

    achievements_by_month: dict[
        str,
        list[dict[str, Any]]
    ] = {}

    for achievement in achievements:

        earned_date = date.fromisoformat(
            achievement[
                "earned_date"
            ]
        )

        month_key = (
            f"{earned_date.year:04d}-"
            f"{earned_date.month:02d}"
        )

        achievements_by_month.setdefault(
            month_key,
            [],
        ).append(
            achievement
        )

    result: list[
        dict[str, Any]
    ] = []

    for month_key in sorted(
        last_point_by_month
    ):

        point = (
            last_point_by_month[
                month_key
            ]
        )

        result.append(
            {
                "month":
                    month_key,

                "date":
                    point["date"],

                "score":
                    int(
                        point["score"]
                    ),

                "achievements":
                    achievements_by_month.get(
                        month_key,
                        [],
                    ),
            }
        )

    return result


# =========================================================
# XP ЗА ПЕРИОД
# =========================================================

async def _get_total_xp_for_period(
    user_id: int,
    date_from: date,
    date_to: date,
    timezone: ZoneInfo,
) -> int:

    (
        datetime_from,
        datetime_to,
    ) = _date_range_to_datetimes(
        date_from,
        date_to,
        timezone,
    )

    (
        confirmation_xp,
        referral_xp,
        achievement_xp,
    ) = await asyncio.gather(

        get_confirmation_xp_for_period(
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
        ),

        get_referral_xp_for_period(
            user_id=user_id,
            datetime_from=datetime_from,
            datetime_to=datetime_to,
        ),

        get_achievement_xp_for_period(
            user_id=user_id,
            datetime_from=datetime_from,
            datetime_to=datetime_to,
        ),
    )

    return (
        int(confirmation_xp)
        +
        int(referral_xp)
        +
        int(achievement_xp)
    )

# =========================================================
# ГЛАВНАЯ ФУНКЦИЯ
# =========================================================

async def get_profile_stats(
    user_id: int,
    period: str = "week",
) -> dict[str, Any]:

    normalized_period = (
        str(period)
        .strip()
        .lower()
    )

    if (
        normalized_period
        not in VALID_PERIODS
    ):
        raise ValueError(
            "Некорректный период. "
            "Допустимые значения: "
            "week, month, year."
        )

    # =====================================================
    # TIMEZONE / TODAY
    # =====================================================

    timezone_name = (
        await get_user_timezone_name(
            user_id
        )
    )

    timezone = _get_timezone(
        timezone_name
    )

    now = datetime.now(
        timezone
    )

    today = now.date()

    # =====================================================
    # PERIODS
    # =====================================================

    ranges = _get_period_dates(
        normalized_period,
        today,
    )

    current_start = (
        ranges["current_start"]
    )

    current_end = (
        ranges["current_end"]
    )

    previous_start = (
        ranges["previous_start"]
    )

    previous_end = (
        ranges["previous_end"]
    )

    # =====================================================
    # ACHIEVEMENT DATETIME RANGE
    # =====================================================

    (
        achievement_datetime_from,
        achievement_datetime_to,
    ) = _date_range_to_datetimes(
        current_start,
        current_end,
        timezone,
    )

    # =====================================================
    # PARALLEL DATABASE REQUESTS
    # =====================================================

    (
        current_confirmation_count,
        previous_confirmation_count,
        weekday_rows,
        current_xp,
        previous_xp,
        achievement_rows,
        daily_rows,
    ) = await asyncio.gather(

        get_confirmation_count_for_period(
            user_id=user_id,
            date_from=current_start,
            date_to=current_end,
        ),

        get_confirmation_count_for_period(
            user_id=user_id,
            date_from=previous_start,
            date_to=previous_end,
        ),

        get_confirmations_by_weekday(
            user_id=user_id,
            date_from=current_start,
            date_to=current_end,
        ),

        _get_total_xp_for_period(
            user_id=user_id,
            date_from=current_start,
            date_to=current_end,
            timezone=timezone,
        ),

        _get_total_xp_for_period(
            user_id=user_id,
            date_from=previous_start,
            date_to=previous_end,
            timezone=timezone,
        ),

        get_achievements_for_period(
            user_id=user_id,
            datetime_from=achievement_datetime_from,
            datetime_to=achievement_datetime_to,
        ),

        get_daily_confirmation_counts(
            user_id=user_id,
            date_from=current_start,
            date_to=current_end,
        ),
    )

    # =====================================================
    # WEEKDAY ACTIVITY
    # =====================================================

    weekday_activity = (
        _prepare_weekday_activity(
            weekday_rows
        )
    )

    best_weekday = (
        _get_best_weekday(
            weekday_activity
        )
    )

    # =====================================================
    # ACHIEVEMENTS
    # =====================================================

    achievements = (
        _prepare_achievements(
            achievement_rows,
            timezone,
        )
    )

    # =====================================================
    # DAILY ACTIVITY
    # =====================================================

    daily_counts = (
        _daily_counts_map(
            daily_rows
        )
    )

    daily_dynamics = (
        _build_daily_dynamics(
            date_from=current_start,
            date_to=current_end,
            today=today,
            daily_counts=daily_counts,
            achievements=achievements,
        )
    )

    # =====================================================
    # GRAPH
    # =====================================================

    if normalized_period == "year":

        dynamics_points = (
            _compress_year_dynamics(
                daily_dynamics,
                achievements,
            )
        )

        dynamics_granularity = (
            "month"
        )

    else:

        dynamics_points = (
            daily_dynamics
        )

        dynamics_granularity = (
            "day"
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "period":
            normalized_period,

        "timezone":
            timezone_name,

        "date_from":
            current_start.isoformat(),

        "date_to":
            current_end.isoformat(),

        "previous_date_from":
            previous_start.isoformat(),

        "previous_date_to":
            previous_end.isoformat(),

        "weekday_activity":
            weekday_activity,

        "best_weekday":
            best_weekday,

        "confirmations": {
            "value":
                int(
                    current_confirmation_count
                ),

            "previous_value":
                int(
                    previous_confirmation_count
                ),

            "change":
                _calculate_change(
                    current_confirmation_count,
                    previous_confirmation_count,
                ),
        },

        "xp": {
            "value":
                int(
                    current_xp
                ),

            "previous_value":
                int(
                    previous_xp
                ),

            "change":
                _calculate_change(
                    current_xp,
                    previous_xp,
                ),
        },

        "activity_dynamics": {
            "granularity":
                dynamics_granularity,

            "points":
                dynamics_points,
        },

        "achievements":
            achievements,
    }
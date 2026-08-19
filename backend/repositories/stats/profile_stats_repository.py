from datetime import date, datetime
from typing import Any

from backend.database.database import get_connection


# =========================================================
# PROFILE STATS REPOSITORY
# =========================================================


# =========================================================
# ПОДТВЕРЖДЕНИЯ ЗА ПЕРИОД
# =========================================================

async def get_confirmations_for_period(
    user_id: int,
    date_from: date,
    date_to: date,
) -> list[dict[str, Any]]:
    """
    Возвращает активные подтверждения пользователя
    за указанный период включительно.

    date_from <= confirmation_date <= date_to

    Отменённые подтверждения:
        is_confirmed = FALSE

    не попадают в результат.
    """

    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                hc.id,
                hc.habit_id,
                hc.confirmation_date,
                hc.xp_awarded,
                hc.xp_amount
            FROM habit_confirmations AS hc

            INNER JOIN habits AS h
                ON h.id = hc.habit_id

            WHERE h.user_id = $1
              AND hc.is_confirmed = TRUE
              AND hc.confirmation_date >= $2
              AND hc.confirmation_date <= $3

            ORDER BY
                hc.confirmation_date ASC,
                hc.id ASC
            """,
            user_id,
            date_from,
            date_to,
        )

    return [
        dict(row)
        for row in rows
    ]


# =========================================================
# КОЛИЧЕСТВО ПОДТВЕРЖДЕНИЙ ЗА ПЕРИОД
# =========================================================

async def get_confirmation_count_for_period(
    user_id: int,
    date_from: date,
    date_to: date,
) -> int:
    """
    Возвращает общее количество активных подтверждений
    пользователя за указанный период.
    """

    async with get_connection() as connection:
        count = await connection.fetchval(
            """
            SELECT
                COUNT(*)
            FROM habit_confirmations AS hc

            INNER JOIN habits AS h
                ON h.id = hc.habit_id

            WHERE h.user_id = $1
              AND hc.is_confirmed = TRUE
              AND hc.confirmation_date >= $2
              AND hc.confirmation_date <= $3
            """,
            user_id,
            date_from,
            date_to,
        )

    return int(count or 0)


# =========================================================
# ПОДТВЕРЖДЕНИЯ ПО ДНЯМ
# =========================================================

async def get_daily_confirmation_counts(
    user_id: int,
    date_from: date,
    date_to: date,
) -> list[dict[str, Any]]:
    """
    Возвращает количество подтверждений
    отдельно для каждого активного дня.

    Пример:

    [
        {
            "confirmation_date": date(2026, 8, 10),
            "confirmations": 3,
        },
        {
            "confirmation_date": date(2026, 8, 11),
            "confirmations": 1,
        },
    ]

    Дни с нулём подтверждений здесь отсутствуют.

    Их позже добавит service, потому что именно service
    знает полный диапазон выбранного периода.
    """

    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                hc.confirmation_date,
                COUNT(*) AS confirmations
            FROM habit_confirmations AS hc

            INNER JOIN habits AS h
                ON h.id = hc.habit_id

            WHERE h.user_id = $1
              AND hc.is_confirmed = TRUE
              AND hc.confirmation_date >= $2
              AND hc.confirmation_date <= $3

            GROUP BY
                hc.confirmation_date

            ORDER BY
                hc.confirmation_date ASC
            """,
            user_id,
            date_from,
            date_to,
        )

    return [
        {
            "confirmation_date": row["confirmation_date"],
            "confirmations": int(
                row["confirmations"] or 0
            ),
        }
        for row in rows
    ]


# =========================================================
# ПОДТВЕРЖДЕНИЯ ПО ДНЯМ НЕДЕЛИ
# =========================================================

async def get_confirmations_by_weekday(
    user_id: int,
    date_from: date,
    date_to: date,
) -> list[dict[str, Any]]:
    """
    Группирует подтверждения по дням недели
    за выбранный период.

    PostgreSQL ISODOW:
        1 = Понедельник
        2 = Вторник
        ...
        7 = Воскресенье

    Repository возвращает только дни,
    в которых были подтверждения.

    Service позже дополнит отсутствующие дни нулями.
    """

    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                EXTRACT(
                    ISODOW FROM hc.confirmation_date
                )::INTEGER AS weekday,

                COUNT(*) AS confirmations

            FROM habit_confirmations AS hc

            INNER JOIN habits AS h
                ON h.id = hc.habit_id

            WHERE h.user_id = $1
              AND hc.is_confirmed = TRUE
              AND hc.confirmation_date >= $2
              AND hc.confirmation_date <= $3

            GROUP BY
                weekday

            ORDER BY
                weekday ASC
            """,
            user_id,
            date_from,
            date_to,
        )

    return [
        {
            "weekday": int(row["weekday"]),
            "confirmations": int(
                row["confirmations"] or 0
            ),
        }
        for row in rows
    ]


# =========================================================
# XP ЗА ПОДТВЕРЖДЕНИЯ
# =========================================================

async def get_confirmation_xp_for_period(
    user_id: int,
    date_from: date,
    date_to: date,
) -> int:
    """
    Возвращает XP, фактически начисленный
    пользователю за подтверждения привычек.

    Используем xp_awarded = TRUE,
    чтобы учитывать реальное правило начисления XP.
    """

    async with get_connection() as connection:
        xp = await connection.fetchval(
            """
            SELECT
                COALESCE(
                    SUM(hc.xp_amount),
                    0
                )
            FROM habit_confirmations AS hc

            INNER JOIN habits AS h
                ON h.id = hc.habit_id

            WHERE h.user_id = $1
              AND hc.is_confirmed = TRUE
              AND hc.xp_awarded = TRUE
              AND hc.confirmation_date >= $2
              AND hc.confirmation_date <= $3
            """,
            user_id,
            date_from,
            date_to,
        )

    return int(xp or 0)


# =========================================================
# XP ЗА ПРИГЛАШЕНИЯ
# =========================================================

async def get_referral_xp_for_period(
    user_id: int,
    datetime_from: datetime,
    datetime_to: datetime,
) -> int:
    """
    Возвращает XP, начисленный пользователю
    за приглашённых друзей в указанном периоде.

    datetime_from включительно.
    datetime_to не включительно.
    """

    async with get_connection() as connection:
        xp = await connection.fetchval(
            """
            SELECT
                COALESCE(
                    SUM(r.xp_amount),
                    0
                )
            FROM referrals AS r

            WHERE r.inviter_user_id = $1
              AND r.xp_awarded = TRUE
              AND r.created_at >= $2
              AND r.created_at < $3
            """,
            user_id,
            datetime_from,
            datetime_to,
        )

    return int(xp or 0)


# =========================================================
# XP ЗА ДОСТИЖЕНИЯ
# =========================================================

async def get_achievement_xp_for_period(
    user_id: int,
    datetime_from: datetime,
    datetime_to: datetime,
) -> int:
    """
    Возвращает XP, начисленный пользователю
    за достижения в указанном периоде.

    datetime_from включительно.
    datetime_to не включительно.
    """

    async with get_connection() as connection:
        xp = await connection.fetchval(
            """
            SELECT
                COALESCE(
                    SUM(ua.xp_amount),
                    0
                )
            FROM user_achievements AS ua

            WHERE ua.user_id = $1
              AND ua.xp_awarded = TRUE
              AND ua.earned_at >= $2
              AND ua.earned_at < $3
            """,
            user_id,
            datetime_from,
            datetime_to,
        )

    return int(xp or 0)


# =========================================================
# ДОСТИЖЕНИЯ ЗА ПЕРИОД
# =========================================================

async def get_achievements_for_period(
    user_id: int,
    datetime_from: datetime,
    datetime_to: datetime,
) -> list[dict[str, Any]]:
    """
    Возвращает достижения, полученные пользователем
    за выбранный период.

    Repository возвращает только данные из БД.

    Название, категория, target и изображение
    будут добавлены позже через achievements config/service.
    """

    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                id,
                achievement_code,
                earned_at,
                xp_awarded,
                xp_amount
            FROM user_achievements

            WHERE user_id = $1
              AND earned_at >= $2
              AND earned_at < $3

            ORDER BY
                earned_at ASC,
                id ASC
            """,
            user_id,
            datetime_from,
            datetime_to,
        )

    return [
        dict(row)
        for row in rows
    ]


async def get_user_timezone_name(
    user_id: int,
) -> str:
    """
    Возвращает часовой пояс пользователя.

    Если user_settings отсутствует или timezone пустой,
    используем Europe/Kyiv.
    """

    async with get_connection() as connection:
        timezone_name = await connection.fetchval(
            """
            SELECT timezone
            FROM user_settings
            WHERE user_id = $1
            """,
            user_id,
        )

    return (
        str(timezone_name)
        if timezone_name
        else "Europe/Kyiv"
    )
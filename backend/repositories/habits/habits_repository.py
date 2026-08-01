from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from backend.database.database import get_connection


DAILY_XP_CONFIRMATIONS_LIMIT = 3
DEFAULT_TIMEZONE = "Europe/Kyiv"


# =========================================================
# ПОЛУЧИТЬ ПРИВЫЧКИ ПОЛЬЗОВАТЕЛЯ
# =========================================================

async def get_user_habits(
    user_id: int,
) -> dict[str, Any]:
    async with get_connection() as connection:
        timezone_name = await connection.fetchval(
            """
            SELECT timezone
            FROM user_settings
            WHERE user_id = $1
            """,
            user_id,
        )

        today = get_user_local_date(
            timezone_name
        )

        week_start = today - timedelta(
            days=today.weekday()
        )

        week_end = week_start + timedelta(
            days=6
        )

        habit_rows = await connection.fetch(
            """
            SELECT
                h.id,
                h.user_id,
                h.title,
                h.emoji,
                h.color,
                h.size,
                h.xp_reward,
                h.is_archived,
                h.created_at,
                h.updated_at,

                COALESCE(
                    today_confirmation.is_confirmed,
                    FALSE
                ) AS completed_today,

                COALESCE(
                    today_confirmation.xp_awarded,
                    FALSE
                ) AS xp_awarded_today,

                COALESCE(
                    today_confirmation.xp_amount,
                    0
                ) AS xp_amount_today

            FROM habits AS h

            LEFT JOIN habit_confirmations
                AS today_confirmation
                ON today_confirmation.habit_id = h.id
                AND today_confirmation.confirmation_date = $2

            WHERE h.user_id = $1
              AND h.is_archived = FALSE

            ORDER BY
                h.created_at ASC,
                h.id ASC
            """,
            user_id,
            today,
        )

        week_rows = await connection.fetch(
            """
            SELECT
                hc.habit_id,
                hc.confirmation_date

            FROM habit_confirmations AS hc

            INNER JOIN habits AS h
                ON h.id = hc.habit_id

            WHERE h.user_id = $1
              AND hc.confirmation_date
                  BETWEEN $2 AND $3
              AND hc.is_confirmed = TRUE
            """,
            user_id,
            week_start,
            week_end,
        )

        statistics = await connection.fetchrow(
            """
            SELECT
                current_streak,
                max_streak,
                total_confirmations,
                total_xp
            FROM user_stats
            WHERE user_id = $1
            """,
            user_id,
        )

    week_progress_by_habit: dict[int, list[bool]] = {}

    for row in habit_rows:
        week_progress_by_habit[
            row["id"]
        ] = [
            False,
            False,
            False,
            False,
            False,
            False,
            False,
        ]

    for row in week_rows:
        habit_id = row["habit_id"]

        day_index = (
            row["confirmation_date"]
            - week_start
        ).days

        if (
            habit_id
            in week_progress_by_habit
            and 0 <= day_index <= 6
        ):
            week_progress_by_habit[
                habit_id
            ][day_index] = True

    habits = []

    for row in habit_rows:
        habit = dict(row)

        habit["week_progress"] = (
            week_progress_by_habit.get(
                row["id"],
                [
                    False,
                    False,
                    False,
                    False,
                    False,
                    False,
                    False,
                ],
            )
        )

        habit["streak"] = 0

        habits.append(habit)

    return {
        "habits": habits,

        "statistics": {
            "current_streak": (
                statistics["current_streak"]
                if statistics
                else 0
            ),
            "max_streak": (
                statistics["max_streak"]
                if statistics
                else 0
            ),
            "total_confirmations": (
                statistics[
                    "total_confirmations"
                ]
                if statistics
                else 0
            ),
            "total_xp": (
                statistics["total_xp"]
                if statistics
                else 0
            ),
        },
    }

# =========================================================
# СОЗДАТЬ ПРИВЫЧКУ
# =========================================================

async def create_habit(
    user_id: int,
    title: str,
    emoji: str,
    color: str,
    size: str,
) -> dict[str, Any]:
    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            INSERT INTO habits (
                user_id,
                title,
                emoji,
                color,
                size
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                user_id,
                title,
                emoji,
                color,
                size,
                xp_reward,
                is_archived,
                created_at,
                updated_at
            """,
            user_id,
            title,
            emoji,
            color,
            size,
        )

    if row is None:
        raise RuntimeError(
            "Не удалось создать привычку"
        )

    return dict(row)


# =========================================================
# ОБНОВИТЬ ПРИВЫЧКУ
# =========================================================

async def update_habit(
    user_id: int,
    habit_id: int,
    title: str,
    emoji: str,
    color: str,
    size: str,
) -> dict[str, Any] | None:
    """
    Обновляет привычку текущего пользователя.

    Возвращает обновлённую привычку.

    Возвращает None, если:
    - привычка не найдена;
    - привычка принадлежит другому пользователю;
    - привычка уже находится в архиве.
    """

    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            UPDATE habits
            SET
                title = $3,
                emoji = $4,
                color = $5,
                size = $6,
                updated_at = NOW()
            WHERE id = $1
              AND user_id = $2
              AND is_archived = FALSE
            RETURNING
                id,
                user_id,
                title,
                emoji,
                color,
                size,
                xp_reward,
                is_archived,
                created_at,
                updated_at
            """,
            habit_id,
            user_id,
            title,
            emoji,
            color,
            size,
        )

    if row is None:
        return None

    return dict(row)


# =========================================================
# ПОЛУЧИТЬ ЛОКАЛЬНУЮ ДАТУ ПОЛЬЗОВАТЕЛЯ
# =========================================================

def get_user_local_date(
    timezone_name: str | None,
):
    safe_timezone = (
        timezone_name
        or DEFAULT_TIMEZONE
    )

    try:
        timezone = ZoneInfo(
            safe_timezone
        )
    except ZoneInfoNotFoundError:
        timezone = ZoneInfo(
            DEFAULT_TIMEZONE
        )

    return datetime.now(
        timezone
    ).date()


# =========================================================
# УСТАНОВИТЬ СОСТОЯНИЕ ПОДТВЕРЖДЕНИЯ
#
# is_confirmed=True  — подтвердить
# is_confirmed=False — отменить
#
# Повторный одинаковый запрос безопасен.
# =========================================================

async def set_habit_confirmation(
    user_id: int,
    habit_id: int,
    is_confirmed: bool,
) -> dict[str, Any] | None:
    async with get_connection() as connection:
        async with connection.transaction():

            # -------------------------------------------------
            # Проверяем, что привычка существует
            # и принадлежит текущему пользователю.
            #
            # FOR UPDATE защищает привычку от одновременных
            # операций подтверждения.
            # -------------------------------------------------

            habit = await connection.fetchrow(
                """
                SELECT
                    id,
                    user_id,
                    xp_reward
                FROM habits
                WHERE id = $1
                  AND user_id = $2
                  AND is_archived = FALSE
                FOR UPDATE
                """,
                habit_id,
                user_id,
            )

            if habit is None:
                return None

            # -------------------------------------------------
            # Получаем часовой пояс пользователя.
            # Если строки нет, используем Europe/Kyiv.
            # -------------------------------------------------

            timezone_name = await connection.fetchval(
                """
                SELECT timezone
                FROM user_settings
                WHERE user_id = $1
                """,
                user_id,
            )

            confirmation_date = get_user_local_date(
                timezone_name
            )

            # -------------------------------------------------
            # Получаем существующее подтверждение за сегодня.
            # -------------------------------------------------

            confirmation = await connection.fetchrow(
                """
                SELECT
                    id,
                    is_confirmed,
                    xp_awarded,
                    xp_amount
                FROM habit_confirmations
                WHERE habit_id = $1
                  AND confirmation_date = $2
                FOR UPDATE
                """,
                habit_id,
                confirmation_date,
            )

            # -------------------------------------------------
            # ПОДТВЕРЖДЕНИЕ
            # -------------------------------------------------

            if is_confirmed:

                # Уже подтверждено.
                # Ничего повторно не начисляем.
                if (
                    confirmation is not None
                    and confirmation["is_confirmed"]
                ):
                    pass

                else:
                    awarded_confirmations_today = (
                        await connection.fetchval(
                            """
                            SELECT COUNT(*)
                            FROM habit_confirmations AS hc
                            INNER JOIN habits AS h
                                ON h.id = hc.habit_id
                            WHERE h.user_id = $1
                              AND hc.confirmation_date = $2
                              AND hc.is_confirmed = TRUE
                              AND hc.xp_awarded = TRUE
                            """,
                            user_id,
                            confirmation_date,
                        )
                    )

                    should_award_xp = (
                        awarded_confirmations_today
                        < DAILY_XP_CONFIRMATIONS_LIMIT
                    )

                    xp_amount = (
                        int(habit["xp_reward"])
                        if should_award_xp
                        else 0
                    )

                    await connection.execute(
                        """
                        INSERT INTO habit_confirmations (
                            habit_id,
                            confirmation_date,
                            is_confirmed,
                            xp_awarded,
                            xp_amount
                        )
                        VALUES (
                            $1,
                            $2,
                            TRUE,
                            $3,
                            $4
                        )
                        ON CONFLICT (
                            habit_id,
                            confirmation_date
                        )
                        DO UPDATE SET
                            is_confirmed = TRUE,
                            xp_awarded = EXCLUDED.xp_awarded,
                            xp_amount = EXCLUDED.xp_amount,
                            updated_at = NOW()
                        """,
                        habit_id,
                        confirmation_date,
                        should_award_xp,
                        xp_amount,
                    )

            # -------------------------------------------------
            # ОТМЕНА ПОДТВЕРЖДЕНИЯ
            # -------------------------------------------------

            else:
                if confirmation is not None:
                    await connection.execute(
                        """
                        UPDATE habit_confirmations
                        SET
                            is_confirmed = FALSE,
                            xp_awarded = FALSE,
                            xp_amount = 0,
                            updated_at = NOW()
                        WHERE id = $1
                        """,
                        confirmation["id"],
                    )

            # -------------------------------------------------
            # Пересчитываем только базовую статистику.
            #
            # current_streak и max_streak пока не трогаем.
            # -------------------------------------------------

            statistics = await connection.fetchrow(
                """
                SELECT
                    COUNT(*) FILTER (
                        WHERE hc.is_confirmed = TRUE
                    )::INTEGER
                        AS total_confirmations,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN hc.is_confirmed = TRUE
                                 AND hc.xp_awarded = TRUE
                                THEN hc.xp_amount
                                ELSE 0
                            END
                        ),
                        0
                    )::INTEGER
                        AS total_xp

                FROM habit_confirmations AS hc
                INNER JOIN habits AS h
                    ON h.id = hc.habit_id
                WHERE h.user_id = $1
                """,
                user_id,
            )

            total_confirmations = (
                statistics["total_confirmations"]
                if statistics
                else 0
            )

            total_xp = (
                statistics["total_xp"]
                if statistics
                else 0
            )

            await connection.execute(
                """
                INSERT INTO user_stats (
                    user_id,
                    total_confirmations,
                    total_xp
                )
                VALUES ($1, $2, $3)

                ON CONFLICT (user_id)
                DO UPDATE SET
                    total_confirmations =
                        EXCLUDED.total_confirmations,
                    total_xp =
                        EXCLUDED.total_xp,
                    updated_at = NOW()
                """,
                user_id,
                total_confirmations,
                total_xp,
            )

            # -------------------------------------------------
            # Получаем финальное состояние подтверждения.
            # -------------------------------------------------

            final_confirmation = await connection.fetchrow(
                """
                SELECT
                    is_confirmed,
                    xp_awarded,
                    xp_amount
                FROM habit_confirmations
                WHERE habit_id = $1
                  AND confirmation_date = $2
                """,
                habit_id,
                confirmation_date,
            )

            completed_today = bool(
                final_confirmation
                and final_confirmation[
                    "is_confirmed"
                ]
            )

            xp_awarded_today = bool(
                final_confirmation
                and final_confirmation[
                    "is_confirmed"
                ]
                and final_confirmation[
                    "xp_awarded"
                ]
            )

            xp_amount_today = (
                int(
                    final_confirmation[
                        "xp_amount"
                    ]
                )
                if xp_awarded_today
                else 0
            )

            return {
                "habit": {
                    "id": habit_id,
                    "completed_today":
                        completed_today,
                    "xp_awarded_today":
                        xp_awarded_today,
                    "xp_amount_today":
                        xp_amount_today,
                    "confirmation_date":
                        confirmation_date,
                },
                "statistics": {
                    "total_confirmations":
                        total_confirmations,
                    "total_xp":
                        total_xp,
                },
            }
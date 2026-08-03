from datetime import date, datetime, timedelta
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
        # -------------------------------------------------
        # Получаем часовой пояс пользователя.
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Получаем все активные привычки пользователя.
        #
        # Отдельно присоединяем подтверждение за сегодня,
        # чтобы сразу вернуть completed_today.
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Получаем подтверждения текущей недели.
        #
        # Пока сохраняем текущую рабочую логику
        # week_progress.
        # -------------------------------------------------

        week_rows = await connection.fetch(
            """
            SELECT
                hc.habit_id,
                hc.confirmation_date

            FROM habit_confirmations AS hc

            INNER JOIN habits AS h
                ON h.id = hc.habit_id

            WHERE h.user_id = $1
              AND h.is_archived = FALSE
              AND hc.confirmation_date
                  BETWEEN $2 AND $3
              AND hc.is_confirmed = TRUE

            ORDER BY
                hc.confirmation_date ASC
            """,
            user_id,
            week_start,
            week_end,
        )

        # -------------------------------------------------
        # Получаем всю историю подтверждённых дат
        # каждой активной привычки пользователя.
        #
        # Эти даты будут использоваться:
        # - календарём;
        # - серией конкретной привычки;
        # - недельным прогрессом.
        # -------------------------------------------------

        completed_dates_rows = await connection.fetch(
            """
            SELECT
                hc.habit_id,
                hc.confirmation_date

            FROM habit_confirmations AS hc

            INNER JOIN habits AS h
                ON h.id = hc.habit_id

            WHERE h.user_id = $1
              AND h.is_archived = FALSE
              AND hc.is_confirmed = TRUE

            ORDER BY
                hc.habit_id ASC,
                hc.confirmation_date ASC
            """,
            user_id,
        )

        # -------------------------------------------------
        # Общую статистику пока только читаем.
        #
        # На этом этапе общий current_streak
        # и max_streak не пересчитываем.
        # -------------------------------------------------

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

    # =====================================================
    # СОБИРАЕМ НЕДЕЛЬНЫЙ ПРОГРЕСС
    # =====================================================

    week_progress_by_habit: dict[
        int,
        list[bool],
    ] = {}

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

    # =====================================================
    # СОБИРАЕМ COMPLETED DATES
    # =====================================================

    completed_dates_by_habit: dict[
        int,
        list[date],
    ] = {}

    for row in habit_rows:
        completed_dates_by_habit[
            row["id"]
        ] = []

    for row in completed_dates_rows:
        habit_id = row["habit_id"]

        if (
            habit_id
            not in completed_dates_by_habit
        ):
            continue

        completed_dates_by_habit[
            habit_id
        ].append(
            row["confirmation_date"]
        )

    # =====================================================
    # ФОРМИРУЕМ ФИНАЛЬНЫЙ СПИСОК ПРИВЫЧЕК
    # =====================================================

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

        habit_completed_dates = (
            completed_dates_by_habit.get(
                row["id"],
                [],
            )
        )

        habit["completed_dates"] = [
            completed_date.isoformat()
            for completed_date
            in habit_completed_dates
        ]

        habit["streak"] = (
            calculate_habit_streak(
                completed_dates=
                    habit_completed_dates,
                today=today,
            )
        )

        habit["max_streak"] = (
            calculate_habit_max_streak(
                completed_dates=
                    habit_completed_dates,
            )
        )

        habit["completed_count"] = len(
            habit_completed_dates
        )

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
    - привычка находится в архиве.
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
# АРХИВИРОВАТЬ ПРИВЫЧКУ
# =========================================================

async def archive_habit(
    user_id: int,
    habit_id: int,
) -> bool:
    """
    Перемещает привычку пользователя в архив.

    Возвращает:
        True  — привычка успешно архивирована.
        False — привычка не найдена.
    """

    async with get_connection() as connection:
        result = await connection.execute(
            """
            UPDATE habits
            SET
                is_archived = TRUE,
                updated_at = NOW()
            WHERE id = $1
              AND user_id = $2
              AND is_archived = FALSE
            """,
            habit_id,
            user_id,
        )

    return result == "UPDATE 1"


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
# РАССЧИТАТЬ ТЕКУЩУЮ СЕРИЮ ПРИВЫЧКИ
# =========================================================

def calculate_habit_streak(
    completed_dates: list[date],
    today: date,
) -> int:
    """
    Считает текущую серию конкретной привычки.

    Если привычка подтверждена сегодня,
    серия считается назад от сегодняшнего дня.

    Если сегодня ещё не подтверждена,
    серия считается назад от вчерашнего дня.
    Текущий незавершённый день серию не обрывает.
    """

    if not completed_dates:
        return 0

    completed_dates_set = set(
        completed_dates
    )

    if today in completed_dates_set:
        current_date = today
    else:
        current_date = (
            today - timedelta(days=1)
        )

    streak = 0

    while (
        current_date
        in completed_dates_set
    ):
        streak += 1

        current_date -= timedelta(
            days=1
        )

    return streak


# =========================================================
# РАССЧИТАТЬ МАКСИМАЛЬНУЮ СЕРИЮ ПРИВЫЧКИ
# =========================================================

def calculate_habit_max_streak(
    completed_dates: list[date],
) -> int:
    """
    Считает самую длинную серию привычки
    за всю историю подтверждений.
    """

    if not completed_dates:
        return 0

    unique_dates = sorted(
        set(completed_dates)
    )

    max_streak = 1
    current_streak = 1

    for index in range(
        1,
        len(unique_dates),
    ):
        previous_date = (
            unique_dates[index - 1]
        )

        current_date = (
            unique_dates[index]
        )

        if (
            current_date
            - previous_date
            == timedelta(days=1)
        ):
            current_streak += 1
        else:
            current_streak = 1

        max_streak = max(
            max_streak,
            current_streak,
        )

    return max_streak


# =========================================================
# РАССЧИТАТЬ ОБЩУЮ ТЕКУЩУЮ СЕРИЮ ПОЛЬЗОВАТЕЛЯ
# =========================================================

def calculate_user_streak(
    confirmation_dates: list[date],
    today: date,
) -> int:
    """
    Считает общий текущий стрик пользователя.

    День засчитывается, если в этот день была
    подтверждена хотя бы одна привычка.

    Несколько подтверждений в один день
    считаются одним днём серии.

    Если сегодня ещё ничего не подтверждено,
    серия считается назад от вчерашнего дня.
    """

    if not confirmation_dates:
        return 0

    unique_dates = set(
        confirmation_dates
    )

    if today in unique_dates:
        current_date = today
    else:
        current_date = (
            today - timedelta(days=1)
        )

    streak = 0

    while current_date in unique_dates:
        streak += 1

        current_date -= timedelta(
            days=1
        )

    return streak

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
                # Повторно ничего не начисляем.
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
                            xp_awarded =
                                EXCLUDED.xp_awarded,
                            xp_amount =
                                EXCLUDED.xp_amount,
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
            # ПЕРЕСЧИТЫВАЕМ ОБЩУЮ СТАТИСТИКУ ПОЛЬЗОВАТЕЛЯ
            #
            # total_confirmations:
            # количество всех активных подтверждений.
            #
            # total_xp:
            # сумма реально начисленного XP.
            #
            # current_streak:
            # количество дней подряд, в которые была
            # подтверждена хотя бы одна привычка.
            #
            # max_streak:
            # исторический рекорд общего стрика.
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

            user_confirmation_rows = (
                await connection.fetch(
                    """
                    SELECT DISTINCT
                        hc.confirmation_date

                    FROM habit_confirmations AS hc

                    INNER JOIN habits AS h
                        ON h.id = hc.habit_id

                    WHERE h.user_id = $1
                      AND hc.is_confirmed = TRUE

                    ORDER BY
                        hc.confirmation_date ASC
                    """,
                    user_id,
                )
            )

            user_confirmation_dates = [
                row["confirmation_date"]
                for row in user_confirmation_rows
            ]

            current_streak = (
                calculate_user_streak(
                    confirmation_dates=
                        user_confirmation_dates,
                    today=confirmation_date,
                )
            )

            previous_max_streak = (
                await connection.fetchval(
                    """
                    SELECT max_streak
                    FROM user_stats
                    WHERE user_id = $1
                    FOR UPDATE
                    """,
                    user_id,
                )
            )

            max_streak = max(
                int(previous_max_streak or 0),
                current_streak,
            )

            await connection.execute(
                """
                INSERT INTO user_stats (
                    user_id,
                    current_streak,
                    max_streak,
                    total_confirmations,
                    total_xp
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5
                )

                ON CONFLICT (user_id)
                DO UPDATE SET
                    current_streak =
                        EXCLUDED.current_streak,

                    max_streak =
                        GREATEST(
                            user_stats.max_streak,
                            EXCLUDED.max_streak
                        ),

                    total_confirmations =
                        EXCLUDED.total_confirmations,

                    total_xp =
                        EXCLUDED.total_xp,

                    updated_at = NOW()
                """,
                user_id,
                current_streak,
                max_streak,
                total_confirmations,
                total_xp,
            )
            # -------------------------------------------------
            # Получаем финальное состояние подтверждения
            # за сегодняшний день.
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

            # -------------------------------------------------
            # Получаем все актуальные подтверждённые даты
            # изменённой привычки.
            #
            # Эти данные сразу возвращаются frontend,
            # чтобы без полного GET обновить:
            # - календарь;
            # - серию;
            # - недельный прогресс.
            # -------------------------------------------------

            completed_date_rows = await connection.fetch(
                """
                SELECT
                    confirmation_date
                FROM habit_confirmations
                WHERE habit_id = $1
                  AND is_confirmed = TRUE
                ORDER BY confirmation_date ASC
                """,
                habit_id,
            )

            habit_completed_dates = [
                row["confirmation_date"]
                for row in completed_date_rows
            ]

            # -------------------------------------------------
            # Рассчитываем актуальную серию привычки.
            # -------------------------------------------------

            habit_streak = calculate_habit_streak(
                completed_dates=
                    habit_completed_dates,
                today=confirmation_date,
            )

            habit_max_streak = (
                calculate_habit_max_streak(
                    completed_dates=
                        habit_completed_dates,
                )
            )

            habit_completed_count = len(
                habit_completed_dates
            )

            # -------------------------------------------------
            # Формируем недельный прогресс:
            #
            # 0 — понедельник
            # 1 — вторник
            # ...
            # 6 — воскресенье
            # -------------------------------------------------

            week_start = (
                confirmation_date
                - timedelta(
                    days=
                        confirmation_date.weekday()
                )
            )

            habit_week_progress = [
                False,
                False,
                False,
                False,
                False,
                False,
                False,
            ]

            for completed_date in (
                habit_completed_dates
            ):
                day_index = (
                    completed_date
                    - week_start
                ).days

                if 0 <= day_index <= 6:
                    habit_week_progress[
                        day_index
                    ] = True

            # -------------------------------------------------
            # Возвращаем frontend полное актуальное
            # состояние изменённой привычки.
            # -------------------------------------------------

            return {
                "habit": {
                    "id":
                        habit_id,

                    "completed_today":
                        completed_today,

                    "completed_dates": [
                        completed_date.isoformat()
                        for completed_date
                        in habit_completed_dates
                    ],

                    "streak":
                        habit_streak,

                    "max_streak":
                        habit_max_streak,

                    "completed_count":
                        habit_completed_count,

                    "week_progress":
                        habit_week_progress,

                    "xp_awarded_today":
                        xp_awarded_today,

                    "xp_amount_today":
                        xp_amount_today,

                    "confirmation_date":
                        confirmation_date.isoformat(),
                },

                "statistics": {
                    "current_streak":
                        current_streak,

                    "max_streak":
                        max_streak,

                    "total_confirmations":
                        total_confirmations,

                    "total_xp":
                        total_xp,
                },
            }
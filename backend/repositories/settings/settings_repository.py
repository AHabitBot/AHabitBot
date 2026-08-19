from backend.database.database import get_pool


# =========================================================
# ПОЛУЧИТЬ НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ
# =========================================================

async def get_user_settings(
    user_id: int,
) -> dict:
    """
    Возвращает настройки пользователя.

    Если строки user_settings ещё нет,
    она создаётся автоматически со значениями по умолчанию.
    """

    pool = await get_pool()

    async with pool.acquire() as connection:

        row = await connection.fetchrow(
            """
            INSERT INTO user_settings (
                user_id
            )
            VALUES (
                $1
            )

            ON CONFLICT (user_id)
            DO UPDATE SET
                user_id = EXCLUDED.user_id

            RETURNING
                user_id,
                timezone,
                language,
                theme,
                reminders_enabled,
                last_reminder_date
            """,
            user_id,
        )

    return {
        "user_id": int(
            row["user_id"]
        ),

        "timezone":
            row["timezone"]
            or "Europe/Kyiv",

        "language":
            row["language"]
            or "ru",

        "theme":
            row["theme"]
            or "light",

        "reminders_enabled":
            bool(
                row["reminders_enabled"]
            ),

        "last_reminder_date":
            (
                row["last_reminder_date"].isoformat()
                if row["last_reminder_date"]
                else None
            ),
    }


# =========================================================
# ИЗМЕНИТЬ СОСТОЯНИЕ НАПОМИНАНИЙ
# =========================================================

async def set_reminders_enabled(
    user_id: int,
    enabled: bool,
) -> dict:
    """
    Включает или выключает напоминания пользователя.

    При включении/выключении не трогаем timezone.
    """

    pool = await get_pool()

    async with pool.acquire() as connection:

        row = await connection.fetchrow(
            """
            INSERT INTO user_settings (
                user_id,
                reminders_enabled
            )
            VALUES (
                $1,
                $2
            )

            ON CONFLICT (user_id)
            DO UPDATE SET
                reminders_enabled =
                    EXCLUDED.reminders_enabled,

                updated_at = NOW()

            RETURNING
                user_id,
                timezone,
                language,
                theme,
                reminders_enabled,
                last_reminder_date
            """,
            user_id,
            enabled,
        )

    return {
        "user_id": int(
            row["user_id"]
        ),

        "timezone":
            row["timezone"]
            or "Europe/Kyiv",

        "language":
            row["language"]
            or "ru",

        "theme":
            row["theme"]
            or "light",

        "reminders_enabled":
            bool(
                row["reminders_enabled"]
            ),

        "last_reminder_date":
            (
                row["last_reminder_date"].isoformat()
                if row["last_reminder_date"]
                else None
            ),
    }
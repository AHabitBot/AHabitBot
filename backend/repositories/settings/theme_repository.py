from backend.database.database import get_pool


async def set_user_theme(user_id: int, theme: str) -> dict:
    pool = await get_pool()

    async with pool.acquire() as connection:
        row = await connection.fetchrow(
            """
            INSERT INTO user_settings (
                user_id,
                theme
            )
            VALUES ($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET
                theme = EXCLUDED.theme,
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
            theme,
        )

    return {
        "user_id": int(row["user_id"]),
        "timezone": row["timezone"] or "Europe/Kyiv",
        "language": row["language"] or "ru",
        "theme": row["theme"] or "light",
        "reminders_enabled": bool(row["reminders_enabled"]),
        "last_reminder_date": (
            row["last_reminder_date"].isoformat()
            if row["last_reminder_date"]
            else None
        ),
    }

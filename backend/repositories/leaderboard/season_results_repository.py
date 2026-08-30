from typing import Any

import asyncpg

from backend.database.database import get_connection


# =========================================================
# SEASON RESULTS REPOSITORY
# =========================================================


async def get_user_season_results(
    user_id: int,
) -> list[dict[str, Any]]:
    """
    Возвращает сохранённые финальные результаты сезонов
    конкретного пользователя.

    В таблицу season_results позже будут попадать только
    участники с final_xp > 0, поэтому дополнительная логика
    фильтрации в интерфейсе не нужна.
    """

    try:
        async with get_connection() as connection:
            rows = await connection.fetch(
                """
                SELECT
                    season_number,
                    final_rank,
                    final_xp,
                    season_start_date,
                    season_end_date,
                    finalized_at
                FROM season_results
                WHERE user_id = $1
                  AND final_xp > 0
                ORDER BY season_number DESC
                """,
                user_id,
            )

    except asyncpg.UndefinedTableError:
        # История сезонов — дополнительный блок.
        # Если миграция ещё не применена, не ломаем bootstrap.
        return []

    return [
        dict(row)
        for row in rows
    ]

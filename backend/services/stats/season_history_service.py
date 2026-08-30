from typing import Any

from backend.repositories.leaderboard.season_results_repository import (
    get_user_season_results,
)


# =========================================================
# PROFILE — SEASON HISTORY
# =========================================================


async def get_profile_season_history(
    user_id: int,
) -> list[dict[str, Any]]:
    """
    История уже завершённых сезонов пользователя.

    Это read-only слой: текущий сезон сюда не попадает.
    Данные берутся только из season_results.
    """

    rows = await get_user_season_results(
        user_id=user_id,
    )

    return [
        {
            "season_number": int(
                row["season_number"]
            ),
            "final_rank": int(
                row["final_rank"]
            ),
            "final_xp": int(
                row["final_xp"]
            ),
            "start_date": (
                row["season_start_date"].isoformat()
            ),
            "end_date": (
                row["season_end_date"].isoformat()
            ),
        }
        for row in rows
    ]

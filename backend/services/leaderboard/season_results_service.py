from backend.repositories.leaderboard.season_results_repository import finalize_season, get_finished_season_payload
from backend.services.leaderboard.season_service import get_next_season, get_season_dates, get_season_ranking_end_date


async def ensure_and_get_finished_season(season_number: int, user_id: int) -> dict:
    start_date, official_end = get_season_dates(season_number)
    ranking_end = get_season_ranking_end_date(season_number)
    await finalize_season(season_number, start_date, official_end)
    payload = await get_finished_season_payload(season_number, user_id, start_date, ranking_end)
    next_number, next_start, next_end = get_next_season(season_number)
    return {
        "season": {
            "number": season_number,
            "status": "finished",
            "start_date": start_date.isoformat(),
            "ranking_end_date": ranking_end.isoformat(),
            "end_date": official_end.isoformat(),
        },
        **payload,
        "next_season": {
            "number": next_number,
            "start_date": next_start.isoformat(),
            "end_date": next_end.isoformat(),
        },
    }

import asyncpg
from backend.database.database import get_connection


async def finalize_season(season_number: int, season_start_date, season_end_date) -> int:
    """Persist immutable final ranks once, rebuilding XP from all award sources."""
    from backend.services.leaderboard.season_service import get_season_ranking_end_date
    ranking_end = get_season_ranking_end_date(season_number)
    async with get_connection() as connection:
        result = await connection.execute(
            """
            WITH xp AS (
                SELECT user_id, SUM(xp)::INTEGER AS final_xp
                FROM (
                    SELECT h.user_id, hc.xp_amount::INTEGER AS xp
                    FROM habit_confirmations hc
                    JOIN habits h ON h.id = hc.habit_id
                    WHERE hc.is_confirmed = TRUE AND hc.xp_awarded = TRUE
                      AND (hc.created_at AT TIME ZONE 'Europe/Kyiv')::DATE BETWEEN $2 AND $3
                    UNION ALL
                    SELECT r.inviter_user_id, r.xp_amount::INTEGER
                    FROM referrals r
                    WHERE r.xp_awarded = TRUE
                      AND (r.created_at AT TIME ZONE 'Europe/Kyiv')::DATE BETWEEN $2 AND $3
                    UNION ALL
                    SELECT ua.user_id, ua.xp_amount::INTEGER
                    FROM user_achievements ua
                    WHERE ua.xp_awarded = TRUE
                      AND (ua.earned_at AT TIME ZONE 'Europe/Kyiv')::DATE BETWEEN $2 AND $3
                ) awards
                GROUP BY user_id
                HAVING SUM(xp) > 0
            ), ranked AS (
                SELECT user_id, final_xp,
                       ROW_NUMBER() OVER (ORDER BY final_xp DESC, user_id ASC)::INTEGER AS final_rank
                FROM xp
            )
            INSERT INTO season_results (
                season_number, user_id, final_rank, final_xp,
                season_start_date, season_end_date, finalized_at
            )
            SELECT $1, user_id, final_rank, final_xp, $2, $4, NOW()
            FROM ranked
            ON CONFLICT (season_number, user_id) DO NOTHING
            """,
            season_number, season_start_date, ranking_end, season_end_date,
        )
        return int(result.split()[-1])


async def get_finished_season_payload(season_number: int, user_id: int, active_start, active_end) -> dict:
    async with get_connection() as connection:
        top3 = await connection.fetch(
            """
            SELECT sr.final_rank AS rank, sr.user_id, u.nickname, u.avatar_key,
                   sr.final_xp AS season_xp
            FROM season_results sr
            JOIN users u ON u.id = sr.user_id
            WHERE sr.season_number = $1 AND sr.final_rank <= 3
            ORDER BY sr.final_rank ASC
            """, season_number,
        )
        current_user = await connection.fetchrow(
            """
            SELECT sr.final_rank AS rank, sr.final_xp AS season_xp,
                   u.avatar_key, u.nickname
            FROM season_results sr
            JOIN users u ON u.id = sr.user_id
            WHERE sr.season_number = $1 AND sr.user_id = $2
            """, season_number, user_id,
        )
        participants = await connection.fetchval(
            "SELECT COUNT(*) FROM season_results WHERE season_number = $1", season_number,
        )
        confirmations = await connection.fetchval(
            """
            SELECT COUNT(*) FROM habit_confirmations hc
            JOIN habits h ON h.id = hc.habit_id
            WHERE hc.is_confirmed = TRUE
              AND (hc.created_at AT TIME ZONE 'Europe/Kyiv')::DATE BETWEEN $1 AND $2
              AND EXISTS (
                  SELECT 1 FROM season_results sr
                  WHERE sr.season_number = $3 AND sr.user_id = h.user_id
              )
            """, active_start, active_end, season_number,
        )
        best_streak = await connection.fetchrow(
            """
            WITH days AS (
                SELECT DISTINCT h.user_id,
                       (hc.created_at AT TIME ZONE 'Europe/Kyiv')::DATE AS day
                FROM habit_confirmations hc
                JOIN habits h ON h.id = hc.habit_id
                JOIN season_results sr ON sr.user_id = h.user_id AND sr.season_number = $3
                WHERE hc.is_confirmed = TRUE
                  AND (hc.created_at AT TIME ZONE 'Europe/Kyiv')::DATE BETWEEN $1 AND $2
            ), grouped AS (
                SELECT user_id, day,
                       day - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day))::INTEGER AS grp
                FROM days
            ), streaks AS (
                SELECT user_id, COUNT(*)::INTEGER AS streak
                FROM grouped
                GROUP BY user_id, grp
            )
            SELECT s.streak, u.nickname
            FROM streaks s
            JOIN users u ON u.id = s.user_id
            ORDER BY s.streak DESC, s.user_id ASC
            LIMIT 1
            """, active_start, active_end, season_number,
        )
        popular_habit = await connection.fetchrow(
            """
            SELECT h.title, u.nickname, COUNT(*)::INTEGER AS confirmations
            FROM habit_confirmations hc
            JOIN habits h ON h.id = hc.habit_id
            JOIN users u ON u.id = h.user_id
            JOIN season_results sr ON sr.user_id = h.user_id AND sr.season_number = $3
            WHERE hc.is_confirmed = TRUE
              AND (hc.created_at AT TIME ZONE 'Europe/Kyiv')::DATE BETWEEN $1 AND $2
            GROUP BY h.id, h.title, h.user_id, u.nickname
            ORDER BY confirmations DESC, h.user_id ASC, h.id ASC
            LIMIT 1
            """, active_start, active_end, season_number,
        )
    return {
        "current_user": dict(current_user) if current_user else None,
        "top3": [dict(row) for row in top3],
        "summary": {
            "participants": int(participants or 0),
            "confirmations": int(confirmations or 0),
            "best_streak": int(best_streak["streak"]) if best_streak else 0,
            "best_streak_user": best_streak["nickname"] if best_streak else None,
            "popular_habit": popular_habit["title"] if popular_habit else None,
            "popular_habit_user": popular_habit["nickname"] if popular_habit else None,
        },
    }


async def get_user_season_results(user_id: int) -> list[asyncpg.Record]:
    async with get_connection() as connection:
        return await connection.fetch(
            """
            SELECT season_number, final_rank, final_xp, season_start_date,
                   season_end_date, finalized_at
            FROM season_results
            WHERE user_id = $1
            ORDER BY season_number DESC
            """, user_id,
        )

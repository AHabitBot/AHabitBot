from collections import defaultdict
from datetime import date

from backend.database.database import get_connection
from backend.services.leaderboard.season_service import (
    SEASON_START_DATE,
    get_season_number,
    get_season_ranking_end_date,
)


async def rebuild_user_season_stats() -> int:
    """Rebuild live season XP from every award source using canonical season rules."""
    async with get_connection() as connection:
        async with connection.transaction():
            award_rows = await connection.fetch(
                """
                SELECT user_id, award_date, xp
                FROM (
                    SELECT
                        h.user_id,
                        hc.confirmation_date AS award_date,
                        hc.xp_amount::INTEGER AS xp
                    FROM habit_confirmations AS hc
                    INNER JOIN habits AS h ON h.id = hc.habit_id
                    WHERE hc.confirmation_date >= $1
                      AND hc.is_confirmed = TRUE
                      AND hc.xp_awarded = TRUE

                    UNION ALL

                    SELECT
                        r.inviter_user_id AS user_id,
                        (r.created_at AT TIME ZONE 'Europe/Kyiv')::DATE AS award_date,
                        r.xp_amount::INTEGER AS xp
                    FROM referrals AS r
                    WHERE r.xp_awarded = TRUE
                      AND (r.created_at AT TIME ZONE 'Europe/Kyiv')::DATE >= $1

                    UNION ALL

                    SELECT
                        ua.user_id,
                        (ua.earned_at AT TIME ZONE 'Europe/Kyiv')::DATE AS award_date,
                        ua.xp_amount::INTEGER AS xp
                    FROM user_achievements AS ua
                    WHERE ua.xp_awarded = TRUE
                      AND (ua.earned_at AT TIME ZONE 'Europe/Kyiv')::DATE >= $1
                ) AS awards
                ORDER BY award_date ASC, user_id ASC
                """,
                SEASON_START_DATE,
            )

            season_totals: dict[tuple[int, int], int] = defaultdict(int)

            for row in award_rows:
                award_date: date = row["award_date"]
                season_number = get_season_number(award_date)

                # Results week never contributes to Season XP.
                if award_date > get_season_ranking_end_date(season_number):
                    continue

                season_totals[(season_number, int(row["user_id"]))] += int(
                    row["xp"] or 0
                )

            await connection.execute("DELETE FROM user_season_stats")

            records = [
                (season_number, user_id, season_xp)
                for (season_number, user_id), season_xp in season_totals.items()
                if season_xp > 0
            ]

            if not records:
                return 0

            await connection.executemany(
                """
                INSERT INTO user_season_stats (
                    season_number,
                    user_id,
                    season_xp
                )
                VALUES ($1, $2, $3)
                """,
                records,
            )

            return len(records)

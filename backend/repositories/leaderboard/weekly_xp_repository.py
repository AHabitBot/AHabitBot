"""Пересчёт недельного XP по событиям начисления, без изменения общего XP."""
from datetime import datetime

from backend.services.leaderboard.week_service import get_competition_bounds


async def refresh_user_weekly_xp(connection, user_id: int, *, at: datetime | None = None) -> int:
    """Пересчитать XP за неделю события `at` (по умолчанию текущую).

    Вызывать внутри существующей транзакции. Недельные начисления принимаются
    только с понедельника 00:01 (включительно) до воскресенья 23:00
    (не включительно), по Europe/Kyiv. Общий XP эта функция не изменяет.

    После фиксации недели итоговую запись больше не меняем.
    """
    start, end = get_competition_bounds(at)
    # Общий замок с закрытием лиги: блокировка должна быть первой в транзакции.
    await connection.execute("SELECT pg_advisory_xact_lock($1)", 8400172301)
    await connection.execute("SELECT pg_advisory_xact_lock($1)", int(user_id))

    # Не перезаписываем результаты недели после её окончательной фиксации.
    # Проверка находится в той же транзакции, что и пересчёт.
    closed = await connection.fetchval(
        "SELECT 1 FROM league_week_closures WHERE week_start = $1",
        start.date(),
    )
    if closed:
        return int(await connection.fetchval(
            "SELECT COALESCE((SELECT weekly_xp FROM user_weekly_xp "
            "WHERE user_id = $1 AND week_start = $2), 0)",
            user_id, start.date(),
        ) or 0)

    launched_at = await connection.fetchval(
        "SELECT launched_at FROM weekly_competition_config WHERE id = 1"
    )
    if launched_at is None:
        raise RuntimeError("Weekly competition not initialized: run updated init_pg_db.py")
    if end <= launched_at:
        return 0

    effective_start = max(start, launched_at)
    score = await connection.fetchval(
        """
        SELECT (
            COALESCE((
                SELECT SUM(hc.xp_amount)
                FROM habit_confirmations hc
                JOIN habits h ON h.id = hc.habit_id
                WHERE h.user_id = $1 AND hc.is_confirmed AND hc.xp_awarded
                  AND hc.xp_awarded_at >= $2 AND hc.xp_awarded_at < $3
            ), 0)
            + COALESCE((
                SELECT SUM(r.xp_amount) FROM referrals r
                WHERE r.inviter_user_id = $1 AND r.xp_awarded
                  AND r.created_at >= $2 AND r.created_at < $3
            ), 0)
            + COALESCE((
                SELECT SUM(ua.xp_amount) FROM user_achievements ua
                WHERE ua.user_id = $1 AND ua.xp_awarded
                  AND ua.earned_at >= $2 AND ua.earned_at < $3
            ), 0)
        )::INTEGER
        """, user_id, effective_start, end,
    )
    score = max(0, int(score or 0))
    await connection.execute(
        """
        INSERT INTO user_weekly_xp (user_id, week_start, weekly_xp)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET weekly_xp = EXCLUDED.weekly_xp, updated_at = NOW()
        """, user_id, start.date(), score,
    )
    return score

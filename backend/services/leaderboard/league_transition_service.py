"""Безопасная фиксация и применение результатов лиг.

ВНИМАНИЕ: этот сервис НЕ запускает фоновые задачи и НЕ активирует лиги.
Вызывать freeze_week и apply_week внутри отдельной транзакции или через
process_due_weeks с connection из asyncpg pool.
"""
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from backend.services.leaderboard.week_service import get_competition_bounds

KYIV = ZoneInfo('Europe/Kyiv')
from backend.services.leaderboard.league_lock import LEAGUE_LOCK


def transition_count(n: int) -> int:
    return (n + 2) // 5 if n >= 9 else 0


def calculate_transitions(rows):
    """rows: (user_id, league_level, weekly_xp); XP > 0."""
    groups = {level: [] for level in range(1, 11)}
    for uid, league, xp in rows:
        if xp > 0:
            groups[int(league)].append((int(uid), int(xp)))
    results = []
    for league, members in groups.items():
        members.sort(key=lambda item: (-item[1], item[0]))
        n = len(members)
        count = transition_count(n)
        for index, (uid, xp) in enumerate(members):
            after = league
            if count and index < count and league < 10:
                after += 1
            elif count and index >= n - count and league > 1:
                after -= 1
            results.append((uid, league, after, index + 1, xp))
    return results


def _bounds(week: date):
    # Explicit date avoids the Monday 00:00–00:01 ambiguity.
    return get_competition_bounds(datetime.combine(week, datetime.min.time(), KYIV) + timedelta(minutes=1))


async def freeze_week(connection, week: date, *, now: datetime | None = None) -> bool:
    """Выполнять в транзакции. Возвращает True только при первой фиксации."""
    now = now or datetime.now(KYIV)
    if now.tzinfo is None:
        raise ValueError('now must have timezone')
    start, end = _bounds(week)
    if now < end:
        return False
    await connection.execute('SELECT pg_advisory_xact_lock($1)', LEAGUE_LOCK)
    activated = await connection.fetchval(
        'SELECT league_activation_week FROM weekly_competition_config WHERE id=1')
    if activated is None or week < activated:
        return False
    if await connection.fetchval('SELECT 1 FROM league_week_closures WHERE week_start=$1', week):
        return False
    # Reconstruct the standings AS OF Sunday 23:00 from immutable award history.
    # A later cancellation cannot rewrite the score of a finished week.
    launched_at = await connection.fetchval(
        'SELECT launched_at FROM weekly_competition_config WHERE id=1')
    effective_start = max(start, launched_at)
    rows = await connection.fetch('''
        WITH xp AS (
            SELECT user_id, SUM(xp_amount)::BIGINT AS points
            FROM league_habit_xp_events
            WHERE awarded_at >= $1 AND awarded_at < $2
              AND (revoked_at IS NULL OR revoked_at >= $2)
            GROUP BY user_id
            UNION ALL
            SELECT inviter_user_id, SUM(xp_amount)::BIGINT
            FROM referrals
            WHERE xp_awarded AND created_at >= $1 AND created_at < $2
            GROUP BY inviter_user_id
            UNION ALL
            SELECT user_id, SUM(xp_amount)::BIGINT
            FROM user_achievements
            WHERE xp_awarded AND earned_at >= $1 AND earned_at < $2
            GROUP BY user_id
        )
        SELECT u.id, u.league_level, SUM(xp.points)::INTEGER AS weekly_xp
        FROM xp JOIN users u ON u.id=xp.user_id
        GROUP BY u.id, u.league_level
        HAVING SUM(xp.points) > 0
    ''', effective_start, end)
    # The final weekly score must match the frozen result as well.
    for r in rows:
        await connection.execute('''
            INSERT INTO user_weekly_xp (user_id, week_start, weekly_xp)
            VALUES ($1,$2,$3)
            ON CONFLICT (user_id, week_start)
            DO UPDATE SET weekly_xp=EXCLUDED.weekly_xp, updated_at=clock_timestamp()
        ''', r['id'], week, r['weekly_xp'])
    # Remove stale live scores from users with no points at the cutoff.
    await connection.execute('''
        UPDATE user_weekly_xp SET weekly_xp=0, updated_at=clock_timestamp()
        WHERE week_start=$1 AND NOT (user_id=ANY($2::BIGINT[]))
    ''', week, [r['id'] for r in rows])
    result = calculate_transitions([(r['id'], r['league_level'], r['weekly_xp']) for r in rows])
    await connection.execute('INSERT INTO league_week_closures(week_start, frozen_at) VALUES($1, clock_timestamp())', week)
    if result:
        await connection.executemany('''
            INSERT INTO league_week_results
                (week_start,user_id,league_before,league_after,place,weekly_xp)
            VALUES ($1,$2,$3,$4,$5,$6)
        ''', [(week, *r) for r in result])
    return True


async def apply_week(connection, week: date, *, now: datetime | None = None) -> bool:
    """Применяет один раз после понедельника 00:01, в той же транзакции."""
    now = now or datetime.now(KYIV)
    if now.tzinfo is None:
        raise ValueError('now must have timezone')
    start, _ = _bounds(week)
    if now < start + timedelta(days=7):
        return False
    await connection.execute('SELECT pg_advisory_xact_lock($1)', LEAGUE_LOCK)
    applied = await connection.fetchval(
        'SELECT applied_at FROM league_week_closures WHERE week_start=$1 FOR UPDATE', week)
    exists = await connection.fetchval('SELECT 1 FROM league_week_closures WHERE week_start=$1', week)
    if not exists or applied is not None:
        return False
    await connection.execute('''
        UPDATE users u SET league_level=r.league_after, updated_at=NOW()
        FROM league_week_results r
        WHERE r.week_start=$1 AND r.user_id=u.id
    ''', week)
    await connection.execute('UPDATE league_week_closures SET applied_at=NOW() WHERE week_start=$1', week)
    return True


async def process_due_weeks(pool, *, now: datetime | None = None):
    """Вызов из будущего планировщика; пока НЕ подключён к startup."""
    now = now or datetime.now(KYIV)
    async with pool.acquire() as conn:
        activated = await conn.fetchval(
            'SELECT league_activation_week FROM weekly_competition_config WHERE id=1')
        if activated is None:
            return
        # Each week committed separately, preserving order after outages.
        week = activated
        while week <= now.astimezone(KYIV).date():
            async with conn.transaction():
                await freeze_week(conn, week, now=now)
                await apply_week(conn, week, now=now)
            week += timedelta(days=7)

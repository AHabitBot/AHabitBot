# Development research: one state table, existing XP pipeline.
import json
import secrets
from datetime import timedelta
from pathlib import Path
from fastapi import HTTPException
from backend.database.database import get_connection
from backend.repositories.habits.habits_repository import get_user_local_date
from backend.repositories.habits import set_habit_confirmation
from backend.services.habits.confirmation_effects import finalize_confirmation

CATALOG = json.loads(Path(__file__).with_name('development_catalog.json').read_text(encoding='utf-8'))
DAYS = (7, 10, 13)


def definition(direction, key, cycle):
    group = CATALOG.get(direction)
    item = next((x for x in group['items'] if x['key'] == key), None) if group else None
    if item is None or cycle not in (1, 2, 3):
        raise HTTPException(404, 'Исследование не найдено')
    return group, item


async def today_for(conn, user_id):
    timezone = await conn.fetchval('SELECT timezone FROM user_settings WHERE user_id=$1', user_id)
    return get_user_local_date(timezone)


def unlocked(item, cycle, done):
    if cycle > 1 and (item['key'], cycle-1) not in done:
        return False
    # Same-cycle parent nodes; cross-cycle prerequisites from the old mock catalog are removed.
    return all((req['key'], cycle) in done for req in item['requires'])


async def sync_row(conn, row, today):
    target = DAYS[row['cycle'] - 1]
    if row['completed_at'] is not None or row['reached_at'] is not None or row['progress'] >= target:
        return max(int(row['progress']), target) if row['reached_at'] is not None else int(row['progress'])
    # Rebuild from the original start date. No cron, no duplicated XP ledger.
    first = row['started_on']
    confirmed = await conn.fetch('''SELECT confirmation_date FROM habit_confirmations
        WHERE habit_id=$1 AND is_confirmed=TRUE AND confirmation_date >= $2 AND confirmation_date <= $3''',
        row['habit_id'], first, today)
    days = {r['confirmation_date'] for r in confirmed}
    progress = 0
    day = first
    while day <= today:
        if day in days:
            progress = min(target, progress + 1)
        elif day < today:
            progress = max(0, progress - 1)
        if progress == target:
            break
        day += timedelta(days=1)
    await conn.execute('''UPDATE development_progress
        SET progress=$3::smallint, last_processed_date=$4,
            reached_at=CASE WHEN $3::smallint >= $5::smallint THEN COALESCE(reached_at, NOW()) ELSE reached_at END
        WHERE user_id=$1 AND habit_id=$2 AND reached_at IS NULL''',
        row['user_id'], row['habit_id'], progress, today, target)
    return progress


async def state(user_id):
    async with get_connection() as conn:
        today = await today_for(conn,user_id)
        rows = await conn.fetch('SELECT * FROM development_progress WHERE user_id=$1 ORDER BY cycle,research_key',user_id)
        results = []
        for row in rows:
            progress = await sync_row(conn,row,today)
            results.append({'direction':row['direction'],'key':row['research_key'],
                'cycle':row['cycle'],'habit_id':row['habit_id'],'progress':progress,
                'target':DAYS[row['cycle']-1],'completed':row['completed_at'] is not None,
                'ready':progress>=DAYS[row['cycle']-1] and row['completed_at'] is None})
        return {'research':results}


async def start(user_id,direction,key,cycle):
    group,item=definition(direction,key,cycle)
    async with get_connection() as conn:
        async with conn.transaction():
            await conn.fetchrow('SELECT id FROM users WHERE id=$1 FOR UPDATE',user_id)
            rows=await conn.fetch('SELECT research_key,cycle FROM development_progress WHERE user_id=$1 AND completed_at IS NOT NULL',user_id)
            done={(r['research_key'],r['cycle']) for r in rows if any(r['research_key']==i['key'] for i in group['items'])}
            if not unlocked(item,cycle,done):
                raise HTTPException(409,'Сначала завершите предыдущие исследования')
            exists=await conn.fetchval('''SELECT 1 FROM development_progress
                WHERE user_id=$1 AND direction=$2 AND research_key=$3 AND cycle=$4''',user_id,direction,key,cycle)
            if exists:
                raise HTTPException(409,'Исследование уже начато')
            today=await today_for(conn,user_id)
            habit_id=await conn.fetchval('''INSERT INTO habits
                (user_id,title,description,emoji,color,size,repeat_type,repeat_days,repeat_started_on,invite_token,habit_type)
                VALUES ($1,$2,$3,$4,$5,'large','days',ARRAY[1,2,3,4,5,6,7]::SMALLINT[],$6,$7,'development')
                RETURNING id''',user_id,item['name'],item['tasks'][cycle-1], '✱','#4D9568',today,secrets.token_urlsafe(24))
            await conn.execute('''INSERT INTO development_progress
                (user_id,direction,research_key,cycle,habit_id,progress,last_processed_date,started_on)
                VALUES ($1,$2,$3,$4,$5,0,$6,$6)''',user_id,direction,key,cycle,habit_id,today)
            return {'habit_id':habit_id,'progress':0,'target':DAYS[cycle-1]}


async def confirm(user_id, habit_id, is_confirmed):
    # The repository holds both the habit and research locks and performs
    # the confirmation, XP update and research sync in one DB transaction.
    result = await set_habit_confirmation(
        user_id, habit_id, is_confirmed, development_mode=True,
    )
    if result is None:
        raise HTTPException(404, 'Активное исследование не найдено')
    result = await finalize_confirmation(
        user_id, habit_id, is_confirmed, result, notify_shared=False,
    )
    async with get_connection() as conn:
        row = await conn.fetchrow(
            'SELECT * FROM development_progress WHERE user_id=$1 AND habit_id=$2',
            user_id, habit_id,
        )
    return {
        'confirmation': result,
        'progress': row['progress'],
        'target': DAYS[row['cycle'] - 1],
    }


async def finish(user_id, habit_id):
    """Claim a completed research exactly once; archive in the same transaction.

    The habit row is locked before the research row, matching confirmation locks.
    XP is earned on daily confirmations, not a second time on improvement.
    """
    async with get_connection() as conn:
        async with conn.transaction():
            habit = await conn.fetchrow(
                """SELECT id, is_archived, habit_type FROM habits
                   WHERE id=$1 AND user_id=$2 FOR UPDATE""",
                habit_id, user_id,
            )
            if habit is None or habit['habit_type'] != 'development':
                raise HTTPException(404, 'Исследование не найдено')
            row = await conn.fetchrow(
                """SELECT * FROM development_progress
                   WHERE user_id=$1 AND habit_id=$2 FOR UPDATE""",
                user_id, habit_id,
            )
            if row is None:
                raise HTTPException(404, 'Исследование не найдено')
            if row['completed_at'] is not None:
                raise HTTPException(409, 'Исследование уже улучшено')
            if habit['is_archived']:
                raise HTTPException(409, 'Исследование уже архивировано')

            today = await today_for(conn, user_id)
            progress = await sync_row(conn, row, today)
            target = DAYS[row['cycle'] - 1]
            # sync_row sets reached_at when the threshold is first achieved.
            # Do not allow a claim on a partially completed research.
            if progress < target:
                raise HTTPException(409, 'Исследование ещё не завершено')
            updated = await conn.fetchrow(
                """UPDATE development_progress
                   SET completed_at=NOW(), reached_at=COALESCE(reached_at, NOW()),
                       progress=$3
                   WHERE user_id=$1 AND habit_id=$2 AND completed_at IS NULL
                   RETURNING direction, research_key, cycle, completed_at""",
                user_id, habit_id, target,
            )
            if updated is None:
                raise HTTPException(409, 'Исследование уже улучшено')
            await conn.execute(
                """UPDATE habits SET is_archived=TRUE, archived_at=NOW(), updated_at=NOW()
                   WHERE id=$1 AND user_id=$2 AND habit_type='development'""",
                habit_id, user_id,
            )
            return {
                'completed': True, 'direction': updated['direction'],
                'key': updated['research_key'], 'cycle': updated['cycle'],
                'habit_id': habit_id,
            }

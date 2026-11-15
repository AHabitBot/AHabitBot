# Development research: one state table, existing XP pipeline.
import json
import secrets
from datetime import timedelta
from pathlib import Path
from fastapi import HTTPException
from backend.database.database import get_connection
from backend.repositories.habits.habits_repository import get_user_local_date
from backend.services.habits.habit_service import update_habit_confirmation

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
    if row['completed_at'] is not None or row['progress'] >= target:
        return int(row['progress'])
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
    await conn.execute('''UPDATE development_progress SET progress=$3,last_processed_date=$4
        WHERE user_id=$1 AND habit_id=$2''', row['user_id'], row['habit_id'], progress, today)
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
                (user_id,title,description,emoji,color,size,repeat_type,repeat_days,repeat_started_on,invite_token)
                VALUES ($1,$2,$3,$4,$5,'large','days',ARRAY[1,2,3,4,5,6,7]::SMALLINT[],$6,$7)
                RETURNING id''',user_id,item['name'],item['tasks'][cycle-1], '✱','#4D9568',today,secrets.token_urlsafe(24))
            await conn.execute('''INSERT INTO development_progress
                (user_id,direction,research_key,cycle,habit_id,progress,last_processed_date,started_on)
                VALUES ($1,$2,$3,$4,$5,0,$6,$6)''',user_id,direction,key,cycle,habit_id,today)
            return {'habit_id':habit_id,'progress':0,'target':DAYS[cycle-1]}


async def confirm(user_id, habit_id, is_confirmed):
    async with get_connection() as conn:
        row = await conn.fetchrow('SELECT * FROM development_progress WHERE user_id=$1 AND habit_id=$2', user_id, habit_id)
        if not row or row['completed_at'] is not None:
            raise HTTPException(404, 'Активное исследование не найдено')
        today = await today_for(conn, user_id)
        progress = await sync_row(conn, row, today)
        if progress >= DAYS[row['cycle']-1]:
            raise HTTPException(409, 'Исследование готово к улучшению')
    # Existing service remains the sole owner of XP, streaks, and league accounting.
    result = await update_habit_confirmation(user_id, habit_id, is_confirmed)
    if result is None:
        raise HTTPException(404, 'Привычка не найдена')
    async with get_connection() as conn:
        row = await conn.fetchrow('SELECT * FROM development_progress WHERE user_id=$1 AND habit_id=$2', user_id, habit_id)
        progress = await sync_row(conn, row, await today_for(conn, user_id))
    return {'confirmation': result, 'progress': progress, 'target': DAYS[row['cycle']-1]}


async def finish(user_id,habit_id):
    async with get_connection() as conn:
        async with conn.transaction():
            row=await conn.fetchrow('SELECT * FROM development_progress WHERE user_id=$1 AND habit_id=$2 FOR UPDATE',user_id,habit_id)
            if row is None: raise HTTPException(404,'Исследование не найдено')
            if row['completed_at'] is not None: raise HTTPException(409,'Награда уже получена')
            today=await today_for(conn,user_id)
            progress=await sync_row(conn,row,today)
            if progress<DAYS[row['cycle']-1]: raise HTTPException(409,'Исследование ещё не завершено')
            await conn.execute('UPDATE development_progress SET completed_at=NOW() WHERE user_id=$1 AND habit_id=$2',user_id,habit_id)
            await conn.execute('UPDATE habits SET is_archived=TRUE,archived_at=NOW() WHERE id=$1 AND user_id=$2',habit_id,user_id)
            return {'completed':True,'direction':row['direction'],'key':row['research_key'],'cycle':row['cycle']}

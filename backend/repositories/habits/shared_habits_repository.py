from typing import Any
import secrets

from backend.database.database import get_connection

MAX_SHARED_HABIT_MEMBERS = 5


async def get_shared_invite_preview(invite_token: str, user_id: int) -> dict[str, Any] | None:
    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            SELECT
                h.id AS source_habit_id,
                h.user_id AS source_user_id,
                h.title,
                h.emoji,
                h.color,
                h.repeat_type,
                h.repeat_days,
                h.weekly_target,
                h.challenge_target,
                COALESCE(u.nickname, u.first_name, 'Player') AS owner_name,
                u.avatar_key,
                shm.shared_habit_id,
                COALESCE(member_count.count, 1) AS members_count
            FROM habits h
            JOIN users u ON u.id = h.user_id
            LEFT JOIN shared_habit_members shm ON shm.habit_id = h.id
            LEFT JOIN LATERAL (
                SELECT COUNT(*)::INTEGER AS count
                FROM shared_habit_members x
                WHERE x.shared_habit_id = shm.shared_habit_id
            ) member_count ON TRUE
            WHERE h.invite_token = $1
              AND h.is_archived = FALSE
            LIMIT 1
            """,
            invite_token,
        )
        if row is None:
            return None

        data = dict(row)
        data["is_own"] = int(data["source_user_id"]) == int(user_id)
        data["already_joined"] = False

        if data["shared_habit_id"] is not None:
            data["already_joined"] = bool(await connection.fetchval(
                """
                SELECT EXISTS(
                    SELECT 1 FROM shared_habit_members
                    WHERE shared_habit_id = $1 AND user_id = $2
                )
                """,
                data["shared_habit_id"],
                user_id,
            ))

        data["is_full"] = int(data["members_count"] or 1) >= MAX_SHARED_HABIT_MEMBERS
        return data


async def join_shared_habit(invite_token: str, user_id: int) -> dict[str, Any] | None:
    async with get_connection() as connection:
        async with connection.transaction():
            source = await connection.fetchrow(
                """
                SELECT * FROM habits
                WHERE invite_token = $1
                  AND is_archived = FALSE
                FOR UPDATE
                """,
                invite_token,
            )
            if source is None:
                return None
            if int(source["user_id"]) == int(user_id):
                return {"status": "own_habit", "habit_id": int(source["id"])}

            membership = await connection.fetchrow(
                """
                SELECT shared_habit_id
                FROM shared_habit_members
                WHERE habit_id = $1
                """,
                source["id"],
            )

            if membership is None:
                shared_habit_id = await connection.fetchval(
                    """
                    INSERT INTO shared_habits (owner_user_id)
                    VALUES ($1)
                    RETURNING id
                    """,
                    source["user_id"],
                )
                await connection.execute(
                    """
                    INSERT INTO shared_habit_members (shared_habit_id, user_id, habit_id)
                    VALUES ($1, $2, $3)
                    """,
                    shared_habit_id,
                    source["user_id"],
                    source["id"],
                )
            else:
                shared_habit_id = int(membership["shared_habit_id"])

            existing_habit_id = await connection.fetchval(
                """
                SELECT habit_id
                FROM shared_habit_members
                WHERE shared_habit_id = $1 AND user_id = $2
                """,
                shared_habit_id,
                user_id,
            )
            if existing_habit_id is not None:
                return {"status": "already_joined", "habit_id": int(existing_habit_id)}

            member_count = int(await connection.fetchval(
                "SELECT COUNT(*) FROM shared_habit_members WHERE shared_habit_id = $1",
                shared_habit_id,
            ))
            if member_count >= MAX_SHARED_HABIT_MEMBERS:
                return {"status": "full"}

            new_token = secrets.token_urlsafe(24)
            new_habit_id = await connection.fetchval(
                """
                INSERT INTO habits (
                    user_id, title, emoji, color, size, xp_reward,
                    repeat_type, repeat_days, weekly_target, challenge_target,
                    repeat_started_on, habit_reminder, invite_token
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10,
                    CURRENT_DATE, NULL, $11
                )
                RETURNING id
                """,
                user_id,
                source["title"], source["emoji"], source["color"], source["size"], source["xp_reward"],
                source["repeat_type"], source["repeat_days"], source["weekly_target"], source["challenge_target"],
                new_token,
            )

            await connection.execute(
                """
                INSERT INTO shared_habit_members (shared_habit_id, user_id, habit_id)
                VALUES ($1, $2, $3)
                """,
                shared_habit_id,
                user_id,
                new_habit_id,
            )

            return {"status": "joined", "habit_id": int(new_habit_id), "shared_habit_id": int(shared_habit_id)}


async def get_shared_contexts_for_habits(habit_ids: list[int], today) -> dict[int, dict[str, Any]]:
    if not habit_ids:
        return {}
    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                me.habit_id AS requested_habit_id,
                sh.id AS shared_habit_id,
                sh.owner_user_id,
                member.user_id,
                member.habit_id,
                COALESCE(u.nickname, u.first_name, 'Player') AS nickname,
                u.avatar_key,
                COALESCE(hc.is_confirmed, FALSE) AS confirmed_today
            FROM shared_habit_members me
            JOIN shared_habits sh ON sh.id = me.shared_habit_id
            JOIN shared_habit_members member ON member.shared_habit_id = sh.id AND member.left_at IS NULL
            JOIN users u ON u.id = member.user_id
            LEFT JOIN habit_confirmations hc
              ON hc.habit_id = member.habit_id
             AND hc.confirmation_date = $2
            WHERE me.habit_id = ANY($1::BIGINT[])
              AND me.left_at IS NULL
            ORDER BY me.habit_id, member.joined_at, member.user_id
            """,
            habit_ids,
            today,
        )

    result: dict[int, dict[str, Any]] = {}
    for row in rows:
        habit_id = int(row["requested_habit_id"])
        context = result.setdefault(habit_id, {
            "shared_habit_id": int(row["shared_habit_id"]),
            "owner_user_id": int(row["owner_user_id"]),
            "members": [],
        })
        context["members"].append({
            "user_id": int(row["user_id"]),
            "habit_id": int(row["habit_id"]),
            "nickname": row["nickname"],
            "avatar_key": row["avatar_key"],
            "confirmed_today": bool(row["confirmed_today"]),
        })
    return result

async def get_shared_streak_states_for_habits(habit_ids: list[int], today, connection=None) -> dict[int, dict[str, Any]]:
    """Рассчитать личное состояние shared-streak для каждой копии привычки.

    Результат дня общий для активных участников (SUCCESS только если выполнили все),
    но отсчёт streak каждой копии начинается не раньше вступления её владельца в группу.
    Поэтому новый участник не наследует уже накопленный streak остальных.
    """
    if not habit_ids:
        return {}

    from datetime import timedelta
    from backend.services.habits.repeat_rules import calculate_streak_state, ALL_WEEKDAYS

    async def _fetch_rows(conn):
        return await conn.fetch(
            """
            SELECT
                me.habit_id AS requested_habit_id,
                me.shared_habit_id,
                me.joined_at AS requested_joined_at,
                requested.repeat_type,
                requested.repeat_days,
                requested.repeat_started_on,
                member.user_id,
                member.habit_id AS member_habit_id,
                member.joined_at,
                member.left_at,
                hc.confirmation_date
            FROM shared_habit_members me
            JOIN habits requested ON requested.id = me.habit_id
            JOIN shared_habit_members member
              ON member.shared_habit_id = me.shared_habit_id
            LEFT JOIN habit_confirmations hc
              ON hc.habit_id = member.habit_id
             AND hc.is_confirmed = TRUE
            WHERE me.habit_id = ANY($1::BIGINT[])
              AND me.left_at IS NULL
            ORDER BY me.habit_id, member.user_id, hc.confirmation_date
            """,
            habit_ids,
        )

    if connection is None:
        async with get_connection() as conn:
            rows = await _fetch_rows(conn)
    else:
        rows = await _fetch_rows(connection)

    groups: dict[int, dict[str, Any]] = {}
    for row in rows:
        requested_id = int(row["requested_habit_id"])
        group = groups.setdefault(requested_id, {
            "repeat_type": row["repeat_type"],
            "repeat_days": list(row["repeat_days"] or []),
            "repeat_started_on": row["repeat_started_on"],
            "requested_joined_on": row["requested_joined_at"].date(),
            "members": {},
        })
        member_id = int(row["user_id"])
        member = group["members"].setdefault(member_id, {
            "joined_on": row["joined_at"].date(),
            "left_on": row["left_at"].date() if row["left_at"] else None,
            "completed": set(),
        })
        if row["confirmation_date"] is not None:
            member["completed"].add(row["confirmation_date"])

    result: dict[int, dict[str, Any]] = {}
    for requested_id, group in groups.items():
        members = list(group["members"].values())
        if not members:
            continue
        # У каждого участника свой отсчёт shared-streak. Старую командную
        # историю, накопленную до его вступления, он не наследует.
        group_started_on = max(
            group["repeat_started_on"],
            group["requested_joined_on"],
        )
        scheduled = set(ALL_WEEKDAYS if group["repeat_type"] == "challenge" else group["repeat_days"])
        day_results: list[bool] = []
        cursor = group_started_on
        while cursor <= today:
            if cursor.isoweekday() in scheduled:
                required = [m for m in members if m["joined_on"] <= cursor and (m["left_on"] is None or cursor < m["left_on"])]
                if required:
                    success = all(cursor in m["completed"] for m in required)
                    if cursor == today and not success:
                        break
                    day_results.append(success)
            cursor += timedelta(days=1)
        streak, frozen = calculate_streak_state(day_results)
        result[requested_id] = {"streak": streak, "frozen": frozen}

    return result

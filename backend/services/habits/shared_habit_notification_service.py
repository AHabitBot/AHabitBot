import asyncio
import logging
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from aiogram import Bot

from config import BOT_TOKEN
from backend.database.database import get_connection
from backend.i18n.notifications import (
    normalize_language,
    shared_completed_text,
    shared_confirmation_text,
    shared_frozen_text,
)
from backend.repositories.habits.shared_habits_repository import (
    get_shared_streak_states_for_habits,
)

logger = logging.getLogger("uvicorn.error")
DEFAULT_TIMEZONE = "Europe/Kyiv"
FREEZE_CHECK_INTERVAL_SECONDS = 60


def _safe_timezone(name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(name or DEFAULT_TIMEZONE)
    except ZoneInfoNotFoundError:
        return ZoneInfo(DEFAULT_TIMEZONE)


async def _reserve_event(connection, shared_habit_id: int, recipient_user_id: int,
                         event_date: date, event_type: str, actor_user_id: int = 0) -> bool:
    row = await connection.fetchrow(
        """
        INSERT INTO shared_habit_notification_events (
            shared_habit_id, recipient_user_id, event_date, event_type, actor_user_id
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
        RETURNING shared_habit_id
        """,
        shared_habit_id, recipient_user_id, event_date, event_type, actor_user_id,
    )
    return row is not None


async def send_shared_habit_confirmation_notifications(
    user_id: int, habit_id: int, confirmation_date: date | None = None
) -> None:
    event_date = confirmation_date or date.today()

    async with get_connection() as connection:
        context = await connection.fetchrow(
            """
            SELECT sh.id AS shared_habit_id, h.title, h.repeat_type, h.repeat_days,
                   COALESCE(u.nickname, u.first_name, 'Player') AS player_name
            FROM shared_habit_members me
            JOIN shared_habits sh ON sh.id = me.shared_habit_id
            JOIN habits h ON h.id = me.habit_id
            JOIN users u ON u.id = me.user_id
            WHERE me.habit_id = $1 AND me.user_id = $2 AND me.left_at IS NULL
            """,
            habit_id, user_id,
        )
        if context is None:
            return

        shared_habit_id = int(context["shared_habit_id"])
        members = await connection.fetch(
            """
            SELECT member.user_id, member.habit_id, u.telegram_id,
                   COALESCE(us.language, 'en') AS language,
                   COALESCE(hc.is_confirmed, FALSE) AS confirmed
            FROM shared_habit_members member
            JOIN users u ON u.id = member.user_id
            LEFT JOIN user_settings us ON us.user_id = member.user_id
            LEFT JOIN habit_confirmations hc
              ON hc.habit_id = member.habit_id
             AND hc.confirmation_date = $2 AND hc.is_confirmed = TRUE
            WHERE member.shared_habit_id = $1
              AND member.joined_at::date <= $2
              AND (member.left_at IS NULL OR member.left_at::date > $2)
            ORDER BY member.joined_at, member.user_id
            """,
            shared_habit_id, event_date,
        )
        if len(members) < 2:
            return

        all_confirmed = all(bool(row["confirmed"]) for row in members)
        unconfirmed = {int(row["user_id"]) for row in members if not bool(row["confirmed"])}

        restored = False
        if all_confirmed:
            current_states = await get_shared_streak_states_for_habits(
                [int(row["habit_id"]) for row in members],
                event_date, connection=connection,
            )

            previous_required = event_date - timedelta(days=1)
            if str(context["repeat_type"] or "days") != "challenge":
                scheduled_days = set(context["repeat_days"] or [])
                for _ in range(7):
                    if previous_required.isoweekday() in scheduled_days:
                        break
                    previous_required -= timedelta(days=1)

            previous_member_count = await connection.fetchval(
                """
                SELECT COUNT(*) FROM shared_habit_members
                WHERE shared_habit_id = $1
                  AND joined_at::date <= $2
                  AND (left_at IS NULL OR left_at::date > $2)
                """,
                shared_habit_id, previous_required,
            )
            previous_confirmed_count = await connection.fetchval(
                """
                SELECT COUNT(*)
                FROM shared_habit_members member
                JOIN habit_confirmations hc
                  ON hc.habit_id = member.habit_id
                 AND hc.confirmation_date = $2 AND hc.is_confirmed = TRUE
                WHERE member.shared_habit_id = $1
                  AND member.joined_at::date <= $2
                  AND (member.left_at IS NULL OR member.left_at::date > $2)
                """,
                shared_habit_id, previous_required,
            )
            previous_failed = (
                int(previous_member_count or 0) >= 2
                and int(previous_confirmed_count or 0) < int(previous_member_count or 0)
            )
            restored = previous_failed and any(
                int(state.get("streak") or 0) > 1 for state in current_states.values()
            )

        deliveries = []
        for row in members:
            recipient_user_id = int(row["user_id"])
            if recipient_user_id == user_id or row["telegram_id"] is None:
                continue

            language = normalize_language(row["language"])
            if all_confirmed:
                event_type = "restored" if restored else "completed"
                text = shared_completed_text(
                    str(context["title"] or ""), restored, language
                )
                actor_key = 0
            else:
                event_type = "confirmation"
                text = shared_confirmation_text(
                    str(context["player_name"] or "Player"),
                    str(context["title"] or ""),
                    len(unconfirmed) == 1 and recipient_user_id in unconfirmed,
                    language,
                )
                actor_key = user_id

            if await _reserve_event(
                connection, shared_habit_id, recipient_user_id,
                event_date, event_type, actor_key
            ):
                deliveries.append((recipient_user_id, int(row["telegram_id"]), text))

    if not deliveries:
        return

    bot = Bot(token=BOT_TOKEN)
    try:
        for recipient_user_id, telegram_id, text in deliveries:
            try:
                await bot.send_message(chat_id=telegram_id, text=text)
            except Exception:
                logger.exception("Shared habit notification failed: user_id=%s", recipient_user_id)
    finally:
        await bot.session.close()


async def check_shared_habit_freezes() -> None:
    async with get_connection() as connection:
        groups = await connection.fetch(
            """
            SELECT sh.id AS shared_habit_id, owner_member.habit_id,
                   h.title, h.repeat_type, h.repeat_days,
                   COALESCE(us.timezone, $1) AS timezone
            FROM shared_habits sh
            JOIN shared_habit_members owner_member
              ON owner_member.shared_habit_id = sh.id
             AND owner_member.user_id = sh.owner_user_id
            JOIN habits h ON h.id = owner_member.habit_id
            LEFT JOIN user_settings us ON us.user_id = sh.owner_user_id
            WHERE owner_member.left_at IS NULL
            """,
            DEFAULT_TIMEZONE,
        )

        pending_deliveries = []

        for group in groups:
            local_today = datetime.now(_safe_timezone(group["timezone"])).date()
            missed_date = local_today - timedelta(days=1)

            scheduled = (
                str(group["repeat_type"] or "days") == "challenge"
                or missed_date.isoweekday() in set(group["repeat_days"] or [])
            )
            if not scheduled:
                continue

            members = await connection.fetch(
                """
                SELECT member.user_id, member.habit_id, u.telegram_id,
                       COALESCE(us.language, 'en') AS language
                FROM shared_habit_members member
                JOIN users u ON u.id = member.user_id
                LEFT JOIN user_settings us ON us.user_id = member.user_id
                WHERE member.shared_habit_id = $1
                  AND member.joined_at::date <= $2
                  AND (member.left_at IS NULL OR member.left_at::date > $2)
                ORDER BY member.joined_at, member.user_id
                """,
                int(group["shared_habit_id"]), missed_date,
            )
            if len(members) < 2:
                continue

            states = await get_shared_streak_states_for_habits(
                [int(row["habit_id"]) for row in members],
                missed_date, connection=connection, finalize_today=True,
            )
            frozen = any(
                bool(state.get("frozen")) and int(state.get("streak") or 0) > 0
                for state in states.values()
            )
            if not frozen:
                continue

            for row in members:
                if row["telegram_id"] is None:
                    continue
                recipient_user_id = int(row["user_id"])
                if await _reserve_event(
                    connection, int(group["shared_habit_id"]), recipient_user_id,
                    missed_date, "frozen", 0
                ):
                    pending_deliveries.append((
                        recipient_user_id,
                        int(row["telegram_id"]),
                        shared_frozen_text(
                            str(group["title"] or ""),
                            normalize_language(row["language"]),
                        ),
                    ))

    if not pending_deliveries:
        return

    bot = Bot(token=BOT_TOKEN)
    try:
        for recipient_user_id, telegram_id, text in pending_deliveries:
            try:
                await bot.send_message(chat_id=telegram_id, text=text)
            except Exception:
                logger.exception("Shared freeze notification failed: user_id=%s", recipient_user_id)
    finally:
        await bot.session.close()


async def run_shared_habit_freeze_loop() -> None:
    logger.info("Shared Habit Freeze Service запущен")
    while True:
        try:
            await check_shared_habit_freezes()
        except asyncio.CancelledError:
            logger.info("Shared Habit Freeze Service остановлен")
            raise
        except Exception:
            logger.exception("Shared Habit Freeze Service: ошибка проверки")
        await asyncio.sleep(FREEZE_CHECK_INTERVAL_SECONDS)

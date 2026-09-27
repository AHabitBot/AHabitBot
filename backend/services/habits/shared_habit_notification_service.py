from aiogram import Bot

from config import BOT_TOKEN
from backend.database.database import get_connection


async def send_shared_habit_confirmation_notifications(
    user_id: int,
    habit_id: int,
) -> None:
    """Notify the other members after a real shared-habit confirmation.

    Telegram errors are intentionally isolated from the confirmation itself.
    """
    async with get_connection() as connection:
        context = await connection.fetchrow(
            """
            SELECT
                sh.id AS shared_habit_id,
                h.title,
                COALESCE(u.nickname, u.first_name, 'Player') AS player_name
            FROM shared_habit_members me
            JOIN shared_habits sh
              ON sh.id = me.shared_habit_id
            JOIN habits h
              ON h.id = me.habit_id
            JOIN users u
              ON u.id = me.user_id
            WHERE me.habit_id = $1
              AND me.user_id = $2
            """,
            habit_id,
            user_id,
        )

        if context is None:
            return

        recipients = await connection.fetch(
            """
            SELECT u.telegram_id
            FROM shared_habit_members member
            JOIN users u
              ON u.id = member.user_id
            WHERE member.shared_habit_id = $1
              AND member.user_id <> $2
              AND u.telegram_id IS NOT NULL
            ORDER BY member.joined_at, member.user_id
            """,
            context["shared_habit_id"],
            user_id,
        )

    if not recipients:
        return

    player_name = str(context["player_name"] or "Player")
    habit_title = str(context["title"] or "")
    text = f'{player_name} подтвердил привычку «{habit_title}»!'

    bot = Bot(token=BOT_TOKEN)

    try:
        for recipient in recipients:
            try:
                await bot.send_message(
                    chat_id=int(recipient["telegram_id"]),
                    text=text,
                )
            except Exception as error:
                print(
                    "⚠️ Не удалось отправить уведомление "
                    "совместной привычки | "
                    f"Telegram ID: {recipient['telegram_id']} | "
                    f"Ошибка: {error}"
                )
    finally:
        await bot.session.close()

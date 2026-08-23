from aiogram import Router
from aiogram.filters import (
    CommandStart,
    CommandObject,
)
from aiogram.types import Message

from backend.services.users import register_user
from backend.database.database import get_connection
from backend.i18n.notifications import referral_text
from backend.services.profile.level_progression_service import (
    sync_user_level_progression,
)


async def _get_user_language_by_telegram_id(telegram_id: int) -> str:
    async with get_connection() as connection:
        value = await connection.fetchval(
            """
            SELECT COALESCE(us.language, 'ru')
            FROM users AS u
            LEFT JOIN user_settings AS us ON us.user_id = u.id
            WHERE u.telegram_id = $1
            LIMIT 1
            """,
            telegram_id,
        )
    return str(value or "ru")


router = Router()


# ============================================================================
# /start
# ============================================================================

@router.message(CommandStart())
async def start_handler(
    message: Message,
    command: CommandObject,
):
    inviter_telegram_id = None

    # ------------------------------------------------------------------------
    # Реферальная ссылка:
    #
    # https://t.me/AHabitBot?start=900410719
    #
    # command.args == "900410719"
    # ------------------------------------------------------------------------

    if command.args:
        try:
            inviter_telegram_id = int(
                command.args.strip()
            )
        except (TypeError, ValueError):
            inviter_telegram_id = None

    # ------------------------------------------------------------------------
    # Регистрируем / обновляем пользователя.
    # ------------------------------------------------------------------------

    result = await register_user(
        user=message.from_user,
        inviter_telegram_id=inviter_telegram_id,
    )

    referral = result.get("referral")

    # ------------------------------------------------------------------------
    # Уведомляем пригласившего.
    #
    # referral будет не None только если:
    # - пользователь новый;
    # - пришёл по реферальной ссылке;
    # - пригласивший существует;
    # - это не самоприглашение;
    # - referral действительно создан;
    # - +5 XP действительно начислены.
    # ------------------------------------------------------------------------

    if (
        referral is not None
        and inviter_telegram_id is not None
    ):
        try:
            first_name = (
                message.from_user.first_name
                or "Пользователь"
            )

            xp_amount = int(
                referral["xp_amount"]
            )

            inviter_language = await _get_user_language_by_telegram_id(
                inviter_telegram_id
            )

            await message.bot.send_message(
                chat_id=inviter_telegram_id,
                text=referral_text(
                    first_name=first_name,
                    xp=xp_amount,
                    language=inviter_language,
                ),
                parse_mode="HTML",
            )

        except Exception as error:
            # ---------------------------------------------------------------
            # Если пригласивший заблокировал бота
            # или Telegram не смог доставить сообщение,
            # регистрация приглашённого всё равно должна завершиться.
            # ---------------------------------------------------------------

            print(
                "⚠️ Не удалось отправить "
                "реферальное уведомление | "
                f"Telegram ID: {inviter_telegram_id} | "
                f"Ошибка: {error}"
            )

        # После фактического начисления +5 XP проверяем,
        # не был ли достигнут новый максимальный уровень.
        # Ошибка Telegram внутри progression не ломает /start.
        try:
            await sync_user_level_progression(
                user_id=int(
                    referral["inviter_user_id"]
                ),
            )
        except Exception as error:
            # Ошибка дополнительного уведомления об уровне
            # не должна ломать регистрацию по реферальной ссылке.
            print(
                "⚠️ Ошибка синхронизации уровня после реферала | "
                f"Inviter user ID: {referral['inviter_user_id']} | "
                f"Ошибка: {error}"
            )

    # ------------------------------------------------------------------------
    # Стандартный ответ пользователю.
    # ------------------------------------------------------------------------

    await message.answer(
        "👇🏻👇🏻👇🏻"
    )
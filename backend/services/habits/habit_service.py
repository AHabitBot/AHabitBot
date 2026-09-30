import asyncio
from datetime import date
from typing import Any

from backend.repositories.habits import (
    archive_habit,
    get_archived_habits,
    restore_habit,
    set_habit_confirmation,
    update_habit,
)

from backend.services.achievements.achievements_service import (
    sync_achievements,
)

from backend.services.profile.level_progression_service import (
    sync_user_level_progression,
)

from backend.services.habits.shared_habit_notification_service import (
    send_shared_habit_confirmation_notifications,
)


async def _send_shared_confirmation_notifications_safely(
    user_id: int,
    habit_id: int,
    confirmation_date: date | None,
) -> None:
    """
    Уведомления друзей не входят в критический путь подтверждения.

    Ошибка Telegram или уведомлений не влияет на уже сохранённое
    подтверждение привычки и не задерживает HTTP-ответ пользователю.
    """
    try:
        await send_shared_habit_confirmation_notifications(
            user_id=user_id,
            habit_id=habit_id,
            confirmation_date=confirmation_date,
        )
    except Exception as error:
        print(
            "⚠️ Ошибка уведомления совместной привычки | "
            f"User ID: {user_id} | "
            f"Habit ID: {habit_id} | "
            f"Ошибка: {error}"
        )


# =========================================================
# ОБНОВИТЬ ПОДТВЕРЖДЕНИЕ ПРИВЫЧКИ
# =========================================================

async def update_habit_confirmation(
    user_id: int,
    habit_id: int,
    is_confirmed: bool,
) -> dict[str, Any] | None:
    """
    Устанавливает желаемое состояние подтверждения привычки.

    is_confirmed=True:
        подтвердить привычку сегодня.

    is_confirmed=False:
        отменить сегодняшнее подтверждение.

    После изменения подтверждения
    синхронизирует все достижения пользователя.
    """

    # =====================================================
    # ОБНОВЛЯЕМ ПОДТВЕРЖДЕНИЕ
    # =====================================================

    result = await set_habit_confirmation(
        user_id=user_id,
        habit_id=habit_id,
        is_confirmed=is_confirmed,
    )

    if result is None:
        return None

    # =====================================================
    # СИНХРОНИЗИРУЕМ ДОСТИЖЕНИЯ
    #
    # К этому моменту repository уже пересчитал:
    #
    # - current_streak;
    # - max_streak;
    # - total_confirmations;
    # - total_xp.
    #
    # Проверяются:
    #
    # 1. streak;
    # 2. confirmations.
    # =====================================================

    newly_earned = await sync_achievements(
        user_id=user_id,
    )

    # =====================================================
    # RESPONSE
    #
    # Frontend привычек пока может
    # игнорировать это поле.
    # =====================================================

    result["new_achievements"] = (
        newly_earned
    )

    # =====================================================
    # УРОВЕНЬ
    #
    # Проверяем только после достижений, потому что они
    # могли добавить XP этим же подтверждением.
    # При отмене подтверждения новый максимум не создаётся.
    # =====================================================

    try:
        level_progression = (
            await sync_user_level_progression(
                user_id=user_id,
            )
        )
    except Exception as error:
        # Уведомления/прогресс уровня — дополнительный слой.
        # Его техническая ошибка не должна ломать уже
        # выполненное подтверждение привычки.
        print(
            "⚠️ Ошибка синхронизации уровня | "
            f"User ID: {user_id} | "
            f"Ошибка: {error}"
        )
        level_progression = None

    result["level_progression"] = (
        level_progression
    )

    # Уведомляем остальных участников только при реальном
    # переходе из "не выполнено" в "выполнено". Повторный
    # одинаковый запрос не создаёт дублирующее сообщение.
    if (
        is_confirmed
        and result.get("confirmation_state_changed")
    ):
        confirmation_date_raw = (
            result.get(
                "habit",
                {},
            ).get(
                "confirmation_date"
            )
        )

        confirmation_date = (
            date.fromisoformat(
                confirmation_date_raw
            )
            if confirmation_date_raw
            else None
        )

        # Не ждём Telegram перед HTTP-ответом.
        # Сама логика уведомлений остаётся прежней.
        asyncio.create_task(
            _send_shared_confirmation_notifications_safely(
                user_id=user_id,
                habit_id=habit_id,
                confirmation_date=confirmation_date,
            )
        )

    return result


# =========================================================
# РЕДАКТИРОВАТЬ ПРИВЫЧКУ
# =========================================================

async def edit_habit(
    user_id: int,
    habit_id: int,
    title: str,
    emoji: str,
    color: str,
    size: str,
    repeat_type: str,
    repeat_days: list[int],
    weekly_target: int | None,
    challenge_target: int | None,
    habit_reminder: str | None,
) -> dict[str, Any] | None:
    """
    Обновляет редактируемые данные привычки.

    Возвращает обновлённую привычку
    или None, если привычка не найдена.
    """

    return await update_habit(
        user_id=user_id,
        habit_id=habit_id,
        title=title,
        emoji=emoji,
        color=color,
        size=size,
        repeat_type=repeat_type,
        repeat_days=repeat_days,
        weekly_target=weekly_target,
        challenge_target=challenge_target,
        habit_reminder=habit_reminder,
    )


# =========================================================
# АРХИВИРОВАТЬ ПРИВЫЧКУ
# =========================================================

async def archive_user_habit(
    user_id: int,
    habit_id: int,
) -> bool:
    """
    Архивирует привычку пользователя.
    """

    return await archive_habit(
        user_id=user_id,
        habit_id=habit_id,
    )


# =========================================================
# ПОЛУЧИТЬ АРХИВНЫЕ ПРИВЫЧКИ
# =========================================================

async def get_user_archived_habits(
    user_id: int,
) -> list[dict[str, Any]]:
    """
    Возвращает архивные привычки пользователя
    со статистикой для страницы Архива.
    """

    return await get_archived_habits(
        user_id=user_id,
    )


# =========================================================
# ВОССТАНОВИТЬ ПРИВЫЧКУ ИЗ АРХИВА
# =========================================================

async def restore_user_habit(
    user_id: int,
    habit_id: int,
) -> dict[str, Any] | None:
    """
    Восстанавливает архивную привычку пользователя.

    История подтверждений, XP и лучший стрик
    при восстановлении не изменяются.
    """

    return await restore_habit(
        user_id=user_id,
        habit_id=habit_id,
    )

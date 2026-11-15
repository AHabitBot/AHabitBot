"""Общие последствия подтверждения: достижения, уровни и уведомления.

Используются обычными привычками и исследованиями; запись XP остаётся
в едином репозитории habit_confirmations.
"""
import asyncio
from datetime import date
from backend.services.achievements.achievements_service import sync_achievements
from backend.services.profile.level_progression_service import sync_user_level_progression
from backend.services.habits.shared_habit_notification_service import send_shared_habit_confirmation_notifications

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



async def finalize_confirmation(user_id: int, habit_id: int, is_confirmed: bool, result: dict, *, notify_shared: bool = True) -> dict:
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
        notify_shared
        and is_confirmed
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

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

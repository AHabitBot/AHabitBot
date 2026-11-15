from typing import Any

from backend.services.habits.confirmation_effects import finalize_confirmation
from backend.repositories.habits import (
    archive_habit,
    get_archived_habits,
    restore_habit,
    set_habit_confirmation,
    update_habit,
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

    return await finalize_confirmation(user_id, habit_id, is_confirmed, result)


# =========================================================
# РЕДАКТИРОВАТЬ ПРИВЫЧКУ
# =========================================================

async def edit_habit(
    user_id: int,
    habit_id: int,
    title: str,
    description: str | None,
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
        description=description,
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

from typing import Any

from backend.repositories.habits import (
    set_habit_confirmation,
    update_habit,
)


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
    """

    return await set_habit_confirmation(
        user_id=user_id,
        habit_id=habit_id,
        is_confirmed=is_confirmed,
    )


async def edit_habit(
    user_id: int,
    habit_id: int,
    title: str,
    emoji: str,
    color: str,
    size: str,
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
    )
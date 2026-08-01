from typing import Any

from backend.repositories.habits import (
    set_habit_confirmation,
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
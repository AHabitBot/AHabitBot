from typing import Any

from backend.repositories.profile import (
    get_level_progression_state,
    mark_highest_level_reached,
)
from backend.services.profile.appearance_config import (
    get_newly_unlocked_avatars,
)
from backend.services.profile.level_notifications import (
    send_level_up_notification,
)
from backend.services.profile.level_service import (
    calculate_level_progress,
)


# =========================================================
# LEVEL PROGRESSION SERVICE
# =========================================================


async def sync_user_level_progression(
    user_id: int,
) -> dict[str, Any] | None:
    """
    Проверяет, достиг ли пользователь нового максимального уровня.

    Важно:
    - total_xp не меняет;
    - формулу уровня не меняет;
    - при снижении XP highest_level_reached не уменьшается;
    - Telegram-ошибка не откатывает прогресс;
    - конкурентные вызовы защищены условным UPDATE.
    """

    state = await get_level_progression_state(
        user_id=user_id,
    )

    if state is None:
        return None

    total_xp = max(
        0,
        int(state.get("total_xp") or 0),
    )

    highest_level_reached = max(
        1,
        int(
            state.get("highest_level_reached")
            or 1
        ),
    )

    current_level = int(
        calculate_level_progress(
            total_xp=total_xp,
        )["level"]
    )

    # Новый исторический максимум не достигнут.
    if current_level <= highest_level_reached:
        return {
            "level_up": False,
            "current_level": current_level,
            "highest_level_reached": highest_level_reached,
            "unlocked_avatars": [],
        }

    newly_unlocked_avatars = (
        get_newly_unlocked_avatars(
            previous_level=highest_level_reached,
            current_level=current_level,
        )
    )

    # Условный UPDATE гарантирует, что при двух параллельных
    # вызовах уведомление отправит только один из них.
    updated = await mark_highest_level_reached(
        user_id=user_id,
        new_level=current_level,
    )

    if not updated:
        return {
            "level_up": False,
            "current_level": current_level,
            "highest_level_reached": current_level,
            "unlocked_avatars": [],
        }

    await send_level_up_notification(
        telegram_id=int(state["telegram_id"]),
        level=current_level,
        unlocked_avatars_count=len(
            newly_unlocked_avatars
        ),
    )

    return {
        "level_up": True,
        "current_level": current_level,
        "highest_level_reached": current_level,
        "unlocked_avatars": [
            str(avatar["id"])
            for avatar in newly_unlocked_avatars
        ],
    }

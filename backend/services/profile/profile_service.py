from typing import Any

from backend.repositories.profile.profile_repository import (
    get_profile_data,
)
from backend.services.profile.level_service import (
    calculate_level_progress,
)


# =========================================================
# PROFILE SERVICE
# =========================================================


async def get_profile(
    user_id: int,
) -> dict[str, Any] | None:
    """
    Возвращает подготовленные данные
    главной карточки профиля пользователя.
    """

    profile_data = await get_profile_data(
        user_id=user_id,
    )

    if profile_data is None:
        return None

    total_xp = max(
        int(profile_data.get("total_xp") or 0),
        0,
    )

    level_progress = calculate_level_progress(
        total_xp=total_xp,
    )

    nickname_changed_at = profile_data.get(
        "nickname_changed_at"
    )

    return {
        "nickname": profile_data.get(
            "nickname"
        ),

        "avatar_key": (
            profile_data.get("avatar_key")
            or "beginer_m"
        ),

        "nickname_can_change": (
            nickname_changed_at is None
        ),

        "total_xp": total_xp,

        "level": (
            level_progress["level"]
        ),

        "level_xp": (
            level_progress["level_xp"]
        ),

        "level_xp_required": (
            level_progress[
                "level_xp_required"
            ]
        ),

        "xp_to_next_level": (
            level_progress[
                "xp_to_next_level"
            ]
        ),

        "level_progress": (
            level_progress[
                "level_progress"
            ]
        ),
    }
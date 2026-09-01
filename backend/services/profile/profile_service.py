import re
from typing import Any

import asyncpg

from backend.repositories.profile import (
    get_profile_data,
    update_nickname_once,
    update_profile_appearance,
)

from backend.services.profile.level_service import (
    calculate_level_progress,
)

from backend.services.profile.appearance_config import (
    get_avatar_required_level,
)

from backend.services.achievements.achievements_service import (
    get_achievements,
)


# =========================================================
# PROFILE SERVICE
# =========================================================


# =========================================================
# НАСТРОЙКИ NICKNAME
# =========================================================

NICKNAME_MIN_LENGTH = 3
NICKNAME_MAX_LENGTH = 20

NICKNAME_PATTERN = re.compile(
    r"^[A-Za-zА-Яа-яЁё0-9_]+$"
)


# =========================================================
# PRIVATE AVATARS
# =========================================================

PRIVATE_AVATAR_USERS: dict[str, set[int]] = {
    "petya_01": {
        4,
        9,
    },
}


# =========================================================
# PRIVATE AVATAR HELPERS
# =========================================================

def is_private_avatar(
    avatar_key: str,
) -> bool:
    return (
        avatar_key
        in PRIVATE_AVATAR_USERS
    )


def can_user_use_private_avatar(
    user_id: int,
    avatar_key: str,
) -> bool:
    allowed_user_ids = (
        PRIVATE_AVATAR_USERS.get(
            avatar_key
        )
    )

    if allowed_user_ids is None:
        return False

    return (
        int(user_id)
        in allowed_user_ids
    )


# =========================================================
# ПОЛУЧИТЬ ПРОФИЛЬ
# =========================================================

async def get_profile(
    user_id: int,
    achievements_data: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """
    Возвращает подготовленные данные
    профиля пользователя.

    achievements_data может быть заранее
    передан bootstrap'ом, чтобы не выполнять
    повторный запрос достижений.
    """

    profile_data = await get_profile_data(
        user_id=user_id,
    )

    if profile_data is None:
        return None


    # =====================================================
    # XP
    # =====================================================

    total_xp = max(
        int(
            profile_data.get(
                "total_xp"
            )
            or 0
        ),
        0,
    )


    # =====================================================
    # УРОВЕНЬ
    # =====================================================

    level_progress = (
        calculate_level_progress(
            total_xp=total_xp,
        )
    )


    # =====================================================
    # МАКСИМАЛЬНЫЙ ДОСТИГНУТЫЙ УРОВЕНЬ
    # =====================================================

    highest_level_reached = max(
        int(
            profile_data.get(
                "highest_level_reached"
            )
            or level_progress["level"]
        ),
        int(
            level_progress["level"]
        ),
        1,
    )


    # =====================================================
    # NICKNAME
    # =====================================================

    nickname_changed_at = (
        profile_data.get(
            "nickname_changed_at"
        )
    )


    # =====================================================
    # ДОСТИЖЕНИЯ
    # =====================================================

    achievements = (
        achievements_data
        if achievements_data is not None
        else await get_achievements(
            user_id=user_id,
        )
    )


    achievements_earned_count = max(
        int(
            achievements.get(
                "earned_count"
            )
            or 0
        ),
        0,
    )


    achievements_total_count = max(
        int(
            achievements.get(
                "total_count"
            )
            or 0
        ),
        0,
    )


    # =====================================================
    # ГОТОВЫЙ ПРОФИЛЬ
    # =====================================================

    return {
        "user_id":
            int(user_id),

        "nickname": (
            profile_data.get(
                "nickname"
            )
        ),

        "avatar_key": (
            profile_data.get(
                "avatar_key"
            )
            or "standard_m_01"
        ),

        "background_key": (
            profile_data.get(
                "background_key"
            )
            or "background_forest_1"
        ),

        "nickname_can_change": (
            nickname_changed_at
            is None
        ),

        "total_xp":
            total_xp,

        "level": (
            level_progress[
                "level"
            ]
        ),

        "highest_level_reached":
            highest_level_reached,

        "level_xp": (
            level_progress[
                "level_xp"
            ]
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

        "achievements_earned_count":
            achievements_earned_count,

        "achievements_total_count":
            achievements_total_count,
    }


# =========================================================
# ИЗМЕНИТЬ NICKNAME
# =========================================================

async def change_nickname(
    user_id: int,
    nickname: str,
) -> dict[str, Any]:
    """
    Одноразовая смена nickname пользователя.

    Никнейм:
    - от 3 до 20 символов;
    - латиница;
    - кириллица;
    - цифры;
    - символ "_";
    - без пробелов;
    - без остальных спецсимволов.
    """

    normalized_nickname = (
        str(
            nickname or ""
        ).strip()
    )


    # =====================================================
    # ДЛИНА
    # =====================================================

    if (
        len(normalized_nickname)
        < NICKNAME_MIN_LENGTH
        or
        len(normalized_nickname)
        > NICKNAME_MAX_LENGTH
    ):
        raise ValueError(
            "Никнейм должен содержать "
            "от 3 до 20 символов"
        )


    # =====================================================
    # ДОПУСТИМЫЕ СИМВОЛЫ
    # =====================================================

    if not NICKNAME_PATTERN.fullmatch(
        normalized_nickname
    ):
        raise ValueError(
            "Никнейм может содержать только "
            "буквы, цифры и символ _"
        )


    # =====================================================
    # ОБНОВЛЕНИЕ
    # =====================================================

    try:
        updated_user = (
            await update_nickname_once(
                user_id=user_id,
                nickname=
                    normalized_nickname,
            )
        )

    except asyncpg.UniqueViolationError:
        raise ValueError(
            "Этот никнейм уже занят"
        )


    # =====================================================
    # СМЕНА УЖЕ ИСПОЛЬЗОВАНА
    # =====================================================

    if updated_user is None:
        raise PermissionError(
            "Вы уже использовали возможность "
            "изменить никнейм"
        )


    # =====================================================
    # РЕЗУЛЬТАТ
    # =====================================================

    return {
        "nickname": (
            updated_user[
                "nickname"
            ]
        ),

        "nickname_can_change":
            False,
    }


# =========================================================
# ИЗМЕНИТЬ ВНЕШНИЙ ВИД
# =========================================================

async def change_profile_appearance(
    user_id: int,
    avatar_key: str,
    background_key: str,
) -> dict[str, Any]:
    """
    Сохраняет выбранный внешний вид пользователя.

    Обычные аватары проверяются
    существующей системой уровней.

    Private-аватары разрешены только
    конкретным пользователям.
    """

    normalized_avatar_key = (
        str(
            avatar_key or ""
        ).strip()
    )

    normalized_background_key = (
        str(
            background_key or ""
        ).strip()
    )


    # =====================================================
    # AVATAR KEY
    # =====================================================

    if not normalized_avatar_key:
        raise ValueError(
            "Не передан avatar_key"
        )


    # =====================================================
    # PROFILE DATA
    # =====================================================

    profile_data = await get_profile_data(
        user_id=user_id,
    )

    if profile_data is None:
        raise ValueError(
            "Профиль пользователя не найден"
        )


    # =====================================================
    # PRIVATE AVATAR
    # =====================================================

    if is_private_avatar(
        normalized_avatar_key
    ):
        if not can_user_use_private_avatar(
            user_id=user_id,
            avatar_key=
                normalized_avatar_key,
        ):
            raise ValueError(
                "Этот аватар недоступен "
                "этому пользователю"
            )


    # =====================================================
    # STANDARD AVATAR
    # =====================================================

    else:
        required_level = (
            get_avatar_required_level(
                normalized_avatar_key
            )
        )


        if required_level is None:
            raise ValueError(
                "Неизвестный avatar_key"
            )


        current_level = int(
            calculate_level_progress(
                total_xp=max(
                    0,
                    int(
                        profile_data.get(
                            "total_xp"
                        )
                        or 0
                    ),
                )
            )["level"]
        )


        highest_level_reached = max(
            1,
            current_level,
            int(
                profile_data.get(
                    "highest_level_reached"
                )
                or 1
            ),
        )


        if (
            highest_level_reached
            < required_level
        ):
            raise ValueError(
                "Этот аватар ещё не открыт"
            )


    # =====================================================
    # BACKGROUND
    # =====================================================

    if not normalized_background_key:
        raise ValueError(
            "Не передан background_key"
        )


    # =====================================================
    # ОБНОВЛЕНИЕ
    # =====================================================

    updated_appearance = (
        await update_profile_appearance(
            user_id=user_id,

            avatar_key=
                normalized_avatar_key,

            background_key=
                normalized_background_key,
        )
    )


    # =====================================================
    # ПРОФИЛЬ НЕ НАЙДЕН
    # =====================================================

    if updated_appearance is None:
        raise ValueError(
            "Профиль пользователя не найден"
        )


    # =====================================================
    # РЕЗУЛЬТАТ
    # =====================================================

    return {
        "avatar_key": (
            updated_appearance[
                "avatar_key"
            ]
        ),

        "background_key": (
            updated_appearance[
                "background_key"
            ]
        ),
    }
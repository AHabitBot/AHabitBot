import re
from typing import Any

import asyncpg

from backend.repositories.profile import (
    get_profile_data,
    update_nickname_once,
)

from backend.services.profile.level_service import (
    calculate_level_progress,
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
# ПОЛУЧИТЬ ПРОФИЛЬ
# =========================================================

async def get_profile(
    user_id: int,
) -> dict[str, Any] | None:
    """
    Возвращает подготовленные данные
    главной карточки профиля пользователя.

    Repository получает данные из PostgreSQL.

    Service:
    - нормализует XP;
    - рассчитывает уровень;
    - определяет возможность смены nickname;
    - формирует готовые данные для API.
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
    # NICKNAME
    # =====================================================

    nickname_changed_at = (
        profile_data.get(
            "nickname_changed_at"
        )
    )


    # =====================================================
    # ГОТОВЫЙ ПРОФИЛЬ
    # =====================================================

    return {
        "nickname": (
            profile_data.get(
                "nickname"
            )
        ),

        "avatar_key": (
            profile_data.get(
                "avatar_key"
            )
            or "beginer_m"
        ),

        "nickname_can_change": (
            nickname_changed_at is None
        ),

        "total_xp": total_xp,

        "level": (
            level_progress[
                "level"
            ]
        ),

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

    Повторная смена блокируется на уровне SQL
    через nickname_changed_at IS NULL.
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
                nickname=normalized_nickname,
            )
        )

    except asyncpg.UniqueViolationError:
        raise ValueError(
            "Этот никнейм уже занят"
        )


    # =====================================================
    # ПРАВО НА СМЕНУ УЖЕ ИСПОЛЬЗОВАНО
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

        "nickname_can_change": False,
    }
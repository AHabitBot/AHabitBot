from typing import Any


# =========================================================
# PROFILE APPEARANCE CONFIG
# =========================================================

# Backend-конфиг доступных аватаров.
# Frontend содержит те же requiredLevel для отображения UI,
# а backend является окончательным источником проверки доступа.

PROFILE_AVATARS: list[dict[str, Any]] = [
    {
        "id": "standard_m_01",
        "required_level": 1,
    },
    {
        "id": "standard_f_01",
        "required_level": 1,
    },
    {
        "id": "standard_m_02",
        "required_level": 5,
    },
    {
        "id": "standard_f_02",
        "required_level": 5,
    },
    {
        "id": "standard_m_03",
        "required_level": 10,
    },
    {
        "id": "standard_f_03",
        "required_level": 10,
    },
    {
        "id": "standard_m_04",
        "required_level": 15,
    },
    {
        "id": "standard_f_04",
        "required_level": 15,
    },
    {
        "id": "standard_m_05",
        "required_level": 20,
    },
    {
        "id": "standard_f_05",
        "required_level": 20,
    },
]


_AVATAR_BY_ID = {
    str(avatar["id"]): avatar
    for avatar in PROFILE_AVATARS
}


def get_avatar_config(
    avatar_key: str,
) -> dict[str, Any] | None:
    return _AVATAR_BY_ID.get(
        str(avatar_key)
    )


def get_avatar_required_level(
    avatar_key: str,
) -> int | None:
    avatar = get_avatar_config(
        avatar_key
    )

    if avatar is None:
        return None

    return max(
        1,
        int(
            avatar.get("required_level")
            or 1
        ),
    )


def get_newly_unlocked_avatars(
    previous_level: int,
    current_level: int,
) -> list[dict[str, Any]]:
    """
    Возвращает аватары, порог которых был пересечён
    между previous_level и current_level.
    """

    previous_level = max(
        1,
        int(previous_level),
    )
    current_level = max(
        1,
        int(current_level),
    )

    if current_level <= previous_level:
        return []

    return [
        avatar
        for avatar in PROFILE_AVATARS
        if (
            previous_level
            < int(avatar["required_level"])
            <= current_level
        )
    ]

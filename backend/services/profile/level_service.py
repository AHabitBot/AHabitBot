from typing import TypedDict


class LevelProgress(TypedDict):
    level: int
    level_xp: int
    level_xp_required: int
    xp_to_next_level: int
    level_progress: int


def get_level_xp_required(level: int) -> int:
    """
    Количество XP, необходимое для перехода
    с текущего уровня на следующий.

    Уровень 1 -> 2: 20 XP
    Уровень 2 -> 3: 30 XP
    Уровень 3 -> 4: 40 XP
    Уровень 4 -> 5: 50 XP
    и т.д.
    """

    if level < 1:
        raise ValueError("Level must be greater than or equal to 1")

    return (level + 1) * 10


def calculate_level_progress(
    total_xp: int,
) -> LevelProgress:
    """
    Рассчитывает уровень пользователя и прогресс
    внутри текущего уровня только на основании total_xp.

    Уровень и прогресс отдельно в БД не хранятся.
    """

    if total_xp < 0:
        total_xp = 0

    level = 1
    remaining_xp = total_xp

    while True:
        xp_required = get_level_xp_required(
            level
        )

        if remaining_xp < xp_required:
            break

        remaining_xp -= xp_required
        level += 1

    level_xp = remaining_xp

    xp_to_next_level = (
        xp_required - level_xp
    )

    level_progress = int(
        (level_xp / xp_required) * 100
    )

    return {
        "level": level,
        "level_xp": level_xp,
        "level_xp_required": xp_required,
        "xp_to_next_level": xp_to_next_level,
        "level_progress": level_progress,
    }
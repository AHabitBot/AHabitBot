__all__ = [
    "edit_habit",
    "update_habit_confirmation",
    "archive_user_habit",
]


def __getattr__(name: str):
    """Load service exports lazily so pure repeat rules stay import-safe."""
    if name not in __all__:
        raise AttributeError(name)

    from .habit_service import (
        archive_user_habit,
        edit_habit,
        update_habit_confirmation,
    )

    exports = {
        "edit_habit": edit_habit,
        "update_habit_confirmation": update_habit_confirmation,
        "archive_user_habit": archive_user_habit,
    }

    return exports[name]

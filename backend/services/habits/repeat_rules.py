from datetime import date, timedelta
from typing import Literal

RepeatType = Literal["days", "weekly", "challenge"]
ALL_WEEKDAYS = (1, 2, 3, 4, 5, 6, 7)


def normalize_repeat_rule(
    repeat_type: str,
    repeat_days: list[int] | None,
    weekly_target: int | None,
    challenge_target: int | None,
) -> tuple[RepeatType, list[int], int | None, int | None]:
    if repeat_type not in {"days", "weekly", "challenge"}:
        raise ValueError("Некорректный тип повторения")

    if repeat_type == "days":
        days = sorted({int(day) for day in (repeat_days or [])})
        if not days or any(day not in ALL_WEEKDAYS for day in days):
            raise ValueError("Нужно выбрать хотя бы один день недели")
        return "days", days, None, None

    if repeat_type == "weekly":
        target = int(weekly_target or 0)
        if not 1 <= target <= 7:
            raise ValueError("Недельная цель должна быть от 1 до 7 дней")
        return "weekly", [], target, None

    target = int(challenge_target or 0)
    if target < 1:
        raise ValueError("Цель челленджа должна быть больше нуля")
    return "challenge", [], None, target


def is_confirmation_allowed(repeat_type: str, repeat_days: list[int], today: date) -> bool:
    return repeat_type != "days" or today.isoweekday() in set(repeat_days)


def calculate_repeat_streak(
    repeat_type: str,
    repeat_days: list[int],
    completed_dates: list[date],
    today: date,
    started_on: date,
) -> int:
    completed = {item for item in completed_dates if item >= started_on}

    if repeat_type == "weekly":
        return _calculate_weekly_streak(completed, today, started_on)

    if repeat_type == "challenge":
        cursor = today if today in completed else today - timedelta(days=1)
        streak = 0
        while cursor >= started_on and cursor in completed:
            streak += 1
            cursor -= timedelta(days=1)
        return streak

    scheduled = set(repeat_days)
    cursor = today
    while cursor >= started_on and cursor.isoweekday() not in scheduled:
        cursor -= timedelta(days=1)
    if cursor == today and cursor not in completed:
        cursor -= timedelta(days=1)
        while cursor >= started_on and cursor.isoweekday() not in scheduled:
            cursor -= timedelta(days=1)
    streak = 0
    while cursor >= started_on:
        if cursor.isoweekday() in scheduled:
            if cursor not in completed:
                break
            streak += 1
        cursor -= timedelta(days=1)
    return streak


def _calculate_weekly_streak(completed: set[date], today: date, started_on: date) -> int:
    # weekly_target is applied by calculate_weekly_streak_with_target below.
    raise RuntimeError("Use calculate_weekly_streak_with_target")


def calculate_weekly_streak_with_target(
    completed_dates: list[date], today: date, started_on: date, target: int
) -> int:
    completed = {item for item in completed_dates if item >= started_on}
    week_start = today - timedelta(days=today.weekday())
    current_count = sum(week_start <= item <= today for item in completed)
    cursor = week_start if current_count >= target else week_start - timedelta(days=7)
    streak = 0
    while cursor + timedelta(days=6) >= started_on:
        count = sum(cursor <= item <= cursor + timedelta(days=6) for item in completed)
        if count < target:
            break
        streak += 1
        cursor -= timedelta(days=7)
    return streak

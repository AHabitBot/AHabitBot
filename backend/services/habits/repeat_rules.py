from datetime import date, timedelta
from typing import Literal

RepeatType = Literal["days", "challenge"]
ALL_WEEKDAYS = (1, 2, 3, 4, 5, 6, 7)


def normalize_repeat_rule(repeat_type: str, repeat_days: list[int] | None, weekly_target: int | None, challenge_target: int | None) -> tuple[RepeatType, list[int], int | None, int | None]:
    if repeat_type not in {"days", "challenge"}:
        raise ValueError("Некорректный тип повторения")
    if repeat_type == "days":
        days = sorted({int(day) for day in (repeat_days or [])})
        if not days or any(day not in ALL_WEEKDAYS for day in days):
            raise ValueError("Нужно выбрать хотя бы один день недели")
        return "days", days, None, None
    target = int(challenge_target or 0)
    if target < 1:
        raise ValueError("Цель челленджа должна быть больше нуля")
    return "challenge", [], None, target


def is_confirmation_allowed(repeat_type: str, repeat_days: list[int], today: date) -> bool:
    """Подтверждение разрешено и вне расписания; в streak идут только обязательные дни."""
    return True


def calculate_streak_state(results: list[bool]) -> tuple[int, bool]:
    """Единый движок серии: SUCCESS +1, первый MISS замораживает, второй MISS подряд сбрасывает."""
    streak = 0
    frozen = False
    for success in results:
        if success:
            streak += 1
            frozen = False
        elif streak > 0:
            if frozen:
                streak = 0
                frozen = False
            else:
                frozen = True
    return streak, frozen


def calculate_repeat_streak_state(repeat_type: str, repeat_days: list[int], completed_dates: list[date], today: date, started_on: date) -> tuple[int, bool]:
    completed = {item for item in completed_dates if item >= started_on}
    if today < started_on:
        return 0, False

    scheduled = set(ALL_WEEKDAYS if repeat_type == "challenge" else repeat_days)
    results: list[bool] = []
    cursor = started_on
    while cursor <= today:
        if cursor.isoweekday() in scheduled:
            if cursor == today and cursor not in completed:
                break  # текущий незавершённый день ещё не MISS
            results.append(cursor in completed)
        cursor += timedelta(days=1)
    return calculate_streak_state(results)


def calculate_repeat_streak(repeat_type: str, repeat_days: list[int], completed_dates: list[date], today: date, started_on: date) -> int:
    return calculate_repeat_streak_state(repeat_type, repeat_days, completed_dates, today, started_on)[0]


def calculate_user_streak_state(confirmation_dates: list[date], today: date) -> tuple[int, bool]:
    """Личный streak: SUCCESS = хотя бы одно подтверждение в календарный день."""
    if not confirmation_dates:
        return 0, False
    completed = set(confirmation_dates)
    started_on = min(completed)
    results: list[bool] = []
    cursor = started_on
    while cursor <= today:
        if cursor == today and cursor not in completed:
            break
        results.append(cursor in completed)
        cursor += timedelta(days=1)
    return calculate_streak_state(results)

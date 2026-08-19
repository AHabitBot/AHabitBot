from datetime import (
    date,
    timedelta,
)


SEASON_START_DATE = date(
    2026,
    6,
    1,
)

SEASON_LENGTH_MONTHS = 3


# =========================================================
# ПОЛУЧИТЬ НОМЕР СЕЗОНА ПО ДАТЕ
# =========================================================

def get_season_number(
    target_date: date,
) -> int:
    """
    Возвращает номер сезона для указанной даты.

    Сезон 1:
    01.06.2026–31.08.2026

    Сезон 2:
    01.09.2026–30.11.2026
    """

    if target_date < SEASON_START_DATE:
        raise ValueError(
            "Дата раньше начала первого сезона"
        )

    months_from_start = (
        (
            target_date.year
            - SEASON_START_DATE.year
        ) * 12
        + (
            target_date.month
            - SEASON_START_DATE.month
        )
    )

    return (
        months_from_start
        // SEASON_LENGTH_MONTHS
        + 1
    )


# =========================================================
# ПОЛУЧИТЬ ГРАНИЦЫ СЕЗОНА
# =========================================================

def get_season_dates(
    season_number: int,
) -> tuple[date, date]:
    """
    Возвращает включительные даты:

    starts_on — первый день сезона;
    ends_on   — последний день сезона.
    """

    if season_number < 1:
        raise ValueError(
            "Номер сезона должен быть не меньше 1"
        )

    start_month_offset = (
        season_number - 1
    ) * SEASON_LENGTH_MONTHS

    starts_on = add_months(
        SEASON_START_DATE,
        start_month_offset,
    )

    next_season_start = add_months(
        starts_on,
        SEASON_LENGTH_MONTHS,
    )

    ends_on = (
        next_season_start
        - timedelta(days=1)
    )

    return (
        starts_on,
        ends_on,
    )


# =========================================================
# ДОБАВИТЬ МЕСЯЦЫ К ДАТЕ
# =========================================================

def add_months(
    source_date: date,
    months: int,
) -> date:
    """
    Добавляет к дате указанное количество месяцев.

    Сезоны всегда начинаются первого числа,
    поэтому день сохраняется равным 1.
    """

    total_months = (
        source_date.year * 12
        + source_date.month
        - 1
        + months
    )

    year = total_months // 12
    month = total_months % 12 + 1

    return date(
        year,
        month,
        1,
    )
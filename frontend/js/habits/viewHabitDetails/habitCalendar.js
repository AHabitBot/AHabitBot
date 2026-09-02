import {
    t
} from "../../../i18n/core/i18n.js"


const WEEK_DAYS = [
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun"
]


function parseCalendarDate(value) {
    if (value instanceof Date) {
        const copiedDate = new Date(value)

        return Number.isNaN(copiedDate.getTime())
            ? null
            : copiedDate
    }

    if (typeof value !== "string") {
        return null
    }

    const normalizedValue =
        value.trim().slice(0, 10)

    const match = normalizedValue.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    )

    if (!match) {
        const fallbackDate = new Date(value)

        return Number.isNaN(fallbackDate.getTime())
            ? null
            : fallbackDate
    }

    const year = Number(match[1])
    const monthIndex = Number(match[2]) - 1
    const day = Number(match[3])
    const date = new Date(year, monthIndex, day)

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== monthIndex ||
        date.getDate() !== day
    ) {
        return null
    }

    return date
}


function getDateKey(value) {
    const date = parseCalendarDate(value)

    if (!date) {
        return ""
    }

    const year = date.getFullYear()
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0")
    const day = String(
        date.getDate()
    ).padStart(2, "0")

    return `${year}-${month}-${day}`
}


function getDayTime(value) {
    const date = parseCalendarDate(value)

    if (!date) {
        return null
    }

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    ).getTime()
}


function getMonthKey(date) {
    return (
        date.getFullYear() * 12 +
        date.getMonth()
    )
}


function getAvailableMonths(
    createdAt,
    currentDate
) {
    const currentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
    )

    const createdDate =
        parseCalendarDate(createdAt) ??
        currentMonth

    const firstMonth =
        getMonthKey(createdDate) <
        getMonthKey(currentMonth)
            ? new Date(
                createdDate.getFullYear(),
                createdDate.getMonth(),
                1
            )
            : currentMonth

    const months = []
    const cursor = new Date(firstMonth)

    while (
        getMonthKey(cursor) <=
        getMonthKey(currentMonth)
    ) {
        months.push(new Date(cursor))
        cursor.setMonth(cursor.getMonth() + 1)
    }

    return months
}


function createCalendarMonth({
    monthDate,
    completedDateKeys,
    createdDate,
    today
}) {
    const year = monthDate.getFullYear()
    const monthIndex = monthDate.getMonth()
    const todayKey = getDateKey(today)
    const createdTime = getDayTime(createdDate)
    const todayTime = getDayTime(today)
    const firstDay = new Date(year, monthIndex, 1)
    const daysInMonth = new Date(
        year,
        monthIndex + 1,
        0
    ).getDate()

    const emptyCells =
        (firstDay.getDay() + 6) % 7

    const cells = Array.from(
        {length: emptyCells},
        (_, index) => ({
            type: "empty",
            key: `empty-${index}`
        })
    )

    for (
        let day = 1;
        day <= daysInMonth;
        day += 1
    ) {
        const date = new Date(
            year,
            monthIndex,
            day
        )
        const dateKey = getDateKey(date)
        const dateTime = getDayTime(date)

        cells.push({
            type: "day",
            key: dateKey,
            day,
            dateKey,
            isToday: dateKey === todayKey,
            isCompleted:
                completedDateKeys.has(dateKey),
            isBeforeCreated:
                createdTime !== null &&
                dateTime < createdTime,
            isFuture:
                todayTime !== null &&
                dateTime > todayTime
        })
    }

    return {
        key: `${year}-${monthIndex}`,
        monthName: t(
            `habits.details.calendar.month.${monthIndex}`
        ),
        isCurrent:
            getMonthKey(monthDate) ===
            getMonthKey(today),
        cells
    }
}


function renderWeekDays() {
    return WEEK_DAYS.map((dayName) => `
        <div
            class="habit-calendar__weekday"
            aria-hidden="true"
        >
            ${t(
                `habits.details.calendar.weekday.${dayName}`
            )}
        </div>
    `).join("")
}


function renderCalendarCell(cell) {
    if (cell.type === "empty") {
        return `
            <div
                class="habit-calendar__day habit-calendar__day--empty"
                aria-hidden="true"
            ></div>
        `
    }

    const classNames = [
        "habit-calendar__day"
    ]
    const stateLabel = []

    if (cell.isCompleted) {
        classNames.push(
            "habit-calendar__day--completed"
        )
        stateLabel.push(
            t("habits.details.calendar.state.completed")
        )
    }

    if (cell.isToday) {
        classNames.push(
            "habit-calendar__day--today"
        )
        stateLabel.push(
            t("habits.details.calendar.state.today")
        )
    }

    if (cell.isBeforeCreated) {
        classNames.push(
            "habit-calendar__day--before-created"
        )
        stateLabel.push(
            t("habits.details.calendar.state.beforeCreated")
        )
    }

    if (cell.isFuture) {
        classNames.push(
            "habit-calendar__day--future"
        )
        stateLabel.push(
            t("habits.details.calendar.state.future")
        )
    }

    const ariaLabel = stateLabel.length
        ? `${cell.day}, ${stateLabel.join(", ")}`
        : String(cell.day)

    return `
        <div
            class="${classNames.join(" ")}"
            data-date="${cell.dateKey}"
            aria-label="${ariaLabel}"
        >
            <span class="habit-calendar__day-number">
                ${cell.day}
            </span>
            ${cell.isToday ? `
                <span
                    class="habit-calendar__today-dot"
                    aria-hidden="true"
                ></span>
            ` : ""}
        </div>
    `
}


function renderCalendarMonth(calendar) {
    return `
        <article
            class="habit-calendar__month-page"
            data-calendar-month
            ${calendar.isCurrent ? 'data-calendar-current="true"' : ""}
            aria-current="${calendar.isCurrent ? "date" : "false"}"
        >
            <h2 class="habit-calendar__month">
                ${calendar.monthName}
            </h2>

            <div class="habit-calendar__weekdays">
                ${renderWeekDays()}
            </div>

            <div class="habit-calendar__grid">
                ${calendar.cells
                    .map(renderCalendarCell)
                    .join("")}
            </div>
        </article>
    `
}


export function renderHabitCalendar({
    completedDates = [],
    createdAt = null
} = {}) {
    const today = new Date()
    const createdDate =
        parseCalendarDate(createdAt) ?? today

    const completedDateKeys = new Set(
        Array.isArray(completedDates)
            ? completedDates
                .map(getDateKey)
                .filter(Boolean)
            : []
    )

    const months = getAvailableMonths(
        createdDate,
        today
    ).map((monthDate) =>
        createCalendarMonth({
            monthDate,
            completedDateKeys,
            createdDate,
            today
        })
    )

    return `
        <section
            class="habit-details__calendar ${months.length === 1 ? "is-single-month" : ""}"
            aria-label="${t("habits.details.calendar.aria")}"
        >
            <div
                class="habit-calendar__viewport"
                data-calendar-viewport
            >
                <div class="habit-calendar__track">
                    ${months.length > 1 ? `
                        <div
                            class="habit-calendar__edge-spacer"
                            aria-hidden="true"
                        ></div>
                    ` : ""}

                    ${months
                        .map(renderCalendarMonth)
                        .join("")}

                    ${months.length > 1 ? `
                        <div
                            class="habit-calendar__edge-spacer"
                            aria-hidden="true"
                        ></div>
                    ` : ""}
                </div>
            </div>
        </section>
    `
}


export function initHabitCalendar(root) {
    const viewport = root?.querySelector(
        "[data-calendar-viewport]"
    )
    const currentMonth = viewport?.querySelector(
        '[data-calendar-current="true"]'
    )

    if (!viewport || !currentMonth) {
        return
    }

    const centerCurrentMonth = () => {
        viewport.scrollLeft =
            currentMonth.offsetLeft -
            (
                viewport.clientWidth -
                currentMonth.offsetWidth
            ) / 2
    }

    centerCurrentMonth()
    window.requestAnimationFrame(
        centerCurrentMonth
    )
}

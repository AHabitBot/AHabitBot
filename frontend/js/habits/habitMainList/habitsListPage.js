import { formatCurrentDate } from "../habitsUtils.js"


export function renderHabitsList(
    habits,
    statistics = {}
) {
    return `
        <section class="habits-v2-list">

            <header class="habits-v2-list__header">

                <div class="habits-v2-list__top">

                    <div class="habits-v2-list__heading">

                        <div class="habits-v2-list__date">
                            ${formatCurrentDate()}
                        </div>

                        <h1 class="habits-v2-list__title">
                            Главная
                        </h1>

                    </div>

                    <div class="habits-v2-list__actions">

                        <button
                            class="habits-v2-list__add-button"
                            type="button"
                            data-action="open-add-habit"
                            aria-label="Создать привычку"
                        >
                            +
                        </button>

                    </div>

                </div>

            </header>


            ${renderHabitsStats(statistics)}


            <div class="habits-v2-list__cards">
                ${habits.map(renderHabitCard).join("")}
            </div>

        </section>
    `
}









/* =========================================================
   HABITS STATS

   Общая статистика привычек:
   текущая серия и суммарный XP.
   ========================================================= */


/* =========================================================
   НОРМАЛИЗАЦИЯ ЧИСЛА
   ========================================================= */

function normalizeStatValue(value) {
    const number = Number(value)

    if (!Number.isFinite(number) || number < 0) {
        return 0
    }

    return Math.floor(number)
}


/* =========================================================
   ФОРМАТИРОВАНИЕ ДНЕЙ
   ========================================================= */

function formatDays(value) {
    const days = normalizeStatValue(value)

    const lastTwoDigits = days % 100
    const lastDigit = days % 10

    if (
        lastTwoDigits >= 11 &&
        lastTwoDigits <= 14
    ) {
        return `${days} дней`
    }

    if (lastDigit === 1) {
        return `${days} день`
    }

    if (
        lastDigit >= 2 &&
        lastDigit <= 4
    ) {
        return `${days} дня`
    }

    return `${days} дней`
}


/* =========================================================
   РЕНДЕР СТАТИСТИКИ
   ========================================================= */

export function renderHabitsStats(statistics = {}) {
    const currentStreak = normalizeStatValue(
        statistics.currentStreak
    )

    const totalXp = normalizeStatValue(
        statistics.totalXp
    )

    return `
        <section
            class="habits-stats"
            aria-label="Статистика привычек"
        >

            <article class="habits-stats__card">

                <div class="habits-stats__main">

                    <span
                        class="
                            habits-stats__icon
                            habits-stats__icon--streak
                        "
                        aria-hidden="true"
                    >
                        🔥
                    </span>

                    <span class="habits-stats__value">
                        ${formatDays(currentStreak)}
                    </span>

                </div>

                <div class="habits-stats__label">
                    Текущая серия
                </div>

            </article>


            <article class="habits-stats__card">

                <div class="habits-stats__main">

                    <span
                        class="
                            habits-stats__icon
                            habits-stats__icon--xp
                        "
                        aria-hidden="true"
                    >
                        ⭐
                    </span>

                    <span class="habits-stats__value">
                        ${totalXp}
                    </span>

                </div>

                <div class="habits-stats__label">
                    Всего XP
                </div>

            </article>

        </section>
    `
}








/* =========================================================
   HABIT CARD

   Отображает одну привычку на главной странице.
   ========================================================= */


/* =========================================================
   БЕЗОПАСНОЕ ЭКРАНИРОВАНИЕ ТЕКСТА
   ========================================================= */

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}


/* =========================================================
   НОРМАЛИЗАЦИЯ НЕДЕЛЬНОГО ПРОГРЕССА
   Всегда возвращает ровно 7 значений.
   ========================================================= */

function normalizeWeekProgress(progress) {
    const source = Array.isArray(progress)
        ? progress
        : []

    return Array.from(
        {
            length: 7
        },
        (_, index) => Boolean(source[index])
    )
}


/* =========================================================
   РЕНДЕР НЕДЕЛЬНОГО ПРОГРЕССА
   ========================================================= */

function renderWeekProgress(progress) {
    return normalizeWeekProgress(progress)
        .map((isCompleted) => {
            return `
                <span
                    class="
                        habit-card__progress-item
                        ${isCompleted ? "is-completed" : ""}
                    "
                    aria-hidden="true"
                ></span>
            `
        })
        .join("")
}


/* =========================================================
   РЕНДЕР КАРТОЧКИ
   ========================================================= */

export function renderHabitCard(habit = {}) {
    const {
        id = "",
        name = "Без названия",
        icon = "✱",
        color = "green",
        size = "large",
        completedToday = false,
        streak = 0,
        xpReward = 5,
        weekProgress = []
    } = habit

    const safeId = escapeHtml(id)
    const safeName = escapeHtml(name)
    const safeIcon = escapeHtml(icon)

    const normalizedStreak = Math.max(
        0,
        Math.floor(Number(streak) || 0)
    )

    const normalizedXpReward = Math.max(
        0,
        Math.floor(Number(xpReward) || 0)
    )

    const statusText = completedToday
        ? `Выполнено +${normalizedXpReward} XP`
        : "В процессе"

    return `
        <article
            class="
                habit-card
                habit-card--${escapeHtml(color)}
                habit-card--${escapeHtml(size)}
                ${completedToday ? "is-completed" : ""}
            "
            data-habit-id="${safeId}"
        >

            <div
                class="habit-card__icon"
                aria-hidden="true"
            >
                ${safeIcon}
            </div>


            <button
                class="
                    habit-card__check
                    ${completedToday ? "is-completed" : ""}
                "
                type="button"
                data-action="confirm-habit"
                data-habit-id="${safeId}"
                aria-label="${
                    completedToday
                        ? "Привычка выполнена"
                        : "Подтвердить выполнение привычки"
                }"
                aria-pressed="${String(completedToday)}"
            >
                ✓
            </button>


            <div class="habit-card__content">

                <h2 class="habit-card__name">
                    ${safeName}
                </h2>

                <div
                    class="
                        habit-card__description
                        ${completedToday ? "is-completed" : ""}
                    "
                >
                    ${statusText}
                </div>

            </div>


            <div class="habit-card__footer">

                <div
                    class="habit-card__progress"
                    aria-label="Прогресс за неделю"
                >
                    ${renderWeekProgress(weekProgress)}
                </div>

                <div
                    class="habit-card__streak"
                    aria-label="Текущая серия: ${normalizedStreak}"
                >
                    <span
                        class="habit-card__streak-icon"
                        aria-hidden="true"
                    >
                        🔥
                    </span>

                    <span class="habit-card__streak-value">
                        ${normalizedStreak}
                    </span>
                </div>

            </div>

        </article>
    `
}










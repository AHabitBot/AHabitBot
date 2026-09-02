import {
    addPressAnimation
} from "../habitsUtils.js"

import {
    t
} from "../../../i18n/core/i18n.js"

import {
    getPluralForm
} from "../../../i18n/core/plural.js"

import {
    initHabitCalendar,
    renderHabitCalendar
} from "./habitCalendar.js"


/* =========================================================
   HABIT DETAIL PAGE

   Единый модуль детальной страницы привычки.

   Отвечает за:
   - рендер детальной страницы;
   - форматирование дат и значений;
   - управление меню;
   - события страницы;
   - окно подтверждения удаления.

   Календарь подключается отдельным модулем habitCalendar.js.
   ========================================================= */


/* =========================================================
   HABIT DETAILS UTILS

   Вспомогательные функции детальной страницы привычки.
   Здесь нет DOM, событий и рендера страницы.
   ========================================================= */


/* =========================================================
   ЭКРАНИРОВАНИЕ HTML
   ========================================================= */

function escapeHabitDetailsHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}


/* =========================================================
   НОРМАЛИЗАЦИЯ ЧИСЛА
   ========================================================= */

function normalizeHabitDetailsNumber(value) {
    const number = Number(value)

    if (!Number.isFinite(number) || number < 0) {
        return 0
    }

    return Math.floor(number)
}


/* =========================================================
   ФОРМАТИРОВАНИЕ ДНЕЙ
   ========================================================= */

function formatHabitDetailsDays(value) {
    const days =
        normalizeHabitDetailsNumber(value)

    const form =
        getPluralForm(days)

    return t(
        `habits.details.days.${form}`,
        {
            count: days
        }
    )
}


/* =========================================================
   ПОЛУЧЕНИЕ ЛОКАЛЬНОЙ ДАТЫ

   Не используем new Date("2026-07-24"),
   потому что браузер может воспринять такую дату как UTC.
   ========================================================= */

function parseHabitDetailsDate(value) {
    if (value instanceof Date) {
        const copiedDate = new Date(value)

        if (!Number.isNaN(copiedDate.getTime())) {
            return copiedDate
        }

        return null
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

        if (Number.isNaN(fallbackDate.getTime())) {
            return null
        }

        return fallbackDate
    }

    const year = Number(match[1])
    const monthIndex = Number(match[2]) - 1
    const day = Number(match[3])

    const date = new Date(
        year,
        monthIndex,
        day
    )

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== monthIndex ||
        date.getDate() !== day
    ) {
        return null
    }

    return date
}


/* =========================================================
   ДЛИТЕЛЬНОСТЬ ПРИВЫЧКИ

   День создания считается первым днём.
   Используем UTC, чтобы переход летнего времени
   не влиял на количество календарных дней.
   ========================================================= */

function getHabitDuration(createdAt) {
    const createdDate =
        parseHabitDetailsDate(createdAt)

    if (!createdDate) {
        return 1
    }

    const currentDate = new Date()

    const createdDayUtc = Date.UTC(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        createdDate.getDate()
    )

    const currentDayUtc = Date.UTC(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
    )

    const millisecondsPerDay =
        24 * 60 * 60 * 1000

    const difference = Math.floor(
        (
            currentDayUtc -
            createdDayUtc
        ) / millisecondsPerDay
    )

    return Math.max(
        1,
        difference + 1
    )
}
/* =========================================================
   HABIT DETAILS PAGE

   Отвечает только за разметку детальной страницы.
   ========================================================= */

export function renderHabitDetailsPage(habit = {}) {
    const root = document.getElementById(
        "habits-v2-root"
    )

    if (!root) {
        return
    }

    const {
        id = "",
        name = "",
        icon = "✱",
        color = "green",
        completedToday = false,
        streak = 0,
        xpReward = 5,
        createdAt = null,

        completedDates = []
    } = habit

    const safeId =
        escapeHabitDetailsHtml(id)

    const safeName =
        escapeHabitDetailsHtml(
            name || t("habits.details.unnamed")
        )

    const safeIcon =
        escapeHabitDetailsHtml(icon)

    const safeColor =
        escapeHabitDetailsHtml(color)

    const normalizedStreak =
        normalizeHabitDetailsNumber(streak)

    const normalizedXpReward =
        normalizeHabitDetailsNumber(xpReward)

    const duration =
        getHabitDuration(createdAt)

    const statusText = completedToday
        ? t(
            "habits.details.status.completed",
            {
                xp: normalizedXpReward
            }
        )
        : t("habits.details.status.inProgress")

    const calendarHtml =
        renderHabitCalendar({
            completedDates,
            createdAt
        })


    root.innerHTML = `
        <section
            class="
                habit-details
                habit-details--${safeColor}
            "
            data-habit-id="${safeId}"
        >

            <header class="habit-details__header">

<button
    class="habit-details__back-button back-button"
    type="button"
    data-action="close-habit-details"
    aria-label="${t("habits.details.backAria")}"
>
    <span
        class="material-symbols-rounded back-icon"
        aria-hidden="true"
    >
        arrow_back_ios_new
    </span>
</button>

<div class="habit-details__menu-wrapper">

    <button
        class="habit-details__menu-button"
        type="button"
        data-action="toggle-habit-menu"
        aria-label="${t("habits.details.menu.openAria")}"
        aria-expanded="false"
        aria-controls="habit-details-menu"
    >
        ⋯
    </button>

    <div
        id="habit-details-menu"
        class="habit-details__menu"
        role="menu"
        aria-hidden="true"
    >

        <button
            class="habit-details__menu-item"
            type="button"
            data-action="confirm-habit"
            role="menuitem"
        >
            <span
                class="material-symbols-rounded habit-details__menu-icon"
                aria-hidden="true"
            >
                check_circle
            </span>

            <span>
                ${t("habits.details.menu.confirm")}
            </span>
        </button>

        <button
            class="habit-details__menu-item"
            type="button"
            data-action="edit-habit"
            role="menuitem"
        >
            <span
                class="material-symbols-rounded habit-details__menu-icon"
                aria-hidden="true"
            >
                edit
            </span>

            <span>
                ${t("habits.details.menu.edit")}
            </span>
        </button>

        <button
            class="
                habit-details__menu-item
                habit-details__menu-item--danger
            "
            type="button"
            data-action="archive-habit"
            role="menuitem"
        >
            <span
                class="material-symbols-rounded habit-details__menu-icon"
                aria-hidden="true"
            >
                archive
            </span>

            <span>
                ${t("habits.details.menu.archive")}
            </span>
        </button>

    </div>

</div>

            </header>


            <main class="habit-details__content">

                <div
                    class="habit-details__icon"
                    aria-hidden="true"
                >
                    ${safeIcon}
                </div>

                <h1 class="habit-details__title">
                    ${safeName}
                </h1>

                <div class="habit-details__status">
                    ${statusText}
                </div>


                <section
                    class="habit-details__stats"
                    aria-label="${t("habits.details.stats.aria")}"
                >

                    <article class="habit-details__stat">

                        <div class="habit-details__stat-main">

                            <span aria-hidden="true">
                                🔥
                            </span>

                            <span>
                                ${formatHabitDetailsDays(
                                    normalizedStreak
                                )}
                            </span>

                        </div>

                        <div class="habit-details__stat-label">
                            ${t("habits.details.stats.currentStreak")}
                        </div>

                    </article>


                    <article class="habit-details__stat">

                        <div class="habit-details__stat-main">

                            <span aria-hidden="true">
                                ◷
                            </span>

                            <span>
                                ${formatHabitDetailsDays(
                                    duration
                                )}
                            </span>

                        </div>

                        <div class="habit-details__stat-label">
                            ${t("habits.details.stats.duration")}
                        </div>

                    </article>

                </section>


                ${calendarHtml}

            </main>

        </section>
    `
}


/* =========================================================
   HABIT DETAILS MENU

   Управляет выпадающим меню детальной страницы привычки.

   Отвечает за:
   - открытие;
   - закрытие;
   - переключение;
   - закрытие по клику вне меню;
   - закрытие по Escape;
   - очистку обработчиков при закрытии страницы.
   ========================================================= */


/* =========================================================
   ТЕКУЩЕЕ СОСТОЯНИЕ МЕНЮ
   ========================================================= */

let activeMenuState = null


/* =========================================================
   ПОЛУЧИТЬ ЭЛЕМЕНТЫ МЕНЮ
   ========================================================= */

function getHabitDetailsMenuElements(root) {
    if (!root) {
        return {
            menu: null,
            menuButton: null,
            menuWrapper: null
        }
    }

    return {
        menu: root.querySelector(
            ".habit-details__menu"
        ),

        menuButton: root.querySelector(
            '[data-action="toggle-habit-menu"]'
        ),

        menuWrapper: root.querySelector(
            ".habit-details__menu-wrapper"
        )
    }
}


/* =========================================================
   ОТКРЫТЬ МЕНЮ
   ========================================================= */

export function openHabitDetailsMenu(root) {
    const {
        menu,
        menuButton
    } = getHabitDetailsMenuElements(root)

    if (!menu || !menuButton) {
        return
    }

    menu.classList.add("is-open")

    menu.setAttribute(
        "aria-hidden",
        "false"
    )

    menuButton.setAttribute(
        "aria-expanded",
        "true"
    )
}


/* =========================================================
   ЗАКРЫТЬ МЕНЮ
   ========================================================= */

function closeHabitDetailsMenu(root) {
    const {
        menu,
        menuButton
    } = getHabitDetailsMenuElements(root)

    if (!menu || !menuButton) {
        return
    }

    menu.classList.remove("is-open")

    menu.setAttribute(
        "aria-hidden",
        "true"
    )

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    )
}


/* =========================================================
   ПЕРЕКЛЮЧИТЬ МЕНЮ
   ========================================================= */

function toggleHabitDetailsMenu(root) {
    const {
        menu
    } = getHabitDetailsMenuElements(root)

    if (!menu) {
        return
    }

    const isOpen =
        menu.classList.contains("is-open")

    if (isOpen) {
        closeHabitDetailsMenu(root)
        return
    }

    openHabitDetailsMenu(root)
}


/* =========================================================
   УНИЧТОЖИТЬ МЕНЮ

   Удаляет все обработчики, которые были добавлены
   во время инициализации.
   ========================================================= */

function destroyHabitDetailsMenu() {
    if (!activeMenuState) {
        return
    }

    const {
        root,
        menuButton,
        handleMenuButtonClick,
        handleDocumentClick,
        handleDocumentKeydown
    } = activeMenuState

    closeHabitDetailsMenu(root)

    menuButton.removeEventListener(
        "click",
        handleMenuButtonClick
    )

    document.removeEventListener(
        "click",
        handleDocumentClick
    )

    document.removeEventListener(
        "keydown",
        handleDocumentKeydown
    )

    activeMenuState = null
}


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ МЕНЮ
   ========================================================= */

function initHabitDetailsMenu(root) {
    destroyHabitDetailsMenu()

    const {
        menuButton,
        menuWrapper
    } = getHabitDetailsMenuElements(root)

    if (!menuButton || !menuWrapper) {
        return
    }

    const handleMenuButtonClick = (event) => {
        event.stopPropagation()

        toggleHabitDetailsMenu(root)
    }

    const handleDocumentClick = (event) => {
        if (
            !menuWrapper.contains(
                event.target
            )
        ) {
            closeHabitDetailsMenu(root)
        }
    }

    const handleDocumentKeydown = (event) => {
        if (event.key !== "Escape") {
            return
        }

        const menu =
            root.querySelector(
                ".habit-details__menu"
            )

        const isOpen =
            menu?.classList.contains(
                "is-open"
            )

        if (!isOpen) {
            return
        }

        closeHabitDetailsMenu(root)
        menuButton.focus()
    }

    menuButton.addEventListener(
        "click",
        handleMenuButtonClick
    )

    document.addEventListener(
        "click",
        handleDocumentClick
    )

    document.addEventListener(
        "keydown",
        handleDocumentKeydown
    )

    activeMenuState = {
        root,
        menuButton,
        handleMenuButtonClick,
        handleDocumentClick,
        handleDocumentKeydown
    }
}


/* =========================================================
   DELETE HABIT CONFIRMATION

   Модальное окно подтверждения удаления привычки.

   Отвечает только за:
   - показ окна;
   - закрытие окна;
   - подтверждение удаления;
   - отмену удаления.
   ========================================================= */


let activeModal = null
let previousFocusedElement = null
let documentKeydownHandler = null


/* =========================================================
   ПОЛУЧИТЬ КОРНЕВОЙ КОНТЕЙНЕР
   ========================================================= */

function getHabitsRoot() {
    return document.getElementById(
        "habits-v2-root"
    )
}


/* =========================================================
   ЗАКРЫТЬ ОКНО
   ========================================================= */

function closeHabitArchiveConfirm({
    restoreFocus = true
} = {}) {
    if (!activeModal) {
        return
    }

    const modal = activeModal

    modal.classList.remove(
        "is-visible"
    )

    document.body.classList.remove(
        "habit-delete-modal-open"
    )

    if (documentKeydownHandler) {
        document.removeEventListener(
            "keydown",
            documentKeydownHandler
        )

        documentKeydownHandler = null
    }

    window.setTimeout(() => {
        modal.remove()

        if (activeModal === modal) {
            activeModal = null
        }

        if (
            restoreFocus &&
            previousFocusedElement instanceof HTMLElement &&
            document.contains(previousFocusedElement)
        ) {
            previousFocusedElement.focus()
        }

        previousFocusedElement = null
    }, 220)
}


/* =========================================================
   ОТКРЫТЬ ОКНО
   ========================================================= */

export function openHabitArchiveConfirm({
    onArchive = null,
    onKeep = null
} = {}) {
    const root = getHabitsRoot()

    if (!root) {
        console.warn(
            "Habit Archive Confirm: не найден #habits-v2-root"
        )

        return
    }


    /* ---------------------------------------------------------
       УБИРАЕМ ПРЕДЫДУЩЕЕ ОКНО, ЕСЛИ ОНО ОСТАЛОСЬ
       --------------------------------------------------------- */

    closeHabitArchiveConfirm({
        restoreFocus: false
    })


    /* ---------------------------------------------------------
       СОХРАНЯЕМ ТЕКУЩИЙ ФОКУС
       --------------------------------------------------------- */

    previousFocusedElement =
        document.activeElement


    /* ---------------------------------------------------------
       СОЗДАЁМ МОДАЛЬНОЕ ОКНО
       --------------------------------------------------------- */

    const modal = document.createElement(
        "div"
    )

    modal.className =
        "habit-delete-confirm"

    modal.innerHTML = `
        <div
            class="habit-delete-confirm__backdrop"
            data-action="keep-habit"
        ></div>

        <section
            class="habit-delete-confirm__dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="habit-delete-confirm-title"
        >
            <div
                class="habit-delete-confirm__icon"
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">
                    archive
                </span>
            </div>

            <h2
                class="habit-delete-confirm__title"
                id="habit-delete-confirm-title"
            >
                ${t("habits.details.archive.title")}
            </h2>

            <div class="habit-delete-confirm__actions">

                <button
                    class="
                        habit-delete-confirm__button
                        habit-delete-confirm__button--delete
                    "
                    type="button"
                    data-action="confirm-archive-habit"
                >
                    ${t("habits.details.menu.archive")}
                </button>

                <button
                    class="
                        habit-delete-confirm__button
                        habit-delete-confirm__button--keep
                    "
                    type="button"
                    data-action="keep-habit"
                >
                    ${t("habits.details.archive.keep")}
                </button>

            </div>
        </section>
    `

    root.appendChild(
        modal
    )

    activeModal = modal

    document.body.classList.add(
        "habit-delete-modal-open"
    )


    /* ---------------------------------------------------------
       ЭЛЕМЕНТЫ
       --------------------------------------------------------- */

    const dialog = modal.querySelector(
        ".habit-delete-confirm__dialog"
    )

    const archiveButton = modal.querySelector(
        '[data-action="confirm-archive-habit"]'
    )  

    const keepButtons = modal.querySelectorAll(
        '[data-action="keep-habit"]'
    )


    /* ---------------------------------------------------------
       АНИМАЦИИ НАЖАТИЯ
       --------------------------------------------------------- */

    addPressAnimation(archiveButton)

    keepButtons.forEach((button) => {
        addPressAnimation(button)
    })


    /* ---------------------------------------------------------
       ПОДТВЕРДИТЬ УДАЛЕНИЕ
       --------------------------------------------------------- */

    archiveButton?.addEventListener(
        "click",
        () => {
            closeHabitArchiveConfirm({
                restoreFocus: false
            })

            if (typeof onArchive === "function") {
                onArchive()
            }
        }
    )


    /* ---------------------------------------------------------
       ОСТАВИТЬ ПРИВЫЧКУ
       --------------------------------------------------------- */

    keepButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                closeHabitArchiveConfirm()

                if (typeof onKeep === "function") {
                    onKeep()
                }
            }
        )
    })


    /* ---------------------------------------------------------
       НЕ ЗАКРЫВАЕМ ОКНО ПРИ НАЖАТИИ НА САМ ДИАЛОГ
       --------------------------------------------------------- */

    dialog?.addEventListener(
        "click",
        (event) => {
            event.stopPropagation()
        }
    )


    /* ---------------------------------------------------------
       ЗАКРЫТИЕ ЧЕРЕЗ ESCAPE
       --------------------------------------------------------- */

    documentKeydownHandler = (
        event
    ) => {
        if (event.key !== "Escape") {
            return
        }

        event.preventDefault()

        closeHabitArchiveConfirm()

        if (typeof onKeep === "function") {
            onKeep()
        }
    }

    document.addEventListener(
        "keydown",
        documentKeydownHandler
    )


    /* ---------------------------------------------------------
       ПОКАЗЫВАЕМ С АНИМАЦИЕЙ
       --------------------------------------------------------- */

modal.classList.add(
    "is-visible"
)

archiveButton?.focus()
}


/* =========================================================
   HABIT DETAILS EVENTS

   События детальной страницы привычки.

   Отвечает за:
   - возврат к списку привычек;
   - открытие меню;
   - подтверждение привычки;
   - снятие подтверждения привычки;
   - запуск редактирования привычки;
   - запуск удаления привычки.
   ========================================================= */


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ ДЕТАЛЬНОЙ СТРАНИЦЫ
   ========================================================= */

export function initHabitDetailsEvents({
    onBack = null,
    onConfirm = null,
    onEdit = null,
    onArchive = null
} = {}) {
    const root = document.getElementById(
        "habits-v2-root"
    )

    if (!root) {
        console.warn(
            "Habit Details Events: не найден #habits-v2-root"
        )

        return
    }


    /* =========================================================
       ЭЛЕМЕНТЫ СТРАНИЦЫ
       ========================================================= */

    const backButton = root.querySelector(
        '[data-action="close-habit-details"]'
    )

    const menuButton = root.querySelector(
        '[data-action="toggle-habit-menu"]'
    )

    const confirmButton = root.querySelector(
        '[data-action="confirm-habit"]'
    )

    const editButton = root.querySelector(
        '[data-action="edit-habit"]'
    )

    const archiveButton = root.querySelector(
        '[data-action="archive-habit"]'
    )


    /* =========================================================
       АНИМАЦИИ НАЖАТИЯ
       ========================================================= */

    addPressAnimation(backButton)
    addPressAnimation(menuButton)
    addPressAnimation(confirmButton)
    addPressAnimation(editButton)
    addPressAnimation(archiveButton)


    /* =========================================================
       ИНИЦИАЛИЗАЦИЯ МЕНЮ
       ========================================================= */

    initHabitDetailsMenu(root)
    initHabitCalendar(root)


    /* =========================================================
       ВОЗВРАТ К СПИСКУ
       ========================================================= */

    backButton?.addEventListener(
        "click",
        () => {
            destroyHabitDetailsMenu()

            if (typeof onBack !== "function") {
                console.warn(
                    "Habit Details Events: не передан onBack"
                )

                return
            }

            onBack()
        }
    )


    /* =========================================================
       ПОДТВЕРЖДЕНИЕ / СНЯТИЕ ПОДТВЕРЖДЕНИЯ
       ========================================================= */

    confirmButton?.addEventListener(
        "click",
        (event) => {
            event.preventDefault()
            event.stopPropagation()

            if (typeof onConfirm !== "function") {
                console.warn(
                    "Habit Details Events: не передан onConfirm"
                )

                return
            }

            onConfirm({
                keepMenuOpen: true
            })
        }
    )


    /* =========================================================
       РЕДАКТИРОВАНИЕ ПРИВЫЧКИ
       ========================================================= */

    editButton?.addEventListener(
        "click",
        (event) => {
            event.preventDefault()
            event.stopPropagation()

            destroyHabitDetailsMenu()

            if (typeof onEdit !== "function") {
                console.warn(
                    "Habit Details Events: не передан onEdit"
                )

                return
            }

            onEdit()
        }
    )


    /* =========================================================
       УДАЛЕНИЕ ПРИВЫЧКИ

       Здесь привычку не удаляем.
       Только передаём действие внешнему контроллеру.
       ========================================================= */

    archiveButton?.addEventListener(
        "click",
        (event) => {
            event.preventDefault()
            event.stopPropagation()

            destroyHabitDetailsMenu()

            if (typeof onArchive !== "function") {
                console.warn(
                    "Habit Details Events: не передан onArchive"
                )

                return
            }

            onArchive()
        }
    )
}

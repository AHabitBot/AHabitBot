/* =========================================================
   HABITS MAIN

   Главный контроллер раздела привычек.

   Отвечает за:
   - первоначальный запуск раздела;
   - выбор главного экрана;
   - рендер пустого состояния или списка;
   - открытие страницы создания привычки;
   - повторную инициализацию открытых экранов;
   - подключение событий главной страниц
   ========================================================= */


/* 1. Импорты */
import { renderHabitsEmpty } from "./habitMainEmpty/habitsEmpty.js"
import { renderHabitsList } from "./habitMainList/habitsListPage.js"

import {
    openAddHabitPage,
    restoreDraftToAddHabitPage,
    initAddHabitPageEvents,
    initIconPickerEvents
} from "./habitMainEmpty/addHabitPage.js"

import {
    initHabitsListEvents,
    initOpenedHabitDetailsEvents
} from "./habitMainList/habitsListEvents.js"

import {
    addHabit,
    getHabits,
    getHabitsStatistics,
    setHabits,
    setHabitsStatistics
} from "./habitsStore.js"

import {
    addPressAnimation,
    normalizeHabit
} from "./habitsUtils.js"

import {
    fetchHabits
} from "./habitsApi.js"


/* =========================================================
   ПОЛУЧИТЬ КОРНЕВОЙ КОНТЕЙНЕР
   ========================================================= */

function getHabitsRoot() {
    return document.getElementById(
        "habits-v2-root"
    )
}


/* =========================================================
   РЕНДЕР ГЛАВНОЙ СТРАНИЦЫ

   preserveScroll:
   true  — восстановить положение списка;
   false — открыть страницу с начала.

   scrollTop:
   явное положение прокрутки, переданное из
   habitsListEvents.js после подтверждения привычки.
   ========================================================= */

export function renderHabitsPage(
    habits = [],
    statistics = {}
) {
    const root = document.getElementById(
        "habits-v2-root"
    )

    if (!root) {
        console.error(
            "V2: не найден #habits-v2-root"
        )

        return
    }

    if (!Array.isArray(habits)) {
        console.error(
            "V2: renderHabitsPage ожидал массив привычек"
        )

        root.innerHTML = renderHabitsEmpty()
        return
    }

    root.innerHTML =
        habits.length === 0
            ? renderHabitsEmpty()
            : renderHabitsList(
                habits,
                statistics
            )
}











/* =========================================================
   ОТКРЫТЬ ГЛАВНУЮ СТРАНИЦУ ИЗ STORE

   Используется для внутренней навигации:
   - возврат из деталей;
   - возврат после редактирования;
   - возврат после создания;
   - возврат после архивирования.

   Повторный GET не выполняется.
   ========================================================= */

export function openHabitsPageFromStore({
    preserveScroll = false,
    scrollTop = null
} = {}) {
    const savedScrollTop =
        scrollTop !== null
            ? Math.max(
                0,
                Number(scrollTop) || 0
            )
            : 0

    renderHabitsPage(
        getHabits(),
        getHabitsStatistics()
    )

    initHabitsPageEvents()

    if (!preserveScroll) {
        return
    }

    const renderedList =
        document.querySelector(
            ".habits-v2-list"
        )

    if (!renderedList) {
        return
    }

    requestAnimationFrame(() => {
        renderedList.scrollTop =
            savedScrollTop
    })
}


/* =========================================================
   ОТКРЫТЬ ГЛАВНУЮ СТРАНИЦУ С ЗАГРУЗКОЙ API

   Используется при:
   - первом входе в раздел;
   - повторном входе в Mini App;
   - будущем ручном обновлении данных.
   ========================================================= */

async function openHabitsPage({
    preserveScroll = false,
    scrollTop = null
} = {}) {
    try {
        const {
            habits,
            statistics
        } = await fetchHabits()

        const normalizedHabits =
            habits.map(normalizeHabit)

        setHabits(normalizedHabits)

        setHabitsStatistics({
            currentStreak:
                Number(
                    statistics.current_streak
                ) || 0,

            maxStreak:
                Number(
                    statistics.max_streak
                ) || 0,

            totalConfirmations:
                Number(
                    statistics.total_confirmations
                ) || 0,

            totalXp:
                Number(
                    statistics.total_xp
                ) || 0
        })
    } catch (error) {
        console.error(
            "Не удалось загрузить привычки:",
            error
        )
    }

    openHabitsPageFromStore({
        preserveScroll,
        scrollTop
    })
}


/* =========================================================
   ОТКРЫТЬ НОВУЮ СТРАНИЦУ СОЗДАНИЯ

   resetDraft: true означает, что пользователь начинает
   создание новой привычки, а не возвращается из Emoji Picker.
   ========================================================= */

function openNewHabitPage() {
    openAddHabitPage({
        resetDraft: true,

        onOpenHabitsPage:
            openHabitsPageFromStore,

        onHabitSaved: (
            savedHabit,
            {
                wasEditing = false
            } = {}
        ) => {
            if (
                !savedHabit ||
                wasEditing
            ) {
                openHabitsPageFromStore()
                return
            }

            const normalizedHabit =
                normalizeHabit(
                    savedHabit
                )

            const addedHabit =
                addHabit(
                    normalizedHabit
                )

            if (!addedHabit) {
                console.warn(
                    "Habits Main: созданная привычка не добавлена в Store"
                )
            }

            openHabitsPageFromStore()
        }
    })
}

/* =========================================================
   ВЕРНУТЬСЯ ИЗ EMOJI PICKER В СОЗДАНИЕ

   Черновик не сбрасываем, чтобы сохранить:
   - название;
   - цвет;
   - размер;
   - ранее подтверждённую иконку.
   ========================================================= */

function openAddHabitPageFromIconPicker() {
    openAddHabitPage({
        resetDraft: false,

        onOpenHabitsPage:
            openHabitsPageFromStore
    })
}

/* =========================================================
   СОБЫТИЯ ГЛАВНОЙ СТРАНИЦЫ

   Работает и для:
   - пустой страницы;
   - страницы со списком привычек.
   ========================================================= */

function initHabitsPageEvents() {
    const root = getHabitsRoot()

    if (!root) {
        console.warn(
            "Habits Events: не найден #habits-v2-root"
        )

        return
    }


    /* ---------------------------------------------------------
       КНОПКИ ДОБАВЛЕНИЯ ПРИВЫЧКИ
       --------------------------------------------------------- */

    const addButtons = root.querySelectorAll(
        '[data-action="open-add-habit"]'
    )

    addButtons.forEach((button) => {
        addPressAnimation(button)

        button.addEventListener(
            "click",
            openNewHabitPage
        )
    })


    /* ---------------------------------------------------------
       СОБЫТИЯ СПИСКА И КАРТОЧЕК

       Если на странице пустое состояние и списка нет,
       initHabitsListEvents просто завершит работу.
       --------------------------------------------------------- */

    initHabitsListEvents({
        onOpenHabitsPage:
            openHabitsPageFromStore
    })
}


/* =========================================================
   ОБЩАЯ ИНИЦИАЛИЗАЦИЯ РАЗДЕЛА
   ========================================================= */

export function initHabitsEvents({
    useStore = false
} = {}) {
    const root = getHabitsRoot()

    if (!root) {
        console.warn(
            "Habits Events: не найден #habits-v2-root"
        )

        return
    }


    /* ---------------------------------------------------------
       УЖЕ ОТКРЫТА СТРАНИЦА ДЕТАЛЕЙ
       --------------------------------------------------------- */

    const habitDetailsPage = root.querySelector(
        ".habit-details"
    )

    if (habitDetailsPage) {
        initOpenedHabitDetailsEvents({
            onOpenHabitsPage:
                openHabitsPageFromStore
        })

        return
    }


    /* ---------------------------------------------------------
       УЖЕ ОТКРЫТ ВЫБОР ЭМОДЗИ

       Эта проверка нужна, чтобы повторный вызов
       initHabitsEvents не закрыл Emoji Picker.
       --------------------------------------------------------- */

    const iconPickerPage = root.querySelector(
        ".habit-icon-picker"
    )

    if (iconPickerPage) {
        initIconPickerEvents({
            onBackToAddHabitPage:
                openAddHabitPageFromIconPicker
        })

        return
    }


    /* ---------------------------------------------------------
       УЖЕ ОТКРЫТА СТРАНИЦА СОЗДАНИЯ
       --------------------------------------------------------- */

    const addHabitPage = root.querySelector(
        ".add-habit-v2"
    )

    if (addHabitPage) {
        restoreDraftToAddHabitPage()

        initAddHabitPageEvents({
            onOpenHabitsPage:
                openHabitsPageFromStore
        })

        return
    }


    /* ---------------------------------------------------------
       ГЛАВНАЯ СТРАНИЦА

       renderHabitsPage самостоятельно определит:
       - показать пустую страницу;
       - показать список привычек.
       --------------------------------------------------------- */

    if (useStore) {
        openHabitsPageFromStore()
        return
    }

    openHabitsPage()
}












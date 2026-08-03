/* =========================================================
   HABITS MAIN

   Главный контроллер раздела привычек.

   Отвечает за:
   - первоначальный запуск раздела;
   - выбор главного экрана;
   - рендер пустого состояния или списка;
   - открытие страницы создания привычки;
   - повторную инициализацию открытых экранов;
   - подключение событий главной страницы.

   Структура раздела:

   habitMainEmpty/
   - addHabitPage.js
   - habitsDraft.js
   - habitsEmpty.js

   habitMainList/
   - habitsListPage.js
   - habitsListEvents.js

   viewHabitDetails/
   - habitDetailPage.js
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
    getHabits,
    getHabitsStatistics,
    setHabits,
    setHabitsStatistics
} from "./habitsStore.js"


import {
    addPressAnimation
} from "./habitsUtils.js"

import { fetchHabits } from "./habitsApi.js"







function normalizeHabit(habit = {}) {
    return {
        id: String(habit.id),

        name:
            habit.title ||
            "Без названия",

        icon:
            habit.emoji ||
            "✱",

        color:
            habit.color ||
            "green",

        size:
            habit.size ||
            "large",

        xpReward:
            Number(habit.xp_reward) || 5,

        createdAt:
            habit.created_at ||
            null,

        completedToday:
            Boolean(habit.completed_today),

        streak:
            Number(habit.streak) || 0,

        weekProgress:
            Array.isArray(habit.week_progress)
                ? habit.week_progress
                : [],

        completedDates:
            Array.isArray(habit.completed_dates)
                ? habit.completed_dates
                : []
    }
}


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











async function openHabitsPage({
    preserveScroll = false,
    scrollTop = null
} = {}) {
    const currentList = document.querySelector(
        ".habits-v2-list"
    )

    const savedScrollTop =
        scrollTop !== null
            ? Math.max(
                0,
                Number(scrollTop) || 0
            )
            : preserveScroll
                ? currentList?.scrollTop || 0
                : 0

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
   ОТКРЫТЬ НОВУЮ СТРАНИЦУ СОЗДАНИЯ

   resetDraft: true означает, что пользователь начинает
   создание новой привычки, а не возвращается из Emoji Picker.
   ========================================================= */

function openNewHabitPage() {
    openAddHabitPage({
        resetDraft: true,
        onOpenHabitsPage: openHabitsPage
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
        onOpenHabitsPage: openHabitsPage
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
            openHabitsPage
    })
}


/* =========================================================
   ОБЩАЯ ИНИЦИАЛИЗАЦИЯ РАЗДЕЛА
   ========================================================= */

export function initHabitsEvents() {
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
                openHabitsPage
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
                openHabitsPage
        })

        return
    }


    /* ---------------------------------------------------------
       ГЛАВНАЯ СТРАНИЦА

       renderHabitsPage самостоятельно определит:
       - показать пустую страницу;
       - показать список привычек.
       --------------------------------------------------------- */

    openHabitsPage()
}












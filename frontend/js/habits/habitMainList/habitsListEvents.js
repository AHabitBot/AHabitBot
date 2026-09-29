/* =========================================================
   HABITS LIST EVENTS

   Логика страницы со списком привычек.

   Отвечает за:
   - события карточек;
   - открытие деталей привычки;
   - подтверждение выполнения;
   - снятие подтверждения;
   - изменение XP;
   - изменение текущей серии;
   - обновление недельного прогресса;
   - обновление календаря детальной страницы;
   - сохранение позиции прокрутки;
   - возврат из деталей к списку.
   ========================================================= */


/* =========================================================
   СТРАНИЦА ДЕТАЛЕЙ
   ========================================================= */

import {
    renderHabitDetailsPage,
    initHabitDetailsEvents,
    openHabitDetailsMenu,
    openHabitArchiveConfirm
} from "../viewHabitDetails/habitDetailPage.js"


/* =========================================================
   СТРАНИЦА РЕДАКТИРОВАНИЯ
   ========================================================= */

import {
    openAddHabitPage
} from "../habitMainEmpty/addHabitPage.js"

import {
    startHabitEditDraft
} from "../habitMainEmpty/habitsDraft.js"

import {
    archiveHabitApi,
    setHabitConfirmation
} from "../habitsApi.js"

/* =========================================================
   STORE
   ========================================================= */

import {
    getHabitById,
    getHabitsStatistics,
    updateHabit,
    removeHabit,
    selectHabit,
    getSelectedHabit,
    setHabitsStatistics
} from "../habitsStore.js"

/* =========================================================
   ОБЩИЕ УТИЛИТЫ
   ========================================================= */

import {
    addPressAnimation
} from "../habitsUtils.js"

import {
    removeBottomNavigation
} from "../../navigation.js"

import {
    renderHabitsStats
} from "./habitsListPage.js"


import {
    t
} from "../../../i18n/core/i18n.js"

/* =========================================================
   СОХРАНЁННАЯ ПОЗИЦИЯ СПИСКА

   Перед открытием подробной страницы запоминаем,
   где находился пользователь.
   ========================================================= */

let habitsListScrollTop = 0

const pendingHabitConfirmations =
    new Set()

/* =========================================================
   ПОЛУЧИТЬ КОРНЕВОЙ КОНТЕЙНЕР
   ========================================================= */

function getHabitsRoot() {
    return document.getElementById(
        "habits-v2-root"
    )
}


/* =========================================================
   ПОЛУЧИТЬ СПИСОК ПРИВЫЧЕК
   ========================================================= */

function getHabitsListElement() {
    return document.querySelector(
        ".habits-v2-list"
    )
}


/* =========================================================
   НОРМАЛИЗАЦИЯ ПОЛОЖИТЕЛЬНОГО ЦЕЛОГО ЧИСЛА
   ========================================================= */

function normalizePositiveInteger(
    value,
    fallback = 0
) {
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue)) {
        return fallback
    }

    return Math.max(
        0,
        Math.floor(numericValue)
    )
}


/* =========================================================
   НОРМАЛИЗАЦИЯ НЕДЕЛЬНОГО ПРОГРЕССА

   Всегда возвращает массив из семи значений.
   ========================================================= */

function normalizeWeekProgress(
    weekProgress
) {
    return Array.from(
        {
            length: 7
        },
        (_, index) => {
            return Boolean(
                weekProgress?.[index]
            )
        }
    )
}

/* =========================================================
   ОБНОВИТЬ ВИЗУАЛЬНУЮ СТАТИСТИКУ

   Перерисовывает только блок:
   - текущая серия;
   - максимальная серия.

   Полный список и карточки не перерисовываются.
   Повторный GET не выполняется.
   ========================================================= */

function refreshHabitsStatsVisual() {
    const currentStatsElement =
        document.querySelector(
            ".habits-stats"
        )

    if (!currentStatsElement) {
        return
    }

    currentStatsElement.outerHTML =
        renderHabitsStats(
            getHabitsStatistics()
        )
}


/* =========================================================
   ПЕРЕКЛЮЧИТЬ ПОДТВЕРЖДЕНИЕ ПРИВЫЧКИ

   Первое нажатие:
   - completedToday становится true;
   - добавляется XP;
   - серия увеличивается;
   - сегодняшний день отмечается;
   - записывается completedAt.

   Повторное нажатие:
   - completedToday становится false;
   - XP возвращается;
   - серия уменьшается;
   - отметка сегодняшнего дня снимается;
   - completedAt очищается.
   ========================================================= */

export async function toggleHabitConfirmation(
    habitId
) {
    const habit = getHabitById(
        habitId
    )

    if (!habit) {
        console.warn(
            `Привычка "${habitId}" не найдена`
        )

        return null
    }

    if (
        pendingHabitConfirmations.has(
            habitId
        )
    ) {
        return null
    }

    pendingHabitConfirmations.add(
        habitId
    )

    try {
        const desiredState =
            !Boolean(
                habit.completedToday
            )

        const response =
            await setHabitConfirmation(
                habitId,
                desiredState
            )

        const serverHabit =
            response.habit

        const completedToday =
            Boolean(
                serverHabit.completed_today
            )

        const completedDates =
            Array.isArray(
                serverHabit.completed_dates
            )
                ? serverHabit.completed_dates
                : []

        const streak =
            normalizePositiveInteger(
                serverHabit.streak
            )

        const weekProgress =
            normalizeWeekProgress(
                serverHabit.week_progress
            )

        const updatedHabit =
            updateHabit(
                habitId,
                {
                    completedToday,
                    completedDates,
                    streak,
                    weekProgress,

                    completedAt:
                        completedToday
                            ? new Date()
                                .toISOString()
                            : null
                }
            )

        setHabitsStatistics({
            currentStreak:
                normalizePositiveInteger(
                    response.statistics
                        ?.current_streak
                ),

            maxStreak:
                normalizePositiveInteger(
                    response.statistics
                        ?.max_streak
                )
        })

        refreshHabitsStatsVisual()

        return updatedHabit

    } catch (error) {
        console.error(
            "Ошибка подтверждения привычки:",
            error
        )

        return null
    } finally {
        pendingHabitConfirmations.delete(
            habitId
        )
    }
}

/* =========================================================
   СОХРАНИТЬ ПОЗИЦИЮ СПИСКА
   ========================================================= */

function saveHabitsListScroll() {
    const habitsList =
        getHabitsListElement()

    habitsListScrollTop =
        habitsList?.scrollTop || 0
}


/* =========================================================
   ВОССТАНОВИТЬ ПОЗИЦИЮ СПИСКА
   ========================================================= */

export function restoreHabitsListScroll() {
    const habitsList =
        getHabitsListElement()

    if (!habitsList) {
        return
    }

    requestAnimationFrame(() => {
        habitsList.scrollTop =
            habitsListScrollTop
    })
}


/* =========================================================
   ВОЗВРАТ ИЗ ДЕТАЛЕЙ

   onOpenHabitsPage должен:
   - заново отрисовать главную страницу;
   - подключить события главной страницы.
   ========================================================= */

function handleHabitDetailsBack(
    onOpenHabitsPage
) {
    if (
        typeof onOpenHabitsPage !==
        "function"
    ) {
        console.warn(
            "Habits List Events: не передан onOpenHabitsPage"
        )

        return
    }

    onOpenHabitsPage({
        preserveScroll: true,
        scrollTop:
            habitsListScrollTop
    })
}


/* =========================================================
   ОТКРЫТЬ РЕДАКТИРОВАНИЕ ПРИВЫЧКИ

   Перед открытием формы:
   - получаем актуальную привычку из Store;
   - переносим редактируемые поля в черновик;
   - открываем Add Habit Page в режиме редактирования.

   При отмене:
   - возвращаемся в детали без изменений.

   После сохранения:
   - получаем обновлённую привычку из Store;
   - заново рисуем детальную страницу;
   - подключаем события.
   ========================================================= */

function openHabitEditPage(
    habitId,
    {
        onOpenHabitsPage = null
    } = {}
) {
    const habit = getHabitById(
        habitId
    )

    if (!habit) {
        console.warn(
            `Habits List Events: невозможно редактировать привычку "${habitId}"`
        )

        return
    }


    /* ---------------------------------------------------------
       ЗАПОЛНЯЕМ ЧЕРНОВИК ДАННЫМИ ПРИВЫЧКИ
       --------------------------------------------------------- */

    const editDraft =
        startHabitEditDraft(
            habit
        )

    if (!editDraft) {
        console.warn(
            `Habits List Events: не удалось создать черновик редактирования "${habitId}"`
        )

        return
    }


    /* ---------------------------------------------------------
       ОТКРЫВАЕМ ФОРМУ РЕДАКТИРОВАНИЯ
       --------------------------------------------------------- */

    openAddHabitPage({
        resetDraft: false,

        onOpenHabitsPage,

        onCancel: () => {
            refreshHabitDetails(
                habitId,
                {
                    onOpenHabitsPage
                }
            )
        },

        onHabitSaved: (
            savedHabit
        ) => {
            const savedHabitId =
                savedHabit?.id ||
                habitId

            refreshHabitDetails(
                savedHabitId,
                {
                    onOpenHabitsPage
                }
            )
        }
    })
}


/* =========================================================
   АРХИВИРОВАТЬ ПРИВЫЧКУ ИЗ ДЕТАЛЬНОЙ СТРАНИЦЫ
   ========================================================= */

async function handleHabitDetailsArchive(
    habitId,
    {
        onOpenHabitsPage = null
    } = {}
) {
    const habit = getHabitById(
        habitId
    )

    if (!habit) {
        console.warn(
            `Habits List Events: невозможно архивировать привычку "${habitId}"`
        )

        return null
    }

    try {
        await archiveHabitApi(
            habitId
        )
    } catch (error) {
        console.error(
            "Ошибка архивирования привычки:",
            error
        )

        return null
    }

    /*
     * Backend уже пометил привычку как архивную.
     * Теперь убираем её из активного Store,
     * чтобы карточка исчезла с главной страницы.
     */

    const archivedHabit = removeHabit(
        habitId
    )

    if (!archivedHabit) {
        console.warn(
            `Habits List Events: не удалось убрать архивированную привычку "${habitId}" из Store`
        )

        return null
    }

    if (
        typeof onOpenHabitsPage !==
        "function"
    ) {
        console.warn(
            "Habits List Events: привычка архивирована, но не передан onOpenHabitsPage"
        )

        return archivedHabit
    }

    onOpenHabitsPage()

    return archivedHabit
}


/* =========================================================
   ПОДКЛЮЧИТЬ СОБЫТИЯ ДЕТАЛЬНОЙ СТРАНИЦЫ

   Используется:
   - после первого открытия;
   - после подтверждения;
   - после снятия подтверждения;
   - после редактирования;
   - после повторного рендера страницы.
   ========================================================= */

function initCurrentHabitDetailsEvents(
    habitId,
    {
        onOpenHabitsPage = null
    } = {}
) {
    initHabitDetailsEvents({
        onBack: () => {
            handleHabitDetailsBack(
                onOpenHabitsPage
            )
        },

        onConfirm: ({
            keepMenuOpen = false
        } = {}) => {
            handleHabitDetailsConfirmation(
                habitId,
                {
                    onOpenHabitsPage,
                    keepMenuOpen
                }
            )
        },

        onEdit: () => {
            openHabitEditPage(
                habitId,
                {
                    onOpenHabitsPage
                }
            )
        },

        onArchive: () => {
            openHabitArchiveConfirm({
                onArchive: async () => {
                    await handleHabitDetailsArchive(
                        habitId,
                        {
                            onOpenHabitsPage
                        }
                    )
                },

                onKeep: () => {
                    refreshHabitDetails(
                        habitId,
                        {
                            onOpenHabitsPage
                        }
                    )
                }
            })
        }
    })
}

/* =========================================================
   ПЕРЕРИСОВАТЬ ДЕТАЛЬНУЮ СТРАНИЦУ

   После изменения Store:
   - получает свежую привычку;
   - заново рисует детали;
   - заново подключает события;
   - при необходимости заново открывает меню.
   ========================================================= */

function refreshHabitDetails(
    habitId,
    {
        onOpenHabitsPage = null,
        keepMenuOpen = false
    } = {}
) {
    const updatedHabit = getHabitById(
        habitId
    )

    if (!updatedHabit) {
        console.warn(
            `Habits List Events: невозможно обновить детали привычки "${habitId}"`
        )

        return
    }

    renderHabitDetailsPage(
        updatedHabit
    )

    initCurrentHabitDetailsEvents(
        habitId,
        {
            onOpenHabitsPage
        }
    )


    /* ---------------------------------------------------------
       ВОЗВРАЩАЕМ МЕНЮ В ОТКРЫТОЕ СОСТОЯНИЕ

       renderHabitDetailsPage заменяет старый DOM,
       поэтому открываем уже новое меню.
       --------------------------------------------------------- */

    if (keepMenuOpen) {
        const root = getHabitsRoot()

        requestAnimationFrame(() => {
            openHabitDetailsMenu(root)
        })
    }
}
/* =========================================================
   ПОДТВЕРЖДЕНИЕ ИЗ ДЕТАЛЬНОЙ СТРАНИЦЫ

   Использует ту же функцию подтверждения,
   которая используется в карточке списка.
   ========================================================= */

/* =========================================================
   ПОДТВЕРЖДЕНИЕ ИЗ ДЕТАЛЬНОЙ СТРАНИЦЫ

   Использует ту же функцию подтверждения,
   которая используется в карточке списка.

   После обновления меню остаётся открытым.
   ========================================================= */

async function handleHabitDetailsConfirmation(
    habitId,
    {
        onOpenHabitsPage = null,
        keepMenuOpen = false
    } = {}
) {
    const updatedHabit =
        await toggleHabitConfirmation(
            habitId
        )

    if (!updatedHabit) {
        return
    }

    refreshHabitDetails(
        habitId,
        {
            onOpenHabitsPage,
            keepMenuOpen
        }
    )
}


/* =========================================================
   ОТКРЫТЬ ДЕТАЛИ ПРИВЫЧКИ
   ========================================================= */

export function openHabitDetails(
    habitId,
    {
        onOpenHabitsPage = null
    } = {}
) {
    /*
     * Детальная страница — внутренний экран привычек.
     * Убираем одновременно и navigation, и связанный
     * с ней глобальный fade.
     */
    removeBottomNavigation()

    const selectedHabit = selectHabit(
        habitId
    )

    if (!selectedHabit) {
        console.warn(
            `Habits List Events: невозможно открыть привычку "${habitId}"`
        )

        return
    }

    saveHabitsListScroll()

    renderHabitDetailsPage(
        selectedHabit
    )

    initCurrentHabitDetailsEvents(
        habitId,
        {
            onOpenHabitsPage
        }
    )
}


/* =========================================================
   ПОВТОРНАЯ ИНИЦИАЛИЗАЦИЯ ОТКРЫТОЙ СТРАНИЦЫ ДЕТАЛЕЙ

   Используется, если общий initHabitsEvents был вызван,
   когда страница деталей уже находится в DOM.
   ========================================================= */

export function initOpenedHabitDetailsEvents({
    onOpenHabitsPage = null
} = {}) {
    const root = getHabitsRoot()

    if (!root) {
        return
    }

    const habitDetailsPage = root.querySelector(
        ".habit-details"
    )

    if (!habitDetailsPage) {
        return
    }

    const habitId =
        habitDetailsPage.dataset.habitId ||
        getSelectedHabit()?.id

    if (!habitId) {
        console.warn(
            "Habits List Events: у открытой страницы деталей отсутствует habitId"
        )

        return
    }

    initCurrentHabitDetailsEvents(
        habitId,
        {
            onOpenHabitsPage
        }
    )
}


/* =========================================================
   ОСТАНОВИТЬ СОБЫТИЕ КНОПКИ ПОДТВЕРЖДЕНИЯ

   Не позволяет нажатию на галочку открыть карточку.
   ========================================================= */

function stopConfirmEvent(event) {
    event.stopPropagation()
}


function updateHabitCardVisualState(
    card,
    habit
) {
    if (!card || !habit) {
        return
    }

    const completedToday =
        Boolean(habit.completedToday)

    const streak =
        normalizePositiveInteger(
            habit.streak
        )

    const confirmButton = card.querySelector(
        '[data-action="confirm-habit"]'
    )

    const description = card.querySelector(
        ".habit-card__description"
    )

    const progressItems = card.querySelectorAll(
        ".habit-card__progress-item"
    )

    const streakContainer = card.querySelector(
        ".habit-card__streak"
    )

    const streakValue = card.querySelector(
        ".habit-card__streak-value"
    )

    const xpReward =
        normalizePositiveInteger(
            habit.xpReward,
            5
        )

    card.classList.toggle(
        "is-completed",
        completedToday
    )

    confirmButton?.classList.toggle(
        "is-completed",
        completedToday
    )

    confirmButton?.setAttribute(
        "aria-pressed",
        String(completedToday)
    )

    confirmButton?.setAttribute(
        "aria-label",
        completedToday
            ? t("habits.list.card.confirm.completedAria")
            : t("habits.list.card.confirm.actionAria")
    )

    if (description) {
        description.classList.toggle(
            "is-completed",
            completedToday
        )

        description.textContent = formatRepeatRule(habit)
    }

    progressItems.forEach(
        (
            progressItem,
            index
        ) => {
            progressItem.classList.toggle(
                "is-completed",
                Boolean(
                    habit.weekProgress?.[
                        index
                    ]
                )
            )
        }
    )

    if (streakValue) {
        streakValue.textContent =
            String(streak)
    }

    streakContainer?.setAttribute(
        "aria-label",
        t(
            "habits.list.card.currentStreakAria",
            {
                count: streak
            }
        )
    )
}


/* =========================================================
   АНИМАЦИЯ ПОДТВЕРЖДЕНИЯ НА КАРТОЧКЕ
   ========================================================= */

const CONFIRMATION_SPIN_MIN_MS = 450
const REWARD_ANIMATION_MS = 650

function wait(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms)
    })
}

function startConfirmationLoading(button) {
    if (!button) return

    button.classList.add("is-confirming")
    button.setAttribute("aria-busy", "true")
}

function stopConfirmationLoading(button) {
    if (!button) return

    button.classList.remove("is-confirming")
    button.removeAttribute("aria-busy")
}

function showXpReward(card, amount) {
    const xpAmount = normalizePositiveInteger(amount)

    if (!card || xpAmount <= 0) return

    card.querySelector(".habit-card__xp-reward")?.remove()

    const reward = document.createElement("span")
    reward.className = "habit-card__xp-reward"
    reward.textContent = `+${xpAmount} XP`
    reward.setAttribute("aria-hidden", "true")

    card.appendChild(reward)

    window.setTimeout(() => {
        reward.remove()
    }, REWARD_ANIMATION_MS)
}

function animateHabitReward(card, previousHabit, finalHabit, response) {
    if (!card || !finalHabit) return

    const previousProgress = normalizeWeekProgress(previousHabit?.weekProgress)
    const finalProgress = normalizeWeekProgress(finalHabit.weekProgress)
    const progressItems = card.querySelectorAll(".habit-card__progress-item")

    progressItems.forEach((item, index) => {
        if (!previousProgress[index] && finalProgress[index]) {
            item.classList.remove("is-rewarded")
            void item.offsetWidth
            item.classList.add("is-rewarded")
        }
    })

    const previousStreak = normalizePositiveInteger(previousHabit?.streak)
    const finalStreak = normalizePositiveInteger(finalHabit.streak)
    const streak = card.querySelector(".habit-card__streak")

    if (streak && previousStreak !== finalStreak) {
        streak.classList.remove("is-updated")
        void streak.offsetWidth
        streak.classList.add("is-updated")

        window.setTimeout(() => {
            streak.classList.remove("is-updated")
        }, REWARD_ANIMATION_MS)
    }

    const stateChanged = Boolean(response?.confirmation_state_changed)
    const xpAwarded = Boolean(response?.habit?.xp_awarded_today)
    const xpAmount = response?.habit?.xp_amount_today

    if (stateChanged && finalHabit.completedToday && xpAwarded) {
        showXpReward(card, xpAmount)
    }
}


/* =========================================================
   СОБЫТИЯ ОДНОЙ КАРТОЧКИ
   ========================================================= */

function initSingleHabitCardEvents(
    card,
    {
        onOpenHabitsPage = null
    } = {}
) {
    const habitId =
        card.dataset.habitId

    if (!habitId) {
        return
    }

    const confirmButton = card.querySelector(
        '[data-action="confirm-habit"]'
    )


    /* ---------------------------------------------------------
       АНИМАЦИЯ НАЖАТИЯ
       --------------------------------------------------------- */

    addPressAnimation(card)
    addPressAnimation(confirmButton)


    /* ---------------------------------------------------------
       НЕ ДАЁМ ГАЛОЧКЕ ОТКРЫТЬ КАРТОЧКУ
       --------------------------------------------------------- */

    confirmButton?.addEventListener(
        "pointerdown",
        stopConfirmEvent
    )

    confirmButton?.addEventListener(
        "pointerup",
        stopConfirmEvent
    )

    confirmButton?.addEventListener(
        "touchstart",
        stopConfirmEvent,
        {
            passive: true
        }
    )

    confirmButton?.addEventListener(
        "touchend",
        stopConfirmEvent,
        {
            passive: true
        }
    )


    /* ---------------------------------------------------------
       ОТКРЫТИЕ ДЕТАЛЕЙ ПРИВЫЧКИ
       --------------------------------------------------------- */

    card.addEventListener(
        "click",
        (event) => {
            const clickedConfirmButton =
                event.target.closest(
                    '[data-action="confirm-habit"]'
                )

            if (clickedConfirmButton) {
                return
            }

            openHabitDetails(
                habitId,
                {
                    onOpenHabitsPage
                }
            )
        }
    )


    /* ---------------------------------------------------------
       ПОДТВЕРЖДЕНИЕ ПРИВЫЧКИ В СПИСКЕ
       --------------------------------------------------------- */

confirmButton?.addEventListener(
    "click",
    async (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (pendingHabitConfirmations.has(habitId)) {
            return
        }

        const habit = getHabitById(habitId)

        if (!habit) {
            return
        }

        pendingHabitConfirmations.add(habitId)
        confirmButton.disabled = true

        const previousHabit = {
            ...habit,
            weekProgress: normalizeWeekProgress(habit.weekProgress)
        }

        const desiredState = !Boolean(habit.completedToday)
        const loadingStartedAt = performance.now()

        /*
         * Новый optimistic-сценарий:
         * данные привычки не подменяем до ответа сервера.
         * Мгновенно показываем только состояние действия —
         * вращение контура кнопки.
         */
        startConfirmationLoading(confirmButton)

        try {
            const response = await setHabitConfirmation(
                habitId,
                desiredState
            )

            const elapsed = performance.now() - loadingStartedAt
            const remaining = Math.max(0, CONFIRMATION_SPIN_MIN_MS - elapsed)

            if (remaining > 0) {
                await wait(remaining)
            }

            const serverHabit = response.habit
            const serverCompletedToday = Boolean(serverHabit.completed_today)
            const serverCompletedDates = Array.isArray(serverHabit.completed_dates)
                ? serverHabit.completed_dates
                : []
            const serverStreak = normalizePositiveInteger(serverHabit.streak)
            const finalWeekProgress = normalizeWeekProgress(serverHabit.week_progress)

            const finalHabit = updateHabit(
                habitId,
                {
                    completedToday: serverCompletedToday,
                    completedDates: serverCompletedDates,
                    streak: serverStreak,
                    weekProgress: finalWeekProgress,
                    completedAt: serverCompletedToday
                        ? new Date().toISOString()
                        : null
                }
            )

            stopConfirmationLoading(confirmButton)
            updateHabitCardVisualState(card, finalHabit)

            setHabitsStatistics({
                currentStreak: normalizePositiveInteger(
                    response.statistics?.current_streak
                ),
                maxStreak: normalizePositiveInteger(
                    response.statistics?.max_streak
                )
            })

            refreshHabitsStatsVisual()

            /*
             * ✓, недельная полоска и streak уже получили
             * серверное состояние одним кадром. Поверх него
             * одновременно запускаем визуальную награду.
             */
            animateHabitReward(
                card,
                previousHabit,
                finalHabit,
                response
            )

        } catch (error) {
            stopConfirmationLoading(confirmButton)

            /*
             * Store не менялся до успешного ответа сервера,
             * но оставляем явную синхронизацию как страховку.
             */
            updateHabit(habitId, previousHabit)
            updateHabitCardVisualState(card, previousHabit)

            console.error(
                "Ошибка подтверждения привычки:",
                error
            )
        } finally {
            pendingHabitConfirmations.delete(habitId)

            if (document.contains(confirmButton)) {
                confirmButton.disabled = false
            }
        }
    }
)
}}

/* =========================================================
   ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ СПИСКА

   onOpenHabitsPage передаётся из корневого habitsEvents.js.
   ========================================================= */

export function initHabitsListEvents({
    onOpenHabitsPage = null
} = {}) {
    const root = getHabitsRoot()

    if (!root) {
        console.warn(
            "Habits List Events: не найден #habits-v2-root"
        )

        return
    }

    const habitsList = root.querySelector(
        ".habits-v2-list"
    )

    if (!habitsList) {
        return
    }

    const habitCards = habitsList.querySelectorAll(
        ".habit-card[data-habit-id]"
    )

    habitCards.forEach((card) => {
        initSingleHabitCardEvents(
            card,
            {
                onOpenHabitsPage
            }
        )
    })
}


/* =========================================================
   СБРОС СОХРАНЁННОЙ ПРОКРУТКИ

   Можно использовать при выходе из раздела привычек.
   ========================================================= */

export function resetHabitsListScroll() {
    habitsListScrollTop = 0
}
import { formatRepeatRule } from "../habitRepeatRule.js"

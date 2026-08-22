/**
 * Экран создания и редактирования привычки.
 *
 * Этот файл отвечает только за разметку.
 * Все события страницы обрабатываются
 * в addHabitEvents.js.
 */

import {
    createHabit as createHabitApi,
    updateHabitApi
} from "../habitsApi.js"

import {
    getHabitDraft,
    getHabitDraftValue,
    setHabitDraftValue,
    updateHabitDraft,
    resetHabitDraft,
    startNewHabitDraft,
    getEditingHabitId,
    isHabitDraftEditing
} from "./habitsDraft.js"

import {
    addHabit,
    updateHabit
} from "../habitsStore.js"

import {
    createHabitId,
    addPressAnimation
} from "../habitsUtils.js"

import {
    removeBottomNavigation
} from "../../navigation.js"

import {
    t
} from "../../../i18n/core/i18n.js"


/* =========================================================
   РЕНДЕР СТРАНИЦЫ СОЗДАНИЯ / РЕДАКТИРОВАНИЯ
   ========================================================= */

export function renderAddHabitPage() {
    const root = document.getElementById(
        "habits-v2-root"
    )

    if (!root) {
        console.error(
            "Add Habit V2: не найден контейнер #habits-v2-root"
        )

        return
    }


    /* =====================================================
       РЕЖИМ СТРАНИЦЫ
       ===================================================== */

    const isEditing =
        isHabitDraftEditing()

    const pageTitle = isEditing
        ? t("habits.addHabit.edit.title")
        : t("habits.addHabit.create.title")

    const backButtonLabel = isEditing
        ? t("habits.addHabit.edit.backAria")
        : t("habits.addHabit.create.backAria")

    const saveButtonLabel = isEditing
        ? t("habits.addHabit.edit.saveAria")
        : t("habits.addHabit.create.saveAria")


    /* =====================================================
       РАЗМЕТКА
       ===================================================== */

    root.innerHTML = `
        <section
            class="add-habit-v2"
            data-page-mode="${isEditing ? "edit" : "create"}"
        >

            <!-- Верхняя панель -->
            <header class="add-habit-v2__header">

                <button
                    class="add-habit-v2__back-button back-button"
                    type="button"
                    data-action="close-add-habit"
                    aria-label="${backButtonLabel}"
                >
                    <span
                        class="material-symbols-rounded back-icon"
                        aria-hidden="true"
                    >
                        arrow_back_ios_new
                    </span>
                </button>

                <h1 class="add-habit-v2__title">
                    ${pageTitle}
                </h1>

                <button
                    class="add-habit-v2__save-button"
                    type="button"
                    data-action="save-habit"
                    aria-label="${saveButtonLabel}"
                >
                    <span
                        class="material-symbols-rounded save-icon"
                        aria-hidden="true"
                    >
                        check
                    </span>
                </button>

            </header>


            <!-- Основное содержимое -->
            <div class="add-habit-v2__content">

                <!-- Название привычки -->
                <section class="add-habit-v2__section">

                    <label
                        class="add-habit-v2__section-label"
                        for="add-habit-name"
                    >
                        ${t("habits.addHabit.name.label")}
                    </label>

                    <div class="add-habit-v2__name-field">

                        <button
                            class="add-habit-v2__name-icon"
                            type="button"
                            data-action="open-icon-picker"
                            aria-label="${t("habits.addHabit.name.iconAria")}"
                        >
                            <span
                                class="add-habit-v2__selected-icon"
                                aria-hidden="true"
                            >
                                ✱
                            </span>
                        </button>

                        <input
                            id="add-habit-name"
                            class="add-habit-v2__name-input"
                            name="habitName"
                            type="text"
                            maxlength="60"
                            placeholder="${t("habits.addHabit.name.placeholder")}"
                            autocomplete="off"
                            autocapitalize="sentences"
                            enterkeyhint="done"
                        >

                    </div>


                    <!-- Быстрые варианты названия -->
                    <div class="add-habit-v2__suggestions">

                        <button
                            class="add-habit-v2__suggestion"
                            type="button"
                            data-habit-suggestion="${t("habits.addHabit.suggestions.noWaste")}"
                        >
                            ${t("habits.addHabit.suggestions.noWaste")}
                        </button>

                        <span class="add-habit-v2__divider">
                            |
                        </span>

                        <button
                            class="add-habit-v2__suggestion"
                            type="button"
                            data-habit-suggestion="${t("habits.addHabit.suggestions.saveMoney")}"
                        >
                            ${t("habits.addHabit.suggestions.saveMoney")}
                        </button>

                        <span class="add-habit-v2__divider">
                            |
                        </span>

                        <button
                            class="add-habit-v2__suggestion"
                            type="button"
                            data-habit-suggestion="${t("habits.addHabit.suggestions.planBudget")}"
                        >
                            ${t("habits.addHabit.suggestions.planBudget")}
                        </button>

                        <span class="add-habit-v2__divider">
                            |
                        </span>

                        <button
                            class="add-habit-v2__suggestion"
                            type="button"
                            data-habit-suggestion="${t("habits.addHabit.suggestions.readBook")}"
                        >
                            ${t("habits.addHabit.suggestions.readBook")}
                        </button>

                    </div>

                </section>


                <!-- Выбор цвета -->
                <section class="add-habit-v2__section">

                    <div class="add-habit-v2__section-label">
                        ${t("habits.addHabit.color.label")}
                    </div>

                    <div
                        class="add-habit-v2__colors"
                        role="radiogroup"
                        aria-label="${t("habits.addHabit.color.groupAria")}"
                    >

                        <!-- 1. Доступен -->
                        <button
                            class="add-habit-v2__color is-selected"
                            type="button"
                            data-habit-color="blue"
                            role="radio"
                            aria-checked="true"
                            aria-label="${t("habits.addHabit.color.blue")}"
                        ></button>

                        <!-- 2. Доступен -->
                        <button
                            class="add-habit-v2__color"
                            type="button"
                            data-habit-color="green"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.green")}"
                        ></button>

                        <!-- 3. Доступен -->
                        <button
                            class="add-habit-v2__color"
                            type="button"
                            data-habit-color="purple"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.purple")}"
                        ></button>

                        <!-- 4. Закрыт -->
                        <button
                            class="add-habit-v2__color is-locked"
                            type="button"
                            data-habit-color="orange"
                            data-locked="true"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.orangePremium")}"
                        >
                            <span
                                class="add-habit-v2__lock"
                                aria-hidden="true"
                            >
                                🔒
                            </span>
                        </button>

                        <!-- 5. Доступен -->
                        <button
                            class="add-habit-v2__color"
                            type="button"
                            data-habit-color="red"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.red")}"
                        ></button>

                        <!-- 6. Доступен -->
                        <button
                            class="add-habit-v2__color"
                            type="button"
                            data-habit-color="graphite"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.graphite")}"
                        ></button>

                        <!-- 7. Закрыт -->
                        <button
                            class="add-habit-v2__color is-locked"
                            type="button"
                            data-habit-color="cyan"
                            data-locked="true"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.cyanPremium")}"
                        >
                            <span
                                class="add-habit-v2__lock"
                                aria-hidden="true"
                            >
                                🔒
                            </span>
                        </button>

                        <!-- 8. Доступен -->
                        <button
                            class="add-habit-v2__color"
                            type="button"
                            data-habit-color="brown"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.brown")}"
                        ></button>

                        <!-- 9. Закрыт -->
                        <button
                            class="add-habit-v2__color is-locked"
                            type="button"
                            data-habit-color="pink"
                            data-locked="true"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.pinkPremium")}"
                        >
                            <span
                                class="add-habit-v2__lock"
                                aria-hidden="true"
                            >
                                🔒
                            </span>
                        </button>

                        <!-- 10. Доступен -->
                        <button
                            class="add-habit-v2__color"
                            type="button"
                            data-habit-color="silver"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.silver")}"
                        ></button>

                        <!-- 11. Закрыт -->
                        <button
                            class="add-habit-v2__color is-locked"
                            type="button"
                            data-habit-color="yellow"
                            data-locked="true"
                            role="radio"
                            aria-checked="false"
                            aria-label="${t("habits.addHabit.color.yellowPremium")}"
                        >
                            <span
                                class="add-habit-v2__lock"
                                aria-hidden="true"
                            >
                                🔒
                            </span>
                        </button>

                    </div>

                </section>


                <!-- Размер карточки -->
                <section class="add-habit-v2__section">

                    <div class="add-habit-v2__section-label">
                        ${t("habits.addHabit.size.label")}
                    </div>

                    <button
                        class="add-habit-v2__size-card is-selected"
                        type="button"
                        data-habit-size="large"
                        aria-pressed="true"
                    >

                        <div
                            class="add-habit-v2__size-icon"
                            aria-hidden="true"
                        >
                            ⛶
                        </div>

                        <div class="add-habit-v2__size-copy">

                            <div class="add-habit-v2__size-title">
                                ${t("habits.addHabit.size.large.title")}
                            </div>

                            <div class="add-habit-v2__size-description">
                                ${t("habits.addHabit.size.large.description")}
                            </div>

                        </div>

                    </button>

                </section>

            </div>

        </section>
    `
}










/* =========================================================
   ADD HABIT EVENTS

   Логика страницы создания и редактирования привычки.

   Отвечает за:
   - создание новой привычки;
   - редактирование существующей привычки;
   - работу с черновиком;
   - выбор названия;
   - выбор цвета;
   - выбор размера;
   - переход к выбору эмодзи;
   - сохранение изменений;
   - возврат с формы.
   ========================================================= */


/* =========================================================
   КОРНЕВОЙ КОНТЕЙНЕР
   ========================================================= */

function getHabitsRoot() {
    return document.getElementById(
        "habits-v2-root"
    )
}


/* =========================================================
   СОХРАНИТЬ ДАННЫЕ ФОРМЫ В ЧЕРНОВИК

   Используется перед:
   - переходом к выбору эмодзи;
   - окончательным сохранением привычки.
   ========================================================= */

export function updateDraftFromAddHabitPage() {
    const root = getHabitsRoot()

    if (!root) {
        console.warn(
            "Add Habit Events: не найден #habits-v2-root"
        )

        return
    }

    const nameInput = root.querySelector(
        "#add-habit-name"
    )

    const selectedIcon = root.querySelector(
        ".add-habit-v2__selected-icon"
    )

    const selectedColor = root.querySelector(
        "[data-habit-color].is-selected"
    )

    const selectedSize = root.querySelector(
        "[data-habit-size].is-selected"
    )

    const iconValue =
        selectedIcon?.textContent?.trim()

    updateHabitDraft({
        name:
            nameInput?.value ?? "",

        icon:
            iconValue ||
            getHabitDraftValue("icon"),

        color:
            selectedColor?.dataset.habitColor ||
            getHabitDraftValue("color"),

        size:
            selectedSize?.dataset.habitSize ||
            getHabitDraftValue("size")
    })
}


/* =========================================================
   ВОССТАНОВИТЬ ЧЕРНОВИК В ФОРМЕ

   Используется:
   - после открытия страницы;
   - после возвращения со страницы выбора эмодзи;
   - при редактировании существующей привычки.
   ========================================================= */

export function restoreDraftToAddHabitPage() {
    const root = getHabitsRoot()

    if (!root) {
        console.warn(
            "Add Habit Events: не найден #habits-v2-root"
        )

        return
    }

    const draft = getHabitDraft()

    const nameInput = root.querySelector(
        "#add-habit-name"
    )

    const selectedIcon = root.querySelector(
        ".add-habit-v2__selected-icon"
    )

    const colorButtons = root.querySelectorAll(
        "[data-habit-color]"
    )

    const sizeButtons = root.querySelectorAll(
        "[data-habit-size]"
    )


    /* ---------------------------------------------------------
       НАЗВАНИЕ
       --------------------------------------------------------- */

    if (nameInput) {
        nameInput.value =
            draft.name
    }


    /* ---------------------------------------------------------
       ИКОНКА
       --------------------------------------------------------- */

    if (selectedIcon) {
        selectedIcon.textContent =
            draft.icon
    }


    /* ---------------------------------------------------------
       ЦВЕТ
       --------------------------------------------------------- */

    colorButtons.forEach((button) => {
        const isSelected =
            button.dataset.habitColor ===
            draft.color

        button.classList.toggle(
            "is-selected",
            isSelected
        )

        button.setAttribute(
            "aria-checked",
            String(isSelected)
        )
    })


    /* ---------------------------------------------------------
       РАЗМЕР
       --------------------------------------------------------- */

    sizeButtons.forEach((button) => {
        const isSelected =
            button.dataset.habitSize ===
            draft.size

        button.classList.toggle(
            "is-selected",
            isSelected
        )

        button.setAttribute(
            "aria-pressed",
            String(isSelected)
        )
    })
}


/* =========================================================
   ПОЛУЧИТЬ ПРОВЕРЕННОЕ НАЗВАНИЕ
   ========================================================= */

function getNormalizedHabitName() {
    return String(
        getHabitDraftValue("name") || ""
    ).trim()
}


/* =========================================================
   СОЗДАТЬ НОВУЮ ПРИВЫЧКУ ИЗ ЧЕРНОВИКА
   ========================================================= */

export function createHabitFromDraft() {
    const draft = getHabitDraft()

    const habitName =
        getNormalizedHabitName()

    if (!habitName) {
        return null
    }

    const newHabit = {
        id:
            createHabitId(),

        name:
            habitName,

        icon:
            draft.icon || "✱",

        color:
            draft.color || "blue",

        size:
            draft.size || "large",

        completedToday:
            false,

        streak:
            0,

        xpReward:
            5,

        weekProgress: [
            false,
            false,
            false,
            false,
            false,
            false,
            false
        ],

        completedDates: [],

        createdAt:
            new Date().toISOString(),

        completedAt:
            null
    }

    return addHabit(
        newHabit
    )
}


/* =========================================================
   ОБНОВИТЬ СУЩЕСТВУЮЩУЮ ПРИВЫЧКУ ИЗ ЧЕРНОВИКА

   Изменяются только:
   - название;
   - иконка;
   - цвет;
   - размер.

   Остальные данные привычки Store сохраняет:
   - серию;
   - XP;
   - календарь;
   - историю подтверждений;
   - дату создания;
   - сегодняшний статус.
   ========================================================= */

export async function updateHabitFromDraft() {
    const editingHabitId =
        getEditingHabitId()

    if (!editingHabitId) {
        console.warn(
            "Add Habit Events: отсутствует ID редактируемой привычки"
        )

        return null
    }

    const draft = getHabitDraft()

    const habitName =
        getNormalizedHabitName()

    if (!habitName) {
        return null
    }

    const response =
        await updateHabitApi(
            editingHabitId,
            {
                title: habitName,
                emoji: draft.icon || "✱",
                color: draft.color || "blue",
                size: draft.size || "large"
            }
        )

    if (!response) {
        return null
    }

    return updateHabit(
        editingHabitId,
        {
            name: response.title,
            icon: response.emoji,
            color: response.color,
            size: response.size
        }
    )
}



/* =========================================================
   СОХРАНИТЬ ЧЕРНОВИК

   Автоматически определяет режим:

   создание:
   addHabit()

   редактирование:
   updateHabit()
   ========================================================= */

export function saveHabitFromDraft() {
    if (isHabitDraftEditing()) {
        return updateHabitFromDraft()
    }

    return createHabitFromDraft()
}


/* =========================================================
   ОТКРЫТЬ СТРАНИЦУ СОЗДАНИЯ ИЛИ РЕДАКТИРОВАНИЯ

   resetDraft:
   true — начать создание новой привычки;
   false — сохранить текущий черновик.

   onOpenHabitsPage:
   резервный возврат на главную страницу.

   onHabitSaved:
   вызывается после успешного сохранения.

   onCancel:
   вызывается при нажатии стрелки назад.
   ========================================================= */

export function openAddHabitPage({
    resetDraft = false,
    onOpenHabitsPage = null,
    onHabitSaved = null,
    onCancel = null
} = {}) {
    /*
     * Создание и редактирование — внутренние экраны.
     * Основная нижняя навигация и её глобальный fade
     * здесь не должны присутствовать.
     */
    removeBottomNavigation()

    if (resetDraft) {
        startNewHabitDraft()
    }

    renderAddHabitPage()

    restoreDraftToAddHabitPage()

    initAddHabitPageEvents({
        onOpenHabitsPage,
        onHabitSaved,
        onCancel
    })
}


/* =========================================================
   ПОКАЗАТЬ ОШИБКУ ПУСТОГО НАЗВАНИЯ
   ========================================================= */

function showNameValidationError(
    nameInput
) {
    if (!nameInput) {
        return
    }

    const nameField =
        nameInput.closest(
            ".add-habit-v2__name-field"
        )

    nameInput.focus()

    nameField?.classList.add(
        "has-error"
    )

    window.setTimeout(() => {
        nameField?.classList.remove(
            "has-error"
        )
    }, 450)
}


/* =========================================================
   ВЫБРАТЬ ЦВЕТ
   ========================================================= */

function selectHabitColor(
    selectedButton,
    colorButtons
) {
    const isLocked =
        selectedButton.dataset.locked ===
        "true"

    if (isLocked) {
        console.log(
            "Этот цвет доступен только с Premium"
        )

        return
    }

    colorButtons.forEach((button) => {
        button.classList.remove(
            "is-selected"
        )

        button.setAttribute(
            "aria-checked",
            "false"
        )
    })

    selectedButton.classList.add(
        "is-selected"
    )

    selectedButton.setAttribute(
        "aria-checked",
        "true"
    )

    setHabitDraftValue(
        "color",
        selectedButton.dataset.habitColor ||
            "blue"
    )
}


/* =========================================================
   ВЫБРАТЬ РАЗМЕР
   ========================================================= */

function selectHabitSize(
    selectedButton,
    sizeButtons
) {
    sizeButtons.forEach((button) => {
        button.classList.remove(
            "is-selected"
        )

        button.setAttribute(
            "aria-pressed",
            "false"
        )
    })

    selectedButton.classList.add(
        "is-selected"
    )

    selectedButton.setAttribute(
        "aria-pressed",
        "true"
    )

    setHabitDraftValue(
        "size",
        selectedButton.dataset.habitSize ||
            "large"
    )
}


/* =========================================================
   ВЕРНУТЬСЯ СО СТРАНИЦЫ ФОРМЫ
   ========================================================= */

function handleAddHabitBack({
    onOpenHabitsPage = null,
    onCancel = null
} = {}) {
    resetHabitDraft()

    if (typeof onCancel === "function") {
        onCancel()
        return
    }

    if (
        typeof onOpenHabitsPage ===
        "function"
    ) {
        onOpenHabitsPage()
        return
    }

    console.warn(
        "Add Habit Events: не передан обработчик возврата"
    )
}


/* =========================================================
   ОБРАБОТАТЬ УСПЕШНОЕ СОХРАНЕНИЕ
   ========================================================= */

function handleHabitSaved(
    savedHabit,
    {
        wasEditing = false,
        onHabitSaved = null,
        onOpenHabitsPage = null
    } = {}
) {
    resetHabitDraft()

    if (
        typeof onHabitSaved ===
        "function"
    ) {
        onHabitSaved(
            savedHabit,
            {
                wasEditing
            }
        )

        return
    }

    if (
        typeof onOpenHabitsPage ===
        "function"
    ) {
        onOpenHabitsPage()
        return
    }

    console.warn(
        "Add Habit Events: привычка сохранена, но не передан обработчик перехода"
    )
}


/* =========================================================
   СОБЫТИЯ СТРАНИЦЫ СОЗДАНИЯ / РЕДАКТИРОВАНИЯ
   ========================================================= */

export function initAddHabitPageEvents({
    onOpenHabitsPage = null,
    onHabitSaved = null,
    onCancel = null
} = {}) {
    const root = getHabitsRoot()

    if (!root) {
        console.warn(
            "Add Habit Events: не найден #habits-v2-root"
        )

        return
    }


    /* =====================================================
       ЭЛЕМЕНТЫ
       ===================================================== */

    const backButton = root.querySelector(
        '[data-action="close-add-habit"]'
    )

    const saveButton = root.querySelector(
        '[data-action="save-habit"]'
    )

    const iconButton = root.querySelector(
        '[data-action="open-icon-picker"]'
    )

    const nameInput = root.querySelector(
        "#add-habit-name"
    )

    const suggestionButtons =
        root.querySelectorAll(
            "[data-habit-suggestion]"
        )

    const colorButtons =
        root.querySelectorAll(
            "[data-habit-color]"
        )

    const sizeButtons =
        root.querySelectorAll(
            "[data-habit-size]"
        )


    /* =====================================================
       АНИМАЦИИ НАЖАТИЯ
       ===================================================== */

    addPressAnimation(backButton)
    addPressAnimation(saveButton)
    addPressAnimation(iconButton)

    suggestionButtons.forEach((button) => {
        addPressAnimation(button)
    })

    colorButtons.forEach((button) => {
        addPressAnimation(button)
    })

    sizeButtons.forEach((button) => {
        addPressAnimation(button)
    })


    /* =====================================================
       ВВОД НАЗВАНИЯ
       ===================================================== */

    nameInput?.addEventListener(
        "input",
        () => {
            setHabitDraftValue(
                "name",
                nameInput.value
            )

            const nameField =
                nameInput.closest(
                    ".add-habit-v2__name-field"
                )

            nameField?.classList.remove(
                "has-error"
            )
        }
    )


    /* =====================================================
       ВОЗВРАТ НАЗАД

       При создании:
       возвращаемся на главную страницу.

       При редактировании:
       позже вернёмся в детали привычки через onCancel.
       ===================================================== */

    backButton?.addEventListener(
        "click",
        () => {
            handleAddHabitBack({
                onOpenHabitsPage,
                onCancel
            })
        }
    )


    /* =====================================================
       ОТКРЫТЬ ВЫБОР ЭМОДЗИ

       Сначала сохраняем заполненную форму в черновик.
       Режим редактирования при этом не сбрасывается.
       ===================================================== */

    iconButton?.addEventListener(
        "click",
        () => {
            updateDraftFromAddHabitPage()

            renderIconPickerPage(
                getHabitDraftValue("icon")
            )

            initIconPickerEvents({
                onBackToAddHabitPage: () => {
                    openAddHabitPage({
                        resetDraft: false,
                        onOpenHabitsPage,
                        onHabitSaved,
                        onCancel
                    })
                }
            })
        }
    )


    /* =====================================================
       БЫСТРЫЕ ВАРИАНТЫ НАЗВАНИЯ
       ===================================================== */

    suggestionButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                if (!nameInput) {
                    return
                }

                const suggestion =
                    button.dataset
                        .habitSuggestion || ""

                nameInput.value =
                    suggestion

                setHabitDraftValue(
                    "name",
                    suggestion
                )

                nameInput.focus()

                nameInput.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true
                        }
                    )
                )
            }
        )
    })


    /* =====================================================
       ВЫБОР ЦВЕТА
       ===================================================== */

    colorButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                selectHabitColor(
                    button,
                    colorButtons
                )
            }
        )
    })


    /* =====================================================
       ВЫБОР РАЗМЕРА
       ===================================================== */

    sizeButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                selectHabitSize(
                    button,
                    sizeButtons
                )
            }
        )
    })


    /* =====================================================
       СОХРАНЕНИЕ ПРИВЫЧКИ

       Перед сохранением запоминаем режим,
       потому что resetHabitDraft() позже его сбросит.
       ===================================================== */

saveButton?.addEventListener(
    "click",
    async () => {
        updateDraftFromAddHabitPage()

        const habitName =
            getNormalizedHabitName()

        if (!habitName) {
            showNameValidationError(
                nameInput
            )

            return
        }

        const wasEditing =
            isHabitDraftEditing()

        saveButton.disabled = true

        try {
            let savedHabit = null

            if (wasEditing) {
                savedHabit =
                    await updateHabitFromDraft()
            } else {
                const draft =
                    getHabitDraft()

                savedHabit =
                    await createHabitApi({
                        title:
                            habitName,

                        emoji:
                            draft.icon || "✱",

                        color:
                            draft.color || "blue",

                        size:
                            draft.size || "large"
                    })
            }

            if (!savedHabit) {
                throw new Error(
                    wasEditing
                        ? "Не удалось обновить привычку"
                        : "Сервер не вернул созданную привычку"
                )
            }

            console.log(
                wasEditing
                    ? "Привычка обновлена:"
                    : "Привычка создана через API:",
                savedHabit
            )

            handleHabitSaved(
                savedHabit,
                {
                    wasEditing,
                    onHabitSaved,
                    onOpenHabitsPage
                }
            )
        } catch (error) {
            console.error(
                "Ошибка сохранения привычки:",
                error
            )

            window.alert(
                t("habits.addHabit.error.save")
            )
        } finally {
            saveButton.disabled = false
        }
    }
)
}








/* =========================================================
   ICON PICKER PAGE V2
   Светлый полноэкранный выбор эмодзи
   6 элементов в строке
   ========================================================= */


/* =========================================================
   СПИСОК ЭМОДЗИ

   Порядок приближен к референсу:
   спорт → здоровье → питание → режим →
   работа → обучение
   ========================================================= */

const HABIT_ICONS = [
    // Спорт и физическая активность
    "✱", "🏃", "🥋", "🏋️", "🚶", "🧘",
    "🏊", "🧗", "🚴", "👣", "👤", "👥",
    "🙂", "🏋️‍♂️", "⚽", "🎾", "🏈", "🏀",
    "⚾", "🫁", "🐾", "⚡", "➕", "🍴",

    // Питание и вода
    "🥕", "💧", "☕", "🥤", "🍼", "🍷",
    "🍎", "🍌", "🥑", "🥗", "🥚", "🍚",
    "🥛", "🫖", "🍵", "🥣", "🥦", "🍋",

    // Здоровье и уход
    "💊", "⏱️", "🌳", "🌷", "🍃", "🚿",
    "🩺", "🧴", "🪥", "🧼", "🛁", "🧖",
    "❤️", "🧠", "🫀", "🦷", "👁️", "🩹",

    // Сон, режим и погода
    "🌙", "🕒", "🌅", "☀️", "❄️", "☁️",
    "🛏️", "⏰", "🌇", "🌄", "🌧️", "🌈",
    "📅", "⌛", "⏳", "🕯️", "🌌", "⭐",

    // Работа и продуктивность
    "🌍", "⏳", "💼", "💻", "📱", "⌨️",
    "📝", "✅", "📌", "📊", "📈", "🗂️",
    "🧾", "📋", "🖥️", "🖊️", "📎", "🧮",

    // Обучение и развитие
    "🎓", "📖", "📥", "📁", "📦", "📄",
    "📚", "✏️", "🧑‍💻", "🧩", "💡", "🔬",
    "🎯", "🗣️", "🎧", "🧪", "🌐", "🏆",

    // Деньги и статус
    "💰", "💵", "💳", "🪙", "🏦", "📉",
    "💎", "👑", "🚀", "🔥", "⭐", "🥇",

    // Отдых и личная жизнь
    "🎵", "🎮", "🎨", "📷", "🎬", "🎸",
    "🐕", "🐈", "🌿", "🏠", "🚗", "✈️"
]


/* =========================================================
   ЭКРАНИРОВАНИЕ ЗНАЧЕНИЙ

   Сейчас значения состоят из эмодзи, однако функция
   оставлена для безопасного формирования HTML.
   ========================================================= */

function escapeAttribute(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
}


/* =========================================================
   СОЗДАНИЕ ОДНОГО ЭЛЕМЕНТА
   ========================================================= */

function createIconMarkup(icon, selectedIcon) {
    const isSelected = icon === selectedIcon

    return `
        <button
            class="habit-icon-picker__item${
                isSelected ? " is-selected" : ""
            }"
            type="button"
            data-habit-icon="${escapeAttribute(icon)}"
            aria-label="${escapeAttribute(
        t(
            "habits.emoji.itemAria",
            {
                emoji: icon
            }
        )
    )}"
            aria-pressed="${String(isSelected)}"
        >
            <span
                class="habit-icon-picker__emoji"
                aria-hidden="true"
            >
                ${icon}
            </span>
        </button>
    `
}


/* =========================================================
   РЕНДЕР СТРАНИЦЫ
   ========================================================= */

export function renderIconPickerPage(
    selectedIcon = "✱"
) {
    /*
     * У Icon Picker есть собственный footer/fade.
     * Глобальный fade нижней навигации поверх него
     * создавать нельзя.
     */
    removeBottomNavigation()

    const root = document.getElementById(
        "habits-v2-root"
    )

    if (!root) {
        console.error(
            "Icon Picker V2: не найден контейнер #habits-v2-root"
        )

        return
    }

    const iconsMarkup = HABIT_ICONS
        .map((icon) => {
            return createIconMarkup(
                icon,
                selectedIcon
            )
        })
        .join("")

    root.innerHTML = `
        <section class="habit-icon-picker">

            <div
                class="habit-icon-picker__sheet"
                role="dialog"
                aria-modal="true"
                aria-label="${t("habits.emoji.screenAria")}"
            >

<!-- Верхняя панель -->

<header class="habit-icon-picker__header">

    <button
        class="habit-icon-picker__back-button back-button"
        type="button"
        data-action="close-icon-picker"
        aria-label="${t("habits.emoji.backAria")}"
    >
<span
    class="material-symbols-rounded back-icon"
    aria-hidden="true"
>
    arrow_back_ios_new
</span>
    </button>

    <h1 class="habit-icon-picker__title">
        Выберите иконку
    </h1>

</header>


                <!-- Прокручиваемая сетка эмодзи -->

                <div class="habit-icon-picker__body">

                    <div
                        class="habit-icon-picker__grid"
                        role="list"
                        aria-label="${t("habits.emoji.gridAria")}"
                    >
                        ${iconsMarkup}
                    </div>

                </div>


                <!-- Фиксированная нижняя кнопка -->

                <footer class="habit-icon-picker__footer">

                    <button
                        class="habit-icon-picker__confirm"
                        type="button"
                        data-action="confirm-habit-icon"
                    >
                        ${t("habits.emoji.confirm")}
                    </button>

                </footer>

            </div>

        </section>
    `
}









/* =========================================================
   ICON PICKER EVENTS

   Логика страницы выбора эмодзи.

   Отвечает за:
   - временный выбор эмодзи;
   - визуальное выделение выбранного эмодзи;
   - возврат без сохранения;
   - подтверждение выбранного эмодзи;
   - сохранение эмодзи в черновик привычки.
   ========================================================= */

export function initIconPickerEvents({
    onBackToAddHabitPage = null
} = {}) {
    const root = getHabitsRoot()

    if (!root) {
        console.warn(
            "Icon Picker Events: не найден #habits-v2-root"
        )

        return
    }


    /* =====================================================
       ЭЛЕМЕНТЫ
       ===================================================== */

    const backButton = root.querySelector(
        '[data-action="close-icon-picker"]'
    )

    const confirmButton = root.querySelector(
        '[data-action="confirm-habit-icon"]'
    )

    const iconButtons = root.querySelectorAll(
        "[data-habit-icon]"
    )


    /* =====================================================
       ВРЕМЕННО ВЫБРАННЫЙ ЭМОДЗИ

       До нажатия кнопки «Выбрать» значение не записывается
       в основной черновик привычки.
       ===================================================== */

    let pendingIcon =
        getHabitDraftValue("icon") || "✱"


    /* =====================================================
       АНИМАЦИИ НАЖАТИЯ
       ===================================================== */

    addPressAnimation(backButton)
    addPressAnimation(confirmButton)

    iconButtons.forEach((button) => {
        addPressAnimation(button)
    })


    /* =====================================================
       ВОЗВРАТ БЕЗ СОХРАНЕНИЯ

       pendingIcon не записывается в habitsDraft.
       Остаётся прежняя подтверждённая иконка.
       ===================================================== */

    backButton?.addEventListener(
        "click",
        () => {
            if (
                typeof onBackToAddHabitPage ===
                "function"
            ) {
                onBackToAddHabitPage()
                return
            }

            console.warn(
                "Icon Picker Events: не передан onBackToAddHabitPage"
            )
        }
    )


    /* =====================================================
       ВРЕМЕННЫЙ ВЫБОР ЭМОДЗИ
       ===================================================== */

    iconButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                iconButtons.forEach(
                    (iconButton) => {
                        iconButton.classList.remove(
                            "is-selected"
                        )

                        iconButton.setAttribute(
                            "aria-pressed",
                            "false"
                        )
                    }
                )

                button.classList.add(
                    "is-selected"
                )

                button.setAttribute(
                    "aria-pressed",
                    "true"
                )

                pendingIcon =
                    button.dataset.habitIcon ||
                    "✱"
            }
        )
    })


    /* =====================================================
       ПОДТВЕРЖДЕНИЕ ЭМОДЗИ

       Только после нажатия кнопки «Выбрать»
       сохраняем эмодзи в черновик привычки.
       ===================================================== */

    confirmButton?.addEventListener(
        "click",
        () => {
            setHabitDraftValue(
                "icon",
                pendingIcon
            )

            if (
                typeof onBackToAddHabitPage ===
                "function"
            ) {
                onBackToAddHabitPage()
                return
            }

            console.warn(
                "Icon Picker Events: иконка сохранена, но не передан onBackToAddHabitPage"
            )
        }
    )
}
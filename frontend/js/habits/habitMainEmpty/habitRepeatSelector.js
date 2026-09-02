import {
    getHabitDraft,
    setHabitDraftValue
} from "./habitsDraft.js"

import {
    t
} from "../../../i18n/core/i18n.js"


const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]


export function renderHabitRepeatSelector(
    draft,
    isEditing
) {
    const challengeIsLocked =
        isEditing &&
        draft.originalChallengeTarget !== null

    const renderOption = (
        type,
        title,
        body = ""
    ) => {
        const isSelected =
            draft.repeatType === type

        const isLocked =
            challengeIsLocked &&
            type !== "challenge"

        return `
            <div class="habit-repeat__card ${isSelected ? "is-selected" : ""} ${isLocked ? "is-locked" : ""}">
                <button
                    class="habit-repeat__head"
                    type="button"
                    data-repeat-type="${type}"
                    ${isLocked ? "disabled" : ""}
                >
                    <span>${title}</span>
                    <span class="habit-repeat__radio"></span>
                </button>
                ${isSelected ? body : ""}
            </div>
        `
    }

    const dayButtons = `
        <div class="habit-repeat__days">
            ${WEEKDAYS.map((day) => `
                <button
                    type="button"
                    data-repeat-day="${day}"
                    class="${draft.repeatDays.includes(day) ? "is-selected" : ""}"
                >
                    ${t(`habits.addHabit.repeat.day.${day}`)}
                </button>
            `).join("")}
        </div>
    `

    const weeklyCounter = `
        <div class="habit-repeat__counter">
            <span>${t("habits.addHabit.repeat.weeklyValue", {
                count: draft.weeklyTarget
            })}</span>
            <button type="button" data-repeat-step="weekly:-1">−</button>
            <button type="button" data-repeat-step="weekly:1">+</button>
        </div>
    `

    const minimumChallengeTarget =
        draft.originalChallengeTarget || 1

    const challengeCounter = `
        <div class="habit-repeat__counter">
            <span>${t("habits.addHabit.repeat.challengeValue", {
                count: draft.challengeTarget
            })}</span>
            <button
                type="button"
                data-repeat-step="challenge:-1"
                ${draft.challengeTarget <= minimumChallengeTarget ? "disabled" : ""}
            >−</button>
            <button type="button" data-repeat-step="challenge:1">+</button>
        </div>
        ${challengeIsLocked ? `
            <p class="habit-repeat__hint">
                ${t("habits.addHabit.repeat.challengeLocked")}
            </p>
        ` : ""}
    `

    return (
        renderOption(
            "days",
            t("habits.addHabit.repeat.days"),
            dayButtons
        ) +
        renderOption(
            "weekly",
            t("habits.addHabit.repeat.weekly"),
            weeklyCounter
        ) +
        renderOption(
            "challenge",
            t("habits.addHabit.repeat.challenge"),
            challengeCounter
        )
    )
}


export function bindHabitRepeatSelectorEvents({
    root,
    savePageDraft,
    rerenderPage
}) {
    root.querySelectorAll(
        "[data-repeat-type]"
    ).forEach((button) => {
        button.addEventListener("click", () => {
            savePageDraft()

            setHabitDraftValue(
                "repeatType",
                button.dataset.repeatType
            )

            rerenderPage()
        })
    })

    root.querySelectorAll(
        "[data-repeat-day]"
    ).forEach((button) => {
        button.addEventListener("click", () => {
            const day = Number(
                button.dataset.repeatDay
            )

            const currentDays =
                getHabitDraft().repeatDays

            const nextDays = currentDays.includes(day)
                ? currentDays.filter(
                    (currentDay) => currentDay !== day
                )
                : [...currentDays, day].sort(
                    (left, right) => left - right
                )

            if (!nextDays.length) {
                return
            }

            setHabitDraftValue(
                "repeatDays",
                nextDays
            )

            button.classList.toggle(
                "is-selected",
                nextDays.includes(day)
            )
        })
    })

    root.querySelectorAll(
        "[data-repeat-step]"
    ).forEach((button) => {
        button.addEventListener("click", () => {
            savePageDraft()

            const [kind, stepValue] =
                button.dataset.repeatStep.split(":")

            const step = Number(stepValue)
            const draft = getHabitDraft()

            if (kind === "weekly") {
                setHabitDraftValue(
                    "weeklyTarget",
                    Math.min(
                        7,
                        Math.max(
                            1,
                            draft.weeklyTarget + step
                        )
                    )
                )
            } else {
                const minimum =
                    draft.originalChallengeTarget || 1

                setHabitDraftValue(
                    "challengeTarget",
                    Math.max(
                        minimum,
                        draft.challengeTarget + step
                    )
                )
            }

            rerenderPage()
        })
    })
}

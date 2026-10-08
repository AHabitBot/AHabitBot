import {
    getHabitDraft,
    setHabitDraftValue
} from "./habitsDraft.js"

import {
    getLanguage,
    t
} from "../../../i18n/core/i18n.js"


const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]


function getChallengeValueText(
    count
) {
    const pluralCategory =
        new Intl.PluralRules(
            getLanguage()
        ).select(count)

    return t(
        `habits.addHabit.repeat.challengeValue.${pluralCategory}`,
        { count }
    )
}


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

        const iconName =
            type === "days"
                ? "calendar_month"
                : "track_changes"

        return `
            <div class="habit-repeat__card ${isSelected ? "is-selected" : ""} ${isLocked ? "is-locked" : ""}">
                <button
                    class="habit-repeat__head"
                    type="button"
                    data-repeat-type="${type}"
                    ${isLocked ? "disabled" : ""}
                >
                    <span class="habit-repeat__label">
                        <span
                            class="material-symbols-rounded habit-repeat__icon"
                            aria-hidden="true"
                        >${iconName}</span>
                        <span class="habit-repeat__title">${title}</span>
                    </span>
                    <span class="habit-repeat__radio"></span>
                </button>

                <div
                    class="habit-repeat__body"
                    style="height: ${isSelected ? "auto" : "0px"};"
                >
                    <div class="habit-repeat__body-inner">
                        ${body}
                    </div>
                </div>
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

    const minimumChallengeTarget =
        draft.originalChallengeTarget || 1

    const challengeCounter = `
        <div class="habit-repeat__counter">
            <span data-repeat-challenge-value>${getChallengeValueText(
                draft.challengeTarget
            )}</span>
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
            "challenge",
            t("habits.addHabit.repeat.challenge"),
            challengeCounter
        )
    )
}


function setRepeatCardExpanded(
    card,
    expanded
) {
    if (!card) {
        return
    }

    const body =
        card.querySelector(
            ".habit-repeat__body"
        )

    const inner =
        card.querySelector(
            ".habit-repeat__body-inner"
        )

    if (!body || !inner) {
        card.classList.toggle(
            "is-selected",
            expanded
        )
        return
    }

    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches

    body.dataset.animationToken =
        String(
            Number(
                body.dataset.animationToken || 0
            ) + 1
        )

    const token =
        body.dataset.animationToken

    if (prefersReducedMotion) {
        card.classList.toggle(
            "is-selected",
            expanded
        )

        body.style.height =
            expanded
                ? "auto"
                : "0px"

        return
    }

    if (expanded) {
        card.classList.add(
            "is-selected"
        )

        const targetHeight =
            inner.scrollHeight

        const currentHeight =
            body.getBoundingClientRect().height

        body.style.height =
            `${currentHeight}px`

        requestAnimationFrame(() => {
            if (
                body.dataset.animationToken !==
                token
            ) {
                return
            }

            body.style.height =
                `${targetHeight}px`
        })

        const onExpanded = (event) => {
            if (
                event.propertyName !== "height"
                ||
                body.dataset.animationToken !==
                    token
            ) {
                return
            }

            body.removeEventListener(
                "transitionend",
                onExpanded
            )

            if (
                card.classList.contains(
                    "is-selected"
                )
            ) {
                body.style.height =
                    "auto"
            }
        }

        body.addEventListener(
            "transitionend",
            onExpanded
        )

        return
    }

    const currentHeight =
        body.getBoundingClientRect().height

    body.style.height =
        `${currentHeight}px`

    card.classList.remove(
        "is-selected"
    )

    requestAnimationFrame(() => {
        if (
            body.dataset.animationToken !==
            token
        ) {
            return
        }

        body.style.height =
            "0px"
    })
}


function selectRepeatTypeLocally(
    root,
    nextType
) {
    root.querySelectorAll(
        ".habit-repeat__card"
    ).forEach((card) => {
        const button =
            card.querySelector(
                "[data-repeat-type]"
            )

        if (!button) {
            return
        }

        setRepeatCardExpanded(
            card,
            button.dataset.repeatType ===
                nextType
        )
    })
}


export function bindHabitRepeatSelectorEvents({
    root,
    savePageDraft
}) {
    root.querySelectorAll(
        "[data-repeat-type]"
    ).forEach((button) => {
        button.addEventListener("click", () => {
            const nextType =
                button.dataset.repeatType

            const currentType =
                getHabitDraft().repeatType

            if (
                !nextType
                ||
                nextType === currentType
            ) {
                return
            }

            savePageDraft()

            setHabitDraftValue(
                "repeatType",
                nextType
            )

            selectRepeatTypeLocally(
                root,
                nextType
            )
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
            const [kind, stepValue] =
                button.dataset.repeatStep.split(":")

            if (kind !== "challenge") {
                return
            }

            savePageDraft()

            const step = Number(stepValue)
            const draft = getHabitDraft()
            const minimum =
                draft.originalChallengeTarget || 1

            const nextTarget =
                Math.max(
                    minimum,
                    draft.challengeTarget + step
                )

            if (
                nextTarget ===
                draft.challengeTarget
            ) {
                return
            }

            setHabitDraftValue(
                "challengeTarget",
                nextTarget
            )

            const valueElement =
                root.querySelector(
                    "[data-repeat-challenge-value]"
                )

            if (valueElement) {
                valueElement.textContent =
                    getChallengeValueText(
                        nextTarget
                    )
            }

            const decreaseButton =
                root.querySelector(
                    '[data-repeat-step="challenge:-1"]'
                )

            if (decreaseButton) {
                decreaseButton.disabled =
                    nextTarget <= minimum
            }
        })
    })
}

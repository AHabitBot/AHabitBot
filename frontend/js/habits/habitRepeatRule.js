import { t } from "../../i18n/core/i18n.js"

export const ALL_REPEAT_DAYS = [1, 2, 3, 4, 5, 6, 7]

export function formatRepeatRule(habit = {}) {
    const type = habit.repeatType || "days"
    if (type === "weekly") {
        return t("habits.list.repeat.weekly", { count: habit.weeklyTarget || 1 })
    }
    if (type === "challenge") {
        return t("habits.list.repeat.challenge", { count: habit.challengeTarget || 1 })
    }
    const days = Array.isArray(habit.repeatDays) ? habit.repeatDays : ALL_REPEAT_DAYS
    if (days.length === 7) return t("habits.list.repeat.everyDay")
    const excluded = ALL_REPEAT_DAYS.filter(day => !days.includes(day))
    if (excluded.length <= 2) {
        return t("habits.list.repeat.except", { days: excluded.map(dayLabel).join(" ") })
    }
    return days.map(dayLabel).join(", ")
}

function dayLabel(day) {
    return t(`habits.list.repeat.day.${day}`)
}

import {
    t
} from "../../../i18n/core/i18n.js"

import {
    shareReferralLink
} from "../../profile/referral/profileReferralEvents.js"

import {
    addPressAnimation
} from "../habitsUtils.js"


function escapeAttribute(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
}


export function renderHabitInvite({
    habitName,
    durationText,
    inviteToken
}) {
    return `
        <button
            class="habit-details__invite"
            type="button"
            data-habit-invite
            data-habit-name="${escapeAttribute(habitName)}"
            data-habit-duration="${escapeAttribute(durationText)}"
            data-habit-invite-token="${escapeAttribute(inviteToken)}"
        >
            <span
                class="material-symbols-rounded habit-details__invite-icon"
                aria-hidden="true"
            >
                person_add
            </span>

            <span>
                ${t("habits.details.invite.button")}
            </span>
        </button>
    `
}


export function initHabitInvite(root) {
    const button = root?.querySelector("[data-habit-invite]")
    if (!button) return

    addPressAnimation(button)

    button.addEventListener("click", () => {
        const inviteToken = button.dataset.habitInviteToken || ""
        if (!inviteToken) return

        const inviteLink =
            "https://t.me/AHabitBot?startapp=habit_"
            + encodeURIComponent(inviteToken)

        const shareText = t("habits.details.invite.shareText", {
            name: button.dataset.habitName || t("habits.details.unnamed"),
            duration: button.dataset.habitDuration || ""
        })

        shareReferralLink(inviteLink, shareText)
    })
}

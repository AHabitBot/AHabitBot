import {
    t
} from "../../../i18n/core/i18n.js"

import {
    RESOURCE_KEYS,
    peekResource
} from "../../core/resourceCache.js"

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
    durationText
}) {
    return `
        <button
            class="habit-details__invite"
            type="button"
            data-habit-invite
            data-habit-name="${escapeAttribute(habitName)}"
            data-habit-duration="${escapeAttribute(durationText)}"
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
    const button = root?.querySelector(
        "[data-habit-invite]"
    )

    if (!button) {
        return
    }

    addPressAnimation(button)

    button.addEventListener(
        "click",
        () => {
            const referral = peekResource(
                RESOURCE_KEYS.REFERRAL
            )
            const referralLink =
                referral?.referral_link || ""

            if (!referralLink) {
                return
            }

            const shareText = t(
                "habits.details.invite.shareText",
                {
                    name:
                        button.dataset.habitName ||
                        t("habits.details.unnamed"),
                    duration:
                        button.dataset.habitDuration ||
                        ""
                }
            )

            shareReferralLink(
                referralLink,
                shareText
            )
        }
    )
}

import {
    renderProfileStatsPage
} from "./stats/profileStats.js"

import {
    renderProfileAchievementsPage
} from "./achievements/profileAchievements.js"

import {
    renderProfileAppearancePage
} from "./appearance/profileAppearance.js"

import {
    renderProfileSettingsPage
} from "./settings/profileSettings.js"

import {
    renderProfileSupportPage
} from "./support/profileSupport.js"

import {
    renderProfileReferralPage
} from "./referral/profileReferral.js"

import {
    renderProfileArchivePage
} from "./archive/profileArchive.js"


/* =========================================================
   PROFILE V2 — СОБЫТИЯ
   ========================================================= */


const initializedRoots =
    new WeakSet()


const PROFILE_PAGES = {
    stats: renderProfileStatsPage,
    achievements: renderProfileAchievementsPage,
    appearance: renderProfileAppearancePage,
    settings: renderProfileSettingsPage,
    support: renderProfileSupportPage,
    referral: renderProfileReferralPage,
    archive: renderProfileArchivePage
}


/* =========================================================
   ИНИЦИАЛИЗИРОВАТЬ СОБЫТИЯ ПРОФИЛЯ
   ========================================================= */

export function initProfileEvents(
    root,
    {
        renderMainPage
    } = {}
) {
    if (!root) {
        return
    }

    if (
        initializedRoots.has(root)
    ) {
        return
    }

    root.addEventListener(
        "click",
        (event) => {
            handleProfileClick(
                event,
                root,
                renderMainPage
            )
        }
    )

    initializedRoots.add(root)
}


/* =========================================================
   ОБРАБОТАТЬ НАЖАТИЕ
   ========================================================= */

function handleProfileClick(
    event,
    root,
    renderMainPage
) {

    /* -----------------------------------------------------
       Открытие внутреннего раздела
       ----------------------------------------------------- */

    const pageButton =
        event.target.closest(
            "[data-profile-page]"
        )

    if (pageButton) {
        const page =
            pageButton.dataset.profilePage

        openProfileSection(
            root,
            page
        )

        return
    }


    /* -----------------------------------------------------
       Возврат на главную страницу профиля
       ----------------------------------------------------- */

    const backButton =
        event.target.closest(
            "[data-profile-back]"
        )

    if (
        backButton &&
        typeof renderMainPage === "function"
    ) {
        renderMainPage(root)
    }
}


/* =========================================================
   ОТКРЫТЬ ВНУТРЕННИЙ РАЗДЕЛ
   ========================================================= */

function openProfileSection(
    root,
    page
) {
    const renderer =
        PROFILE_PAGES[page]

    if (
        typeof renderer !== "function"
    ) {
        console.warn(
            `Profile: неизвестный раздел "${page}"`
        )

        return
    }

    renderer(root)
}
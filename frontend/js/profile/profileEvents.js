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

import {
    isProfileFeatureEnabled
} from "./profileFeatures.js"


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
   ИНИЦИАЛИЗИРОВАТЬ СОБЫТИЯ
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

        if (
            !isProfileFeatureEnabled(page)
        ) {
            showProfileDevelopmentMessage()

            return
        }

        openProfileSection(
            root,
            page
        )

        return
    }


    /* -----------------------------------------------------
       Возврат назад
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
   ОТКРЫТЬ РАЗДЕЛ
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


/* =========================================================
   РАЗДЕЛ В РАЗРАБОТКЕ
   ========================================================= */

function showProfileDevelopmentMessage() {
    const message =
        "Раздел пока ещё находится на этапе разработки"

    /*
        В Telegram Mini App используем родной alert,
        если он доступен.
    */

    const telegramWebApp =
        window.Telegram?.WebApp

    if (
        telegramWebApp &&
        typeof telegramWebApp.showAlert === "function"
    ) {
        telegramWebApp.showAlert(message)

        return
    }


    /*
        Обычный браузер / локальная разработка.
    */

    window.alert(message)
}
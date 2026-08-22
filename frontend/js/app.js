import {
    initHabitsEvents,
    openHabitsPageFromStore
} from "./habits/habitsMain.js"

import {
    openLeaderboardPage
} from "./leaderboard/leaderboardMain.js"

import {
    openProfilePage
} from "./profile/profileMain.js"

import {
    setActiveNavigationPage,
    canAccessProfile
} from "./navigation.js"

import {
    bootstrapApp
} from "./core/appBootstrap.js"


function initTelegramWebApp() {
    const telegram =
        window.Telegram?.WebApp

    if (!telegram) {
        console.warn(
            "Telegram WebApp API недоступен"
        )

        return
    }

    telegram.ready()
    telegram.expand()

    if (
        typeof telegram.disableVerticalSwipes === "function"
    ) {
        telegram.disableVerticalSwipes()
    }

    window.initData =
        telegram.initData
}


function handleNavigation(event) {
    const page =
        event.detail?.page

    const habitsPage =
        document.getElementById(
            "habits-v2-page"
        )

    const leaderboardPage =
        document.getElementById(
            "leaderboard-v2-page"
        )

    const leaderboardRoot =
        document.getElementById(
            "leaderboard-v2-root"
        )

    const profilePage =
        document.getElementById(
            "profile-v2-page"
        )

    const profileRoot =
        document.getElementById(
            "profile-v2-root"
        )


    /* =====================================================
       ЛИДЕРБОРД
       ====================================================== */

    if (page === "leaderboard") {
        habitsPage.hidden = true
        habitsPage.classList.remove(
            "active"
        )

        profilePage.hidden = true
        profilePage.classList.remove(
            "active"
        )

        leaderboardPage.hidden = false
        leaderboardPage.classList.add(
            "active"
        )

        openLeaderboardPage(
            leaderboardRoot
        )

        setActiveNavigationPage(
            "leaderboard"
        )

        return
    }


    /* =====================================================
       ПРОФИЛЬ
       ====================================================== */

    if (page === "profile") {
        if (!canAccessProfile()) {
            return
        }

        habitsPage.hidden = true
        habitsPage.classList.remove(
            "active"
        )

        leaderboardPage.hidden = true
        leaderboardPage.classList.remove(
            "active"
        )

        profilePage.hidden = false
        profilePage.classList.add(
            "active"
        )

        openProfilePage(
            profileRoot
        )

        setActiveNavigationPage(
            "profile"
        )

        return
    }


    /* =====================================================
       ПРИВЫЧКИ
       ====================================================== */

    if (page === "habits") {
        leaderboardPage.hidden = true
        leaderboardPage.classList.remove(
            "active"
        )

        profilePage.hidden = true
        profilePage.classList.remove(
            "active"
        )

        habitsPage.hidden = false
        habitsPage.classList.add(
            "active"
        )

        openHabitsPageFromStore()

        setActiveNavigationPage(
            "habits"
        )

        return
    }
}


async function initV2() {
    const habitsPage =
        document.getElementById(
            "habits-v2-page"
        )

    const habitsRoot =
        document.getElementById(
            "habits-v2-root"
        )

    const leaderboardPage =
        document.getElementById(
            "leaderboard-v2-page"
        )

    const leaderboardRoot =
        document.getElementById(
            "leaderboard-v2-root"
        )

    const profilePage =
        document.getElementById(
            "profile-v2-page"
        )

    const profileRoot =
        document.getElementById(
            "profile-v2-root"
        )


    if (!habitsPage) {
        console.error(
            "V2: не найдена страница #habits-v2-page"
        )

        return
    }

    if (!habitsRoot) {
        console.error(
            "V2: не найден контейнер #habits-v2-root"
        )

        return
    }

    if (!leaderboardPage) {
        console.error(
            "V2: не найдена страница #leaderboard-v2-page"
        )

        return
    }

    if (!leaderboardRoot) {
        console.error(
            "V2: не найден контейнер #leaderboard-v2-root"
        )

        return
    }

    if (!profilePage) {
        console.error(
            "V2: не найдена страница #profile-v2-page"
        )

        return
    }

    if (!profileRoot) {
        console.error(
            "V2: не найден контейнер #profile-v2-root"
        )

        return
    }


    initTelegramWebApp()

    document.addEventListener(
        "app:navigate",
        handleNavigation
    )

    try {
        await bootstrapApp()

        initHabitsEvents({
            useStore: true
        })

        document.body.classList.add(
            "app-ready"
        )
    } catch (error) {
        console.error(
            "V2: стартовая загрузка приложения не удалась",
            error
        )

        const loaderText =
            document.querySelector(
                "[data-app-loader-text]"
            )

        if (loaderText) {
            loaderText.textContent =
                "Не удалось загрузить данные. Открой приложение ещё раз."
        }
    }
}


document.addEventListener(
    "DOMContentLoaded",
    initV2
)
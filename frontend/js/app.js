import {
    initHabitsEvents
} from "./habits/habitsMain.js"

import {
    openLeaderboardPage
} from "./leaderboard/leaderboardMain.js"

import {
    mountBottomNavigation,
    setActiveNavigationPage
} from "./navigation.js"


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


    if (page === "leaderboard") {
        habitsPage.hidden = true
        habitsPage.classList.remove("active")

        leaderboardPage.hidden = false
        leaderboardPage.classList.add("active")

        openLeaderboardPage(
            leaderboardRoot
        )

        setActiveNavigationPage(
            "leaderboard"
        )

        return
    }


    if (page === "habits") {
        leaderboardPage.hidden = true
        leaderboardPage.classList.remove("active")

        habitsPage.hidden = false
        habitsPage.classList.add("active")

        setActiveNavigationPage(
            "habits"
        )
    }
}


function initV2() {
    const habitsPage =
        document.getElementById(
            "habits-v2-page"
        )

    const habitsRoot =
        document.getElementById(
            "habits-v2-root"
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

    initTelegramWebApp()
    initHabitsEvents()
    mountBottomNavigation("habits")

    document.addEventListener(
        "app:navigate",
        handleNavigation
    )
}


document.addEventListener(
    "DOMContentLoaded",
    initV2
)
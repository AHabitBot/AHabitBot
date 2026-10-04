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

import {
    openSharedHabitInviteFromTelegram
} from "./habits/sharedHabitInvite.js"


import {
    t,
    initializeLanguageFromTelegram
} from "../i18n/core/i18n.js"



function renderLoaderTranslation() {
    const loaderText =
        document.querySelector(
            "[data-app-loader-text]"
        )

    if (loaderText) {
        loaderText.textContent =
            t("common.app.loadingProgress")
    }
}


function createLoaderProgressController() {
    const progressFill =
        document.querySelector(
            "[data-app-loader-progress]"
        )

    const percentText =
        document.querySelector(
            "[data-app-loader-percent]"
        )

    let current = 0
    let timer = null

    function render(value) {
        current = Math.max(
            current,
            Math.min(100, Math.round(value))
        )

        if (progressFill) {
            progressFill.style.width =
                `${current}%`
        }

        if (percentText) {
            percentText.textContent =
                `${current}%`
        }
    }

    function start() {
        render(0)

        timer = window.setInterval(
            () => {
                if (current >= 90) {
                    return
                }

                const step =
                    current < 35
                        ? 4
                        : current < 65
                            ? 2
                            : 1

                render(current + step)
            },
            90
        )
    }

    function stop() {
        if (timer !== null) {
            window.clearInterval(timer)
            timer = null
        }
    }

    async function complete() {
        stop()
        render(100)

        await new Promise(
            (resolve) =>
                window.setTimeout(
                    resolve,
                    240
                )
        )
    }

    return {
        start,
        stop,
        complete
    }
}


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


const PAGE_FADE_OUT_MS = 115
const PAGE_FADE_IN_MS = 180

let pageTransitionId = 0


function waitForPageTransition(milliseconds) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds)
    })
}


function getMainPageElements() {
    return {
        habits: document.getElementById(
            "habits-v2-page"
        ),
        leaderboard: document.getElementById(
            "leaderboard-v2-page"
        ),
        profile: document.getElementById(
            "profile-v2-page"
        )
    }
}


function renderMainNavigationPage(
    page,
    {
        leaderboardRoot,
        profileRoot
    }
) {
    if (page === "leaderboard") {
        openLeaderboardPage(
            leaderboardRoot
        )

        return true
    }

    if (page === "profile") {
        if (!canAccessProfile()) {
            return false
        }

        openProfilePage(
            profileRoot
        )

        return true
    }

    if (page === "habits") {
        openHabitsPageFromStore()
        return true
    }

    return false
}


async function handleNavigation(event) {
    const page =
        event.detail?.page

    const pages =
        getMainPageElements()

    const targetPage =
        pages[page]

    if (!targetPage) {
        return
    }

    const currentPage =
        Object.values(pages).find(
            (pageElement) =>
                pageElement &&
                !pageElement.hidden &&
                pageElement.classList.contains(
                    "active"
                )
        )

    if (currentPage === targetPage) {
        setActiveNavigationPage(page)
        return
    }

    const leaderboardRoot =
        document.getElementById(
            "leaderboard-v2-root"
        )

    const profileRoot =
        document.getElementById(
            "profile-v2-root"
        )

    const transitionId =
        ++pageTransitionId

    document.body.classList.add(
        "is-page-transitioning"
    )

    setActiveNavigationPage(page)

    if (currentPage) {
        currentPage.classList.add(
            "is-leaving"
        )
        currentPage.classList.remove(
            "active"
        )

        await waitForPageTransition(
            PAGE_FADE_OUT_MS
        )

        if (transitionId !== pageTransitionId) {
            return
        }

        currentPage.hidden = true
        currentPage.classList.remove(
            "is-leaving"
        )
    }

    targetPage.hidden = false
    targetPage.classList.add(
        "is-entering"
    )

    const rendered =
        renderMainNavigationPage(
            page,
            {
                leaderboardRoot,
                profileRoot
            }
        )

    if (!rendered) {
        targetPage.hidden = true

        if (currentPage) {
            currentPage.hidden = false
            currentPage.classList.add(
                "active"
            )
        }

        document.body.classList.remove(
            "is-page-transitioning"
        )

        return
    }

    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve)
        })
    })

    if (transitionId !== pageTransitionId) {
        return
    }

    targetPage.classList.add(
        "active"
    )
    targetPage.classList.remove(
        "is-entering"
    )

    await waitForPageTransition(
        PAGE_FADE_IN_MS
    )

    if (transitionId === pageTransitionId) {
        document.body.classList.remove(
            "is-page-transitioning"
        )
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

    // До первого кадра загрузки синхронизируем язык:
    // сохранённый ручной выбор имеет приоритет,
    // а при первом запуске берём язык Telegram.
    initializeLanguageFromTelegram()
    renderLoaderTranslation()

    document.addEventListener(
        "app:navigate",
        handleNavigation
    )

    const loaderProgress =
        createLoaderProgressController()

    loaderProgress.start()

    try {
        await bootstrapApp()

        // bootstrapApp синхронизирует язык с настройками пользователя.
        // Обновляем текст загрузки ещё раз, чтобы он точно соответствовал БД.
        renderLoaderTranslation()

        initHabitsEvents({
            useStore: true
        })

        await openSharedHabitInviteFromTelegram()

        await loaderProgress.complete()

        document.body.classList.add(
            "app-ready"
        )
    } catch (error) {
        loaderProgress.stop()
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
                t("common.app.loadError")
        }
    }
}


document.addEventListener(
    "DOMContentLoaded",
    initV2
)
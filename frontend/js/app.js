import {
    initHabitsEvents
} from "./habits/habitsMain.js";

import { openLeaderboardPage } from "./leaderboard/leaderboardMain.js";
import { mountBottomNavigation } from "./navigation.js";


/* =========================================================
   TELEGRAM WEB APP
   ========================================================= */

function initTelegramWebApp() {
    const telegram =
        window.Telegram?.WebApp;

    if (!telegram) {
        console.warn(
            "Telegram WebApp API недоступен"
        );

        return;
    }

    telegram.ready();
    telegram.expand();

    window.initData =
        telegram.initData;
}


/* =========================================================
   ПОЛУЧИТЬ СТРАНИЦЫ
   ========================================================= */

function getAppPages() {
    return {
        habits:
            document.getElementById(
                "habits-v2-page"
            ),

        leaderboard:
            document.getElementById(
                "leaderboard-v2-page"
            )
    };
}


/* =========================================================
   ПОКАЗАТЬ СТРАНИЦУ
   ========================================================= */

function showAppPage(pageName) {
    const pages =
        getAppPages();

    Object.entries(pages).forEach(
        ([name, page]) => {
            if (!page) {
                return;
            }

            const isActive =
                name === pageName;

            page.hidden =
                !isActive;

            page.classList.toggle(
                "active",
                isActive
            );
        }
    );
}


/* =========================================================
   НАВИГАЦИЯ ПРИЛОЖЕНИЯ
   ========================================================= */

function handleAppNavigation(event) {
    const page =
        event.detail?.page;

    if (page === "habits") {
        showAppPage("habits");
        return;
    }

    if (page === "leaderboard") {
        showAppPage("leaderboard");
        openLeaderboardPage();
    }
}


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================= */

function initV2() {
    const {
        habits,
        leaderboard
    } = getAppPages();

    const habitsRoot =
        document.getElementById(
            "habits-v2-root"
        );

    const leaderboardRoot =
        document.getElementById(
            "leaderboard-v2-root"
        );

    if (!habits || !habitsRoot) {
        console.error(
            "V2: не найдена страница привычек"
        );

        return;
    }

    if (!leaderboard || !leaderboardRoot) {
        console.error(
            "V2: не найдена страница лидерборда"
        );

        return;
    }

    initTelegramWebApp();

    showAppPage("habits");

    initHabitsEvents();

    mountBottomNavigation("habits");

    document.addEventListener(
        "app:navigate",
        handleAppNavigation
    );
}


/* =========================================================
   ЗАПУСК
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initV2
);
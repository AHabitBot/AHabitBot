import {
    RESOURCE_KEYS,
    hasResource
} from "../core/resourceCache.js";

import {
    renderLeaderboardHeader,
    renderLeaderboardContentShell
} from "./leaderboardComponents.js";

import {
    loadWeeklyLeaderboard,
    renderWeeklyLeaderboard
}
from "./season/seasonLeaderboard.js";


import {
    t
} from "../../i18n/core/i18n.js";

import {
    getPluralForm
} from "../../i18n/core/plural.js";

import {
    openPublicProfilePage
} from "../profile/publicProfile.js";

import {
    mountBottomNavigation,
    removeBottomNavigation
} from "../navigation.js";

let leaderboardRoot = null;

let activeRenderId = 0;


/* =========================================================
   ОТКРЫТЬ ЛИДЕРБОРД
   ========================================================= */

export function openLeaderboardPage(
    root
) {
    renderLeaderboardPage(root);

    return true;
}


/* =========================================================
   ОТРЕНДЕРИТЬ СТРАНИЦУ
   ========================================================= */

export function renderLeaderboardPage(
    root
) {
    if (!root) {
        console.error(
            "Leaderboard: корневой контейнер не найден"
        );

        return;
    }

    destroyLeaderboardPage();

    leaderboardRoot = root;

    leaderboardRoot.innerHTML = `
        <main class="leaderboard-page">
            ${renderLeaderboardHeader()}
            ${renderLeaderboardContentShell()}
        </main>
    `;

    bindPublicProfileEvents(
        leaderboardRoot
    );

    void renderActiveLeaderboardContent();

}


/* =========================================================
   ОТРЕНДЕРИТЬ АКТИВНУЮ ВКЛАДКУ
   ========================================================= */

async function renderActiveLeaderboardContent() {
    if (!leaderboardRoot) {
        return;
    }

    const currentRenderId = ++activeRenderId;
    const content = leaderboardRoot.querySelector(
        "[data-leaderboard-content]"
    );
    const currentUserSlot = leaderboardRoot.querySelector(
        "[data-leaderboard-current-user]"
    );

    if (!content) {
        console.error("Leaderboard: контейнер содержимого не найден");
        return;
    }

    resetLeaderboardScroll();
    await renderWeeklyLeaderboardContent({
        content,
        currentUserSlot,
        renderId: currentRenderId
    });
}


/* =========================================================
   СЕЗОННЫЙ РЕЙТИНГ
   ========================================================= */

async function renderWeeklyLeaderboardContent({
    content,
    currentUserSlot,
    renderId
}) {
    if (
        !hasResource(
            RESOURCE_KEYS.LEADERBOARD_WEEK
        )
    ) {
        setLeaderboardLoading({
            content,
            currentUserSlot
        });
    }

    try {
        const result =
            await loadWeeklyLeaderboard();

        if (
            !isRenderCurrent(renderId)
        ) {
            return;
        }

        const isEmptySeason = !result?.currentUser || result.currentUser.xp <= 0;
        setFinishedSeasonLayout(false);
        setEmptySeasonLayout(isEmptySeason);
        content.innerHTML = renderWeeklyLeaderboard(result.users, result.currentUser);
        if (isEmptySeason) {
            hideLeagueHeading();
        } else {
            renderLeagueHeading(result.week);
        }
        if (currentUserSlot) currentUserSlot.innerHTML = "";

    } catch (error) {
        if (
            !isRenderCurrent(renderId)
        ) {
            return;
        }

        console.error(
            "Leaderboard: ошибка загрузки сезонного рейтинга",
            error
        );

        renderLeaderboardError({
            content,
            currentUserSlot,
            message:
                t("leaderboard.season.loadError")
        });
    }
}


/* =========================================================
   ШАПКА ЛИГИ — РЕАЛЬНЫЙ ОСТАТОК СЕЗОНА
   ========================================================= */

function renderLeagueHeading(season) {
    const remaining =
        leaderboardRoot?.querySelector(
            "[data-season-remaining]"
        );

    if (!remaining || !season) {
        hideLeagueHeading();
        return;
    }

    const days = getRemainingSeasonDays();

    remaining.textContent = formatRemainingDays(days);
    remaining.hidden = false;
}


function hideLeagueHeading() {
    const remaining =
        leaderboardRoot?.querySelector(
            "[data-season-remaining]"
        );

    if (remaining) {
        remaining.hidden = true;
    }
}


function getRemainingSeasonDays() {
    // Следующий понедельник, 00:01 по Europe/Kyiv.
    // Используем календарные дни Киева, не локальный часовой пояс телефона.
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit",
        day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit",
        hourCycle: "h23"
    }).formatToParts(new Date());
    const value = key => parts.find(part => part.type === key)?.value;
    const day = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[value("weekday")];
    if (day === undefined) return 0;
    const elapsedMinutes = Number(value("hour")) * 60 + Number(value("minute"));
    return day === 0 && elapsedMinutes < 1 ? 0 : (7 - day);
}

function formatRemainingDays(days) {
    const pluralForm = getPluralForm(days);

    return t(
        `leaderboard.league.remaining.${pluralForm}`,
        { count: days }
    );
}


function formatSeasonPeriod(
    startDate,
    endDate
) {
    if (!startDate || !endDate) {
        return "";
    }

    return (
        formatShortDate(startDate)
        + " – "
        + formatShortDate(endDate)
    );
}


function formatShortDate(
    value
) {
    const [
        year,
        month,
        day
    ] = value.split("-");

    if (!year || !month || !day) {
        return "";
    }

    return `${day}.${month}`;
}


/* =========================================================
   СОСТОЯНИЕ ЗАГРУЗКИ
   ========================================================= */

function setLeaderboardLoading({
    content,
    currentUserSlot
}) {
    content.innerHTML = `
        <div
            class="leaderboard-state"
            role="status"
            aria-live="polite"
        >
            ${t("leaderboard.common.loading")}
        </div>
    `;

    if (currentUserSlot) {
        currentUserSlot.innerHTML = "";
    }
}


/* =========================================================
   ОШИБКА
   ========================================================= */

function renderLeaderboardError({
    content,
    currentUserSlot,
    message
}) {
    setFinishedSeasonLayout(false);
    content.innerHTML = `
        <div
            class="leaderboard-state
                   leaderboard-state--error"
            role="alert"
        >
            ${escapeHtml(message)}
        </div>
    `;

    if (currentUserSlot) {
        currentUserSlot.innerHTML = "";
    }
}


/* =========================================================
   ОЧИСТИТЬ КОНТЕНТ
   ========================================================= */

function clearLeaderboardContent({
    content,
    currentUserSlot
}) {
    setFinishedSeasonLayout(false);
    content.innerHTML = "";

    if (currentUserSlot) {
        currentUserSlot.innerHTML = "";
    }
}


/* =========================================================
   ПРОВЕРКА АКТУАЛЬНОСТИ ЗАПРОСА
   ========================================================= */

function isRenderCurrent(renderId) {
    return (
        leaderboardRoot !== null
        && renderId === activeRenderId
    );
}


/* =========================================================
   LAYOUT ИТОГОВ СЕЗОНА

   На finished-экране нет фиксированной карточки текущего
   пользователя, поэтому не резервируем под неё место.
   ========================================================= */

function setFinishedSeasonLayout(isFinished) {
    const page =
        leaderboardRoot?.querySelector(
            ".leaderboard-page"
        );

    if (!page) {
        return;
    }

    page.classList.toggle(
        "leaderboard-page--season-finished",
        Boolean(isFinished)
    );
}


/* =========================================================
   LAYOUT 0 XP
   ========================================================= */

function setEmptySeasonLayout(isEmpty) {
    const page =
        leaderboardRoot?.querySelector(
            ".leaderboard-page"
        );

    if (!page) {
        return;
    }

    page.classList.toggle(
        "leaderboard-page--empty-season",
        Boolean(isEmpty)
    );
}


/* =========================================================
   СБРОС СКРОЛЛА
   ========================================================= */

function resetLeaderboardScroll() {
    const scrollArea =
        leaderboardRoot?.querySelector(
            ".leaderboard-scroll-area"
        );

    if (!scrollArea) {
        return;
    }

    scrollArea.scrollTop = 0;
}


/* =========================================================
   БЕЗОПАСНЫЙ ТЕКСТ
   ========================================================= */

function escapeHtml(
    value
) {
    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   УНИЧТОЖИТЬ СТРАНИЦУ
   ========================================================= */

export function destroyLeaderboardPage() {
    activeRenderId += 1;
    leaderboardRoot = null;
}


function bindPublicProfileEvents(root) {
    root.addEventListener(
        "click",
        (event) => {
            const target = event.target.closest(
                "[data-public-profile-user-id]"
            );

            if (!target) return;

            const userId = Number(
                target.dataset.publicProfileUserId
            );

            if (!Number.isInteger(userId) || userId <= 0) return;

            removeBottomNavigation();

            void openPublicProfilePage(
                root,
                userId,
                {
                    onBack: () => {
                        renderLeaderboardPage(root);
                        mountBottomNavigation("leaderboard");
                    }
                }
            );
        }
    );
}

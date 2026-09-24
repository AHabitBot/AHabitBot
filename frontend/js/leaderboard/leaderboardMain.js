import {
    RESOURCE_KEYS,
    hasResource
} from "../core/resourceCache.js";

import {
    renderLeaderboardHeader,
    renderLeaderboardContentShell,
    renderCurrentUser
} from "./leaderboardComponents.js";

import {
    loadSeasonLeaderboard,
    renderSeasonLeaderboard
}
from "./season/seasonLeaderboard.js";

import {
    renderFinishedSeason,
    bindFinishedSeasonEvents
} from "./season/seasonFinished.js";

import {
    t
} from "../../i18n/core/i18n.js";

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
    await renderSeasonLeaderboardContent({
        content,
        currentUserSlot,
        renderId: currentRenderId
    });
}


/* =========================================================
   СЕЗОННЫЙ РЕЙТИНГ
   ========================================================= */

async function renderSeasonLeaderboardContent({
    content,
    currentUserSlot,
    renderId
}) {
    if (
        !hasResource(
            RESOURCE_KEYS.LEADERBOARD_SEASON
        )
    ) {
        setLeaderboardLoading({
            content,
            currentUserSlot
        });
    }

    try {
        const result =
            await loadSeasonLeaderboard();

        if (
            !isRenderCurrent(renderId)
        ) {
            return;
        }

        const isFinished =
            result?.season?.status === "finished";

        setFinishedSeasonLayout(isFinished);

        content.innerHTML = isFinished
            ? renderFinishedSeason(result)
            : renderSeasonLeaderboard(result.users, result.currentUser);

        renderSeasonHeading(result.season);

        if (currentUserSlot) {
            currentUserSlot.innerHTML =
                isFinished || !result?.currentUser || result.currentUser.xp <= 0
                    ? ""
                    : renderCurrentUser(result.currentUser);
        }

        if (isFinished) {
            bindFinishedSeasonEvents(content);
        }

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
   ЗАГОЛОВОК СЕЗОНА
   ========================================================= */

function renderSeasonHeading(
    season
) {
    const heading =
        leaderboardRoot?.querySelector(
            "[data-season-heading]"
        );

    if (!heading || !season) {
        hideSeasonHeading();
        return;
    }

    const title =
        heading.querySelector(
            "[data-season-title]"
        );

    const dates =
        heading.querySelector(
            "[data-season-dates]"
        );

    if (title) {
        title.textContent =
            t(
                "leaderboard.season.title",
                {
                    number: season.number
                }
            );
    }

    if (dates) {
        dates.textContent =
            formatSeasonPeriod(
                season.startDate,
                season.status === "finished"
                    ? season.rankingEndDate
                    : season.endDate
            );
    }

    heading.hidden = false;
}


function hideSeasonHeading() {
    const heading =
        leaderboardRoot?.querySelector(
            "[data-season-heading]"
        );

    if (heading) {
        heading.hidden = true;
    }
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

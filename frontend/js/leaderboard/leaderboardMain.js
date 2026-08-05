import {
    canAccessLeaderboard,
    getActiveLeaderboardTab
} from "./leaderboardStore.js";

import {
    renderLeaderboardHeader,
    renderLeaderboardContentShell,
    renderCurrentUser
} from "./leaderboardComponents.js";

import {
    initLeaderboardEvents
} from "./leaderboardEvents.js";

import {
    loadGlobalLeaderboard
} from "./global/globalLeaderboard.js";

import {
    renderSeasonLeaderboard,
    seasonCurrentUser
} from "./season/seasonLeaderboard.js";


let leaderboardRoot = null;

let destroyLeaderboardEvents =
    null;

let activeRenderId = 0;
let shouldRefreshGlobalLeaderboard =
    true;

/* =========================================================
   ОТКРЫТЬ ЛИДЕРБОРД
   ========================================================= */

export function openLeaderboardPage(
    root
) {
    if (!canAccessLeaderboard()) {
        console.warn(
            "Leaderboard is unavailable for this user"
        );

        return false;
    }

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

    destroyLeaderboardEvents =
        initLeaderboardEvents({
            root: leaderboardRoot,

            onTabChange: () => {
                void renderActiveLeaderboardContent();
            }
        });
}


/* =========================================================
   ОТРЕНДЕРИТЬ АКТИВНУЮ ВКЛАДКУ
   ========================================================= */

async function renderActiveLeaderboardContent() {
    if (!leaderboardRoot) {
        return;
    }

    const currentRenderId =
        ++activeRenderId;

    const content =
        leaderboardRoot.querySelector(
            "[data-leaderboard-content]"
        );

    const currentUserSlot =
        leaderboardRoot.querySelector(
            "[data-leaderboard-current-user]"
        );

    if (!content) {
        console.error(
            "Leaderboard: контейнер содержимого не найден"
        );

        return;
    }

    const activeTab =
        getActiveLeaderboardTab();

    resetLeaderboardScroll();

    if (activeTab === "global") {
        await renderGlobalLeaderboardContent({
            content,
            currentUserSlot,
            renderId: currentRenderId
        });

        return;
    }

    if (activeTab === "season") {
        renderSeasonLeaderboardContent({
            content,
            currentUserSlot,
            renderId: currentRenderId
        });

        return;
    }

    clearLeaderboardContent({
        content,
        currentUserSlot
    });
}


/* =========================================================
   ГЛОБАЛЬНЫЙ РЕЙТИНГ
   ========================================================= */

async function renderGlobalLeaderboardContent({
    content,
    currentUserSlot,
    renderId
}) {
    setLeaderboardLoading({
        content,
        currentUserSlot
    });

    try {
        const refresh =
            shouldRefreshGlobalLeaderboard;

        const result =
            await loadGlobalLeaderboard({
                refresh
            });

        if (
            !isRenderCurrent(
                renderId,
                "global"
            )
        ) {
            return;
        }

        shouldRefreshGlobalLeaderboard =
            false;

        content.innerHTML =
            result.content;

        if (currentUserSlot) {
            currentUserSlot.innerHTML =
                renderCurrentUser(
                    result.currentUser
                );
        }

    } catch (error) {
        if (
            !isRenderCurrent(
                renderId,
                "global"
            )
        ) {
            return;
        }

        console.error(
            "Leaderboard: ошибка загрузки глобального рейтинга",
            error
        );

        renderLeaderboardError({
            content,
            currentUserSlot,
            message:
                error?.message
                || "Не удалось загрузить рейтинг"
        });
    }
}


/* =========================================================
   СЕЗОННЫЙ РЕЙТИНГ

   Пока продолжает использовать тестовые данные.
   ========================================================= */

function renderSeasonLeaderboardContent({
    content,
    currentUserSlot,
    renderId
}) {
    if (
        !isRenderCurrent(
            renderId,
            "season"
        )
    ) {
        return;
    }

    content.innerHTML =
        renderSeasonLeaderboard();

    if (currentUserSlot) {
        currentUserSlot.innerHTML =
            renderCurrentUser(
                seasonCurrentUser
            );
    }
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
            Загрузка рейтинга…
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
    content.innerHTML = "";

    if (currentUserSlot) {
        currentUserSlot.innerHTML = "";
    }
}


/* =========================================================
   ПРОВЕРКА АКТУАЛЬНОСТИ ЗАПРОСА
   ========================================================= */

function isRenderCurrent(
    renderId,
    expectedTab
) {
    return (
        leaderboardRoot !== null
        && renderId === activeRenderId
        && getActiveLeaderboardTab()
            === expectedTab
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

    if (
        typeof destroyLeaderboardEvents
        === "function"
    ) {
        destroyLeaderboardEvents();
    }

    destroyLeaderboardEvents = null;
    leaderboardRoot = null;
}
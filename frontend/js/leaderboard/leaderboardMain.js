import {
    canAccessLeaderboard,
    getActiveLeaderboardTab,
} from "./leaderboardStore.js";

import {
    renderLeaderboardHeader,
    renderLeaderboardContentShell,
    renderCurrentUser,
} from "./leaderboardComponents.js";

import {
    initLeaderboardEvents,
} from "./leaderboardEvents.js";

import {
    renderGlobalLeaderboard,
    globalCurrentUser,
} from "./global/globalLeaderboard.js";

import {
    renderSeasonLeaderboard,
    seasonCurrentUser,
} from "./season/seasonLeaderboard.js";


let leaderboardRoot = null;
let destroyLeaderboardEvents = null;


/* =========================================================
   OPEN
   ========================================================= */

export function openLeaderboardPage(root) {
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
   PAGE
   ========================================================= */

export function renderLeaderboardPage(root) {
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

    renderActiveLeaderboardContent();

    destroyLeaderboardEvents = initLeaderboardEvents({
        root: leaderboardRoot,
        onTabChange: renderActiveLeaderboardContent,
    });
}


/* =========================================================
   ACTIVE CONTENT
   ========================================================= */

function renderActiveLeaderboardContent() {
    if (!leaderboardRoot) {
        return;
    }

    const content = leaderboardRoot.querySelector(
        "[data-leaderboard-content]"
    );

    const currentUserSlot = leaderboardRoot.querySelector(
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

    content.dataset.activeTab =
        activeTab;

    if (activeTab === "global") {
        renderLeaderboardState({
            content,
            currentUserSlot,
            renderContent: renderGlobalLeaderboard,
            currentUser: globalCurrentUser,
        });

        return;
    }

    if (activeTab === "season") {
        renderLeaderboardState({
            content,
            currentUserSlot,
            renderContent: renderSeasonLeaderboard,
            currentUser: seasonCurrentUser,
        });

        return;
    }

    content.innerHTML = "";

    if (currentUserSlot) {
        currentUserSlot.innerHTML = "";
    }
}


/* =========================================================
   SHARED RENDER
   ========================================================= */

function renderLeaderboardState({
    content,
    currentUserSlot,
    renderContent,
    currentUser,
}) {
    content.innerHTML =
        renderContent();

    if (currentUserSlot) {
        currentUserSlot.innerHTML =
            renderCurrentUser(currentUser);
    }

    resetLeaderboardScroll();
}


/* =========================================================
   RESET SCROLL
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
   DESTROY
   ========================================================= */

export function destroyLeaderboardPage() {
    if (
        typeof destroyLeaderboardEvents
        === "function"
    ) {
        destroyLeaderboardEvents();
    }

    destroyLeaderboardEvents = null;
    leaderboardRoot = null;
}
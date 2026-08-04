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


let leaderboardRoot = null;
let destroyLeaderboardEvents = null;


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

    const activeTab = getActiveLeaderboardTab();

    content.dataset.activeTab = activeTab;

    if (activeTab === "global") {

        content.innerHTML =
            renderGlobalLeaderboard();

        if (currentUserSlot) {

            currentUserSlot.innerHTML =
                renderCurrentUser(
                    globalCurrentUser
                );

        }

        return;

    }

    content.innerHTML = "";

    if (currentUserSlot) {
        currentUserSlot.innerHTML = "";
    }

}


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
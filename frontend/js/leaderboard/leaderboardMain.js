import { canAccessLeaderboard } from "./leaderboardStore.js";
import { renderLeaderboardHeader } from "./leaderboardComponents.js";
import { renderGlobalLeaderboard } from "./global/globalLeaderboard.js";


/* =========================================================
   LEADERBOARD MAIN

   Главный контроллер страницы лидерборда.
   ========================================================= */


/* =========================================================
   ПОЛУЧИТЬ КОРНЕВОЙ КОНТЕЙНЕР
   ========================================================= */

function getLeaderboardRoot() {
    return document.getElementById(
        "leaderboard-v2-root"
    );
}


/* =========================================================
   ОТРИСОВАТЬ СТРАНИЦУ
   ========================================================= */

function renderLeaderboardPage() {
    const root =
        getLeaderboardRoot();

    if (!root) {
        console.error(
            "Leaderboard: не найден #leaderboard-v2-root"
        );

        return;
    }

    root.innerHTML = `
        <section class="leaderboard-page">

            ${renderLeaderboardHeader("global")}

            <main class="leaderboard-content">
                ${renderGlobalLeaderboard()}
            </main>

        </section>
    `;
}


/* =========================================================
   СОБЫТИЯ ВКЛАДОК
   ========================================================= */

function initLeaderboardTabs() {
    const root =
        getLeaderboardRoot();

    if (!root) {
        return;
    }

    const tabButtons =
        root.querySelectorAll(
            "[data-leaderboard-tab]"
        );

    tabButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                const tab =
                    button.dataset.leaderboardTab;

                /*
                   Сезонный рейтинг реализуем
                   после завершения глобального.
                */

                if (tab !== "global") {
                    return;
                }
            }
        );
    });
}


/* =========================================================
   ОТКРЫТЬ ЛИДЕРБОРД
   ========================================================= */

export function openLeaderboardPage() {
    if (!canAccessLeaderboard()) {
        console.warn(
            "Leaderboard is unavailable for this user"
        );

        return;
    }

    renderLeaderboardPage();
    initLeaderboardTabs();
}
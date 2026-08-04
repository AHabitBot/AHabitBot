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
        getLeaderboardRoot()

    if (!root) {
        return
    }

    const tabs =
        root.querySelector(
            ".leaderboard-tabs"
        )

    const tabButtons =
        root.querySelectorAll(
            "[data-leaderboard-tab]"
        )

    if (!tabs || tabButtons.length === 0) {
        return
    }

    tabButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                const selectedTab =
                    button.dataset.leaderboardTab

                if (!selectedTab) {
                    return
                }

                tabButtons.forEach(
                    (tabButton) => {
                        const isActive =
                            tabButton === button

                        tabButton.classList.toggle(
                            "is-active",
                            isActive
                        )

                        tabButton.setAttribute(
                            "aria-selected",
                            String(isActive)
                        )
                    }
                )

                tabs.dataset.activeTab =
                    selectedTab

                /*
                   Пока меняем только визуальное состояние.

                   Контент остаётся глобальным.
                   Сезонную страницу подключим позже.
                */
            }
        )
    })
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
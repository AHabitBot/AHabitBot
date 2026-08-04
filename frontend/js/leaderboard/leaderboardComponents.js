/* =========================================================
   LEADERBOARD COMPONENTS

   Общие компоненты для:
   - глобального рейтинга;
   - сезонного рейтинга;
   - рейтинга друзей.
   ========================================================= */


/* =========================================================
   ШАПКА ЛИДЕРБОРДА
   ========================================================= */

export function renderLeaderboardHeader(
    activeTab = "global"
) {
    return `
        <header class="leaderboard-header">

            <h1 class="leaderboard-header__title">
                Лидерборд
            </h1>

            <div
                class="leaderboard-tabs"
                role="tablist"
                aria-label="Разделы лидерборда"
            >

                <button
                    class="
                        leaderboard-tabs__button
                        ${
                            activeTab === "global"
                                ? "is-active"
                                : ""
                        }
                    "
                    type="button"
                    role="tab"
                    data-leaderboard-tab="global"
                    aria-selected="${
                        activeTab === "global"
                    }"
                >
                    Глобальный
                </button>

                <button
                    class="
                        leaderboard-tabs__button
                        ${
                            activeTab === "season"
                                ? "is-active"
                                : ""
                        }
                    "
                    type="button"
                    role="tab"
                    data-leaderboard-tab="season"
                    aria-selected="${
                        activeTab === "season"
                    }"
                >
                    Сезонный
                </button>

            </div>

        </header>
    `;
}
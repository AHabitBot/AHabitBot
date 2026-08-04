import {
    getActiveLeaderboardTab,
} from "./leaderboardStore.js";


function renderMaterialIcon(iconName) {
    return `
        <span
            class="material-symbols-rounded leaderboard-tabs__icon"
            aria-hidden="true"
        >
            ${iconName}
        </span>
    `;
}


/* =========================================================
   HEADER
   ========================================================= */

export function renderLeaderboardHeader() {

    const activeTab = getActiveLeaderboardTab();

    const isGlobalActive = activeTab === "global";
    const isSeasonActive = activeTab === "season";

    return `
        <header class="leaderboard-header">

            <h1 class="leaderboard-header__title">
                Лидерборд
            </h1>

            <div
                class="leaderboard-tabs"
                role="tablist"
                aria-label="Тип рейтинга"
            >

                <button
                    class="leaderboard-tabs__button ${
                        isGlobalActive
                            ? "leaderboard-tabs__button--active"
                            : ""
                    }"
                    type="button"
                    role="tab"
                    data-leaderboard-tab="global"
                    aria-selected="${isGlobalActive}"
                    tabindex="${isGlobalActive ? "0" : "-1"}"
                >

                    ${renderMaterialIcon("public")}

                    <span class="leaderboard-tabs__label">
                        Глобальный
                    </span>

                </button>

                <button
                    class="leaderboard-tabs__button ${
                        isSeasonActive
                            ? "leaderboard-tabs__button--active"
                            : ""
                    }"
                    type="button"
                    role="tab"
                    data-leaderboard-tab="season"
                    aria-selected="${isSeasonActive}"
                    tabindex="${isSeasonActive ? "0" : "-1"}"
                >

                    ${renderMaterialIcon("calendar_month")}

                    <span class="leaderboard-tabs__label">
                        Сезонный
                    </span>

                </button>

            </div>

        </header>
    `;
}


/* =========================================================
   CONTENT SHELL
   ========================================================= */

export function renderLeaderboardContentShell() {
    const activeTab = getActiveLeaderboardTab();

    return `
        <div class="leaderboard-scroll-area">
            <section
                class="leaderboard-content"
                data-leaderboard-content
                data-active-tab="${activeTab}"
                aria-live="polite"
            ></section>
        </div>

        <div
            class="leaderboard-current-user-slot"
            data-leaderboard-current-user
        ></div>
    `;
}




/* =========================================================
   TOP 3
   ========================================================= */

export function renderTopThree(users = []) {

    return `
        <section class="leaderboard-top-three">

            ${users.map(user => `

                <div
                    class="
                        leaderboard-top-card
                        leaderboard-top-card--${user.rank}
                    "
                >

                    <div class="leaderboard-top-card__medal">
                        ${user.medal}
                    </div>

                    <img
                        class="leaderboard-top-card__avatar"
                        src="${user.avatar}"
                        alt="${user.name}"
                    >

                    <div class="leaderboard-top-card__name">
                        ${user.name}
                    </div>

                    <div class="leaderboard-top-card__xp">

                        <span
                            class="material-symbols-rounded"
                        >
                            trophy
                        </span>

                        ${user.xp}

                        <span>XP</span>

                    </div>

                </div>

            `).join("")}

        </section>
    `;
}



export function renderLeaderboardList(users = []) {
    return `
        <section class="leaderboard-list">
            ${users.map(user => `
                <div class="leaderboard-list__row">
                    <span class="leaderboard-list__rank">
                        ${user.rank}
                    </span>

                    <img
                        class="leaderboard-list__avatar"
                        src="${user.avatar}"
                        alt="${user.name}"
                    >

                    <span class="leaderboard-list__name">
                        ${user.name}
                    </span>

                    <div class="leaderboard-list__xp">
                        <span
                            class="material-symbols-rounded
                                   leaderboard-list__trophy"
                            aria-hidden="true"
                        >
                            trophy
                        </span>

                        <span>${user.xp}</span>
                        <span>XP</span>
                    </div>
                </div>
            `).join("")}
        </section>
    `;
}


export function renderCurrentUser(user = null) {
    if (!user) {
        return "";
    }

    return `
        <section class="leaderboard-current-user">
            <span class="leaderboard-current-user__rank">
                ${user.rank}
            </span>

            <img
                class="leaderboard-current-user__avatar"
                src="${user.avatar}"
                alt="${user.name}"
            >

            <span class="leaderboard-current-user__name">
                ${user.name}
            </span>

            <div class="leaderboard-current-user__xp">
                <span
                    class="material-symbols-rounded
                           leaderboard-current-user__trophy"
                    aria-hidden="true"
                >
                    trophy
                </span>

                <span>${user.xp}</span>
                <span>XP</span>
            </div>
        </section>
    `;
}
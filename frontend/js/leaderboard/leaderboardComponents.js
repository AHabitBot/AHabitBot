import {
    getActiveLeaderboardTab,
} from "./leaderboardStore.js";


function renderMaterialIcon(
    iconName,
    className = ""
) {
    return `
        <span
            class="
                material-symbols-rounded
                ${className}
            "
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
    const activeTab =
        getActiveLeaderboardTab();

    const isGlobalActive =
        activeTab === "global";

    const isSeasonActive =
        activeTab === "season";

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
                    class="
                        leaderboard-tabs__button
                        ${
                            isGlobalActive
                                ? "leaderboard-tabs__button--active"
                                : ""
                        }
                    "
                    type="button"
                    role="tab"
                    data-leaderboard-tab="global"
                    aria-selected="${isGlobalActive}"
                    tabindex="${isGlobalActive ? "0" : "-1"}"
                >
                    ${renderMaterialIcon(
                        "public",
                        "leaderboard-tabs__icon"
                    )}

                    <span class="leaderboard-tabs__label">
                        Глобальный
                    </span>
                </button>


                <button
                    class="
                        leaderboard-tabs__button
                        ${
                            isSeasonActive
                                ? "leaderboard-tabs__button--active"
                                : ""
                        }
                    "
                    type="button"
                    role="tab"
                    data-leaderboard-tab="season"
                    aria-selected="${isSeasonActive}"
                    tabindex="${isSeasonActive ? "0" : "-1"}"
                >
                    ${renderMaterialIcon(
                        "calendar_month",
                        "leaderboard-tabs__icon"
                    )}

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
    const activeTab =
        getActiveLeaderboardTab();

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
    if (!users.length) {
        return "";
    }

    return `
        <section
            class="leaderboard-top-three"
            aria-label="Три лучших участника"
        >
            ${users.map((user) => `
                <article
                    class="
                        leaderboard-top-card
                        leaderboard-top-card--${user.rank}
                    "
                >
                    <div
                        class="leaderboard-top-card__crown"
                        aria-label="${user.rank} место"
                    >
                        ${renderMaterialIcon(
                            "crown",
                            "leaderboard-top-card__crown-icon"
                        )}

                        <span class="leaderboard-top-card__rank">
                            ${user.rank}
                        </span>
                    </div>

                    <div class="leaderboard-top-card__avatar-wrap">
                        <img
                            class="leaderboard-top-card__avatar"
                            src="${user.avatar}"
                            alt="${user.name}"
                        >
                    </div>

                    <div class="leaderboard-top-card__name">
                        ${user.name}
                    </div>

                    <div class="leaderboard-top-card__xp">
                        ${renderMaterialIcon(
                            "award_star",
                            "leaderboard-top-card__xp-icon"
                        )}

                        <span class="leaderboard-top-card__xp-value">
                            ${user.xp}
                        </span>
                    </div>

                    <div class="leaderboard-top-card__streak">
                        ${renderMaterialIcon(
                            "local_fire_department",
                            "leaderboard-top-card__streak-icon"
                        )}

                        <span class="leaderboard-top-card__streak-value">
                            ${formatStreak(user.streak)}
                        </span>
                    </div>
                </article>
            `).join("")}
        </section>
    `;
}


/* =========================================================
   LEADERBOARD LIST
   ========================================================= */

export function renderLeaderboardList(users = []) {
    if (!users.length) {
        return "";
    }

    return `
        <section
            class="leaderboard-list"
            aria-label="Участники рейтинга"
        >
            ${users.map((user) => `
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
                        ${renderMaterialIcon(
                            "award_star",
                            "leaderboard-list__trophy"
                        )}

                        <span>${user.xp}</span>
                    </div>
                </div>
            `).join("")}
        </section>
    `;
}


/* =========================================================
   CURRENT USER
   ========================================================= */

export function renderCurrentUser(user = null) {
    if (!user) {
        return "";
    }

    return `
        <section
            class="leaderboard-current-user"
            aria-label="Ваше место в рейтинге"
        >
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
                ${renderMaterialIcon(
                    "award_star",
                    "leaderboard-current-user__trophy"
                )}

                <span>${user.xp}</span>
            </div>
        </section>
    `;
}


/* =========================================================
   STREAK FORMAT
   ========================================================= */

function formatStreak(value) {
    const streak =
        Number.isFinite(Number(value))
            ? Math.max(0, Number(value))
            : 0;

    const lastTwoDigits =
        streak % 100;

    const lastDigit =
        streak % 10;

    if (
        lastTwoDigits >= 11
        && lastTwoDigits <= 14
    ) {
        return `${streak} дней`;
    }

    if (lastDigit === 1) {
        return `${streak} день`;
    }

    if (
        lastDigit >= 2
        && lastDigit <= 4
    ) {
        return `${streak} дня`;
    }

    return `${streak} дней`;
}
import {
    getLanguage,
    t
} from "../../i18n/core/i18n.js";

import {
    getPluralForm
} from "../../i18n/core/plural.js";

import {
    getActiveLeaderboardTab,
} from "./leaderboardStore.js";


/* =========================================================
   MATERIAL ICON
   ========================================================= */

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

<div class="leaderboard-header__title-row">

    <h1 class="leaderboard-header__title">
        ${t("leaderboard.common.title")}
    </h1>

    <div
        class="leaderboard-season-heading"
        data-season-heading
        hidden
    >
        <span
            class="leaderboard-season-heading__title"
            data-season-title
        ></span>

        <span
            class="leaderboard-season-heading__dates"
            data-season-dates
        ></span>
    </div>

</div>

            <div
                class="leaderboard-tabs"
                role="tablist"
                aria-label="${t("leaderboard.common.tabsAria")}"
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
                        ${t("leaderboard.common.globalTab")}
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
                        ${t("leaderboard.common.seasonTab")}
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
    return `
        <div class="leaderboard-scroll-area">
            <section
                class="leaderboard-content"
                data-leaderboard-content
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
            aria-label="${t("leaderboard.common.topThreeAria")}"
        >
            ${users.map((user) => `
                <article
                    class="
                        leaderboard-top-card
                        leaderboard-top-card--${user.rank}
                    "
                >
                    ${renderRankChange(
                        user.rankChange,
                        "leaderboard-top-card__rank-change"
                    )}

                    <div
                        class="leaderboard-top-card__crown"
                        aria-label="${t("leaderboard.common.placeAria", { rank: user.rank })}"
                    >
                        ${renderMaterialIcon(
                            "crown",
                            "leaderboard-top-card__crown-icon"
                        )}
                    </div>

                    <div class="leaderboard-top-card__avatar-wrap">
                        <img
                            class="leaderboard-top-card__avatar"
                            src="${user.avatar}"
                            alt="${escapeHtml(getDisplayName(user))}"
                        >
                    </div>

                    <div class="leaderboard-top-card__name">
                        ${escapeHtml(getDisplayName(user))}
                    </div>

                    <div
                        class="leaderboard-top-card__xp"
                        aria-label="${t("leaderboard.common.xpAria", { xp: formatNumber(user.xp) })}"
                    >
                        ${renderMaterialIcon(
                            "award_star",
                            "leaderboard-top-card__xp-icon"
                        )}

                        <span class="leaderboard-top-card__xp-value">
                            ${formatNumber(user.xp)}
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
   LEADERBOARD LIST — МЕСТА 4–100
   ========================================================= */

export function renderLeaderboardList(users = []) {
    if (!users.length) {
        return "";
    }

    return `
        <section
            class="leaderboard-list"
            aria-label="${t("leaderboard.common.participantsAria")}"
        >
            ${users.map((user) => `
                <article class="leaderboard-list__row">

                    <div class="leaderboard-list__rank-wrap">
                        <span class="leaderboard-list__rank">
                            ${user.rank}
                        </span>

                        ${renderRankChange(
                            user.rankChange,
                            "leaderboard-list__rank-change"
                        )}
                    </div>

                    <img
                        class="leaderboard-list__avatar"
                        src="${user.avatar}"
                        alt="${escapeHtml(getDisplayName(user))}"
                    >

                    <div class="leaderboard-list__info">

                        <span class="leaderboard-list__name">
                            ${escapeHtml(getDisplayName(user))}
                        </span>

                        <div class="leaderboard-list__streak">
                            ${renderMaterialIcon(
                                "local_fire_department",
                                "leaderboard-list__streak-icon"
                            )}

                            <span class="leaderboard-list__streak-value">
                                ${formatStreak(user.streak)}
                            </span>
                        </div>

                    </div>

                    <div
                        class="leaderboard-list__xp"
                        aria-label="${t("leaderboard.common.xpAria", { xp: formatNumber(user.xp) })}"
                    >
                        ${renderMaterialIcon(
                            "award_star",
                            "leaderboard-list__xp-icon"
                        )}

                        <span class="leaderboard-list__xp-value">
                            ${formatNumber(user.xp)}
                        </span>
                    </div>

                </article>
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
            aria-label="${t("leaderboard.common.currentUserAria")}"
        >
            <div class="leaderboard-current-user__rank-wrap">
                <span class="leaderboard-current-user__rank">
                    ${user.rank}
                </span>

                ${renderRankChange(
                    user.rankChange,
                    "leaderboard-current-user__rank-change"
                )}
            </div>

            <img
                class="leaderboard-current-user__avatar"
                src="${user.avatar}"
                alt="${escapeHtml(getDisplayName(user))}"
            >

            <div class="leaderboard-current-user__info">

                <span class="leaderboard-current-user__name">
                    ${escapeHtml(getDisplayName(user))}
                </span>

                <div class="leaderboard-current-user__streak">
                    ${renderMaterialIcon(
                        "local_fire_department",
                        "leaderboard-current-user__streak-icon"
                    )}

                    <span class="leaderboard-current-user__streak-value">
                        ${formatStreak(user.streak)}
                    </span>
                </div>

            </div>

            <div
                class="leaderboard-current-user__xp"
                aria-label="${t("leaderboard.common.xpAria", { xp: formatNumber(user.xp) })}"
            >
                ${renderMaterialIcon(
                    "award_star",
                    "leaderboard-current-user__xp-icon"
                )}

                <span class="leaderboard-current-user__xp-value">
                    ${user.xp}
                </span>
            </div>
        </section>
    `;
}




/* =========================================================
   RANK CHANGE
   ========================================================= */

function renderRankChange(
    value,
    className = ""
) {
    const change = Number(value);

    if (
        !Number.isFinite(change)
        || change === 0
    ) {
        return "";
    }

    const isUp = change > 0;
    const amount = Math.abs(
        Math.trunc(change)
    );

    return `
        <span
            class="
                leaderboard-rank-change
                ${
                    isUp
                        ? "leaderboard-rank-change--up"
                        : "leaderboard-rank-change--down"
                }
                ${className}
            "
        >
            ${renderMaterialIcon(
                isUp
                    ? "arrow_upward"
                    : "arrow_downward",
                "leaderboard-rank-change__icon"
            )}

            <span class="leaderboard-rank-change__value">
                ${amount}
            </span>
        </span>
    `;
}

/* =========================================================
   STREAK FORMAT
   ========================================================= */

function formatStreak(value) {
    const numericValue =
        Number(value);

    const streak =
        Number.isFinite(numericValue)
            ? Math.max(0, Math.floor(numericValue))
            : 0;

    const form =
        getPluralForm(streak);

    return t(
        `leaderboard.common.days.${form}`,
        {
            count: streak
        }
    );
}


/* =========================================================
   DISPLAY NAME
   ========================================================= */

function getDisplayName(user) {
    if (user?.isCurrentUser) {
        return t("leaderboard.common.you");
    }

    const name =
        String(user?.name || "").trim();

    return (
        name
        || t("leaderboard.common.userFallback")
    );
}


/* =========================================================
   NUMBER FORMAT
   ========================================================= */

function formatNumber(value) {
    const localeByLanguage = {
        ru: "ru-RU",
        uk: "uk-UA",
        en: "en-US"
    };

    const locale =
        localeByLanguage[getLanguage()]
        || localeByLanguage.ru;

    const number =
        Number.isFinite(Number(value))
            ? Math.max(0, Math.floor(Number(value)))
            : 0;

    return new Intl.NumberFormat(locale)
        .format(number)
        .replaceAll("\u00A0", " ")
        .replaceAll("\u202F", " ");
}


/* =========================================================
   SAFE TEXT
   ========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
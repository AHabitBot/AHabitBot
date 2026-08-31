import {
    t
} from "../../../i18n/core/i18n.js";

import {
    RESOURCE_KEYS,
    peekResource
} from "../../core/resourceCache.js";


/* =========================================================
   ИТОГОВЫЙ ЭКРАН СЕЗОНА

   Отдельный renderer finished-состояния сезонной вкладки.
   Live Season leaderboard остаётся в seasonLeaderboard.js.
   ========================================================= */

export function renderFinishedSeason(result) {
    const season = result?.season || {};
    const summary = result?.summary || {};
    const current = result?.currentUser;
    const top3 = getTopThree(result?.top3 || []);
    const next = result?.nextSeason || {};

    const referral =
        peekResource(
            RESOURCE_KEYS.REFERRAL
        );

    const referralLink =
        referral?.referral_link || "";

    const userResult = current
        ? renderCurrentUserResult(current)
        : renderNoCurrentUserResult();

    return `
        <div class="season-finished">

            <section class="season-finished-hero">
                <div>
                    <h2>
                        ${t(
                            "leaderboard.season.finishedTitle",
                            { number: season.number }
                        )}
                    </h2>

                    <div class="season-finished-hero__dates">
                        ${formatDate(season.startDate)} –
                        ${formatDate(season.rankingEndDate)}
                    </div>

                    <p>
                        ${t("leaderboard.season.finishedWork")}
                        <br>
                        ${t(
                            "leaderboard.season.nextStarts",
                            {
                                date:
                                    formatDate(
                                        next.startDate
                                    )
                            }
                        )}
                    </p>
                </div>

                <div
                    class="season-finished-hero__cup"
                    aria-hidden="true"
                >
                    🏆
                </div>
            </section>

            <section class="season-finished-card">
                <h3>
                    ${t("leaderboard.season.yourResults")}
                </h3>

                <div class="season-finished-user">
                    ${userResult}
                </div>
            </section>

            <section class="season-finished-card">
                <h3>
                    ${t("leaderboard.season.top3Title")}
                </h3>

                ${
                    top3.length
                        ? renderFinishedTop3(top3)
                        : `<div class="season-finished-empty">—</div>`
                }
            </section>

            <section class="season-finished-card">
                <h3>
                    ${t("leaderboard.season.summaryTitle")}
                </h3>

                <div class="season-summary-grid">
                    ${renderMetric(
                        "groups",
                        t("leaderboard.season.participants"),
                        summary.participants ?? 0
                    )}

                    ${renderMetric(
                        "task_alt",
                        t("leaderboard.season.confirmations"),
                        summary.confirmations ?? 0
                    )}

                    ${renderMetric(
                        "local_fire_department",
                        t("leaderboard.season.bestStreak"),
                        summary.best_streak ?? 0
                    )}

                    ${renderMetric(
                        "favorite",
                        t("leaderboard.season.popularHabit"),
                        escapeHtml(
                            summary.popular_habit || "—"
                        )
                    )}
                </div>
            </section>

            <section class="season-finished-next">
                <span>
                    ${t("leaderboard.season.nextSeason")}
                </span>

                <strong>
                    ${t(
                        "leaderboard.season.title",
                        { number: next.number }
                    )}
                </strong>

                <small>
                    ${formatDate(next.startDate)} –
                    ${formatDate(next.endDate)}
                </small>
            </section>

            <button
                class="season-finished-share"
                type="button"
                data-season-share
                data-referral-link="${escapeAttribute(referralLink)}"
            >
                <span class="material-symbols-rounded">
                    person_add
                </span>

                ${t("leaderboard.season.inviteFriend")}
            </button>

        </div>
    `;
}


/* =========================================================
   SHARE
   ========================================================= */

export function bindFinishedSeasonEvents(root) {
    const button =
        root?.querySelector(
            "[data-season-share]"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {
            const referralLink =
                button.dataset.referralLink;

            if (!referralLink) {
                return;
            }

            const shareUrl =
                "https://t.me/share/url?url="
                + encodeURIComponent(referralLink)
                + "&text="
                + encodeURIComponent(
                    t("profile.referral.shareText")
                );

            const telegram =
                window.Telegram?.WebApp;

            if (
                telegram
                && typeof telegram.openTelegramLink
                    === "function"
            ) {
                telegram.openTelegramLink(
                    shareUrl
                );

                return;
            }

            window.open(
                shareUrl,
                "_blank",
                "noopener,noreferrer"
            );
        }
    );
}


/* =========================================================
   РЕЗУЛЬТАТ ПОЛЬЗОВАТЕЛЯ
   ========================================================= */

function renderCurrentUserResult(user) {
    return `
        <div class="season-finished-user__avatar">
            <img
                src="${escapeAttribute(user.avatar)}"
                alt=""
            >
        </div>

        <div class="season-finished-user__metric">
            <span>
                ${t("leaderboard.season.yourPlace")}
            </span>

            <strong>#${user.rank}</strong>
        </div>

        <div class="season-finished-user__metric">
            <span>
                ${t("leaderboard.season.earned")}
            </span>

            <strong>${user.xp} XP</strong>
        </div>
    `;
}


function renderNoCurrentUserResult() {
    return `
        <div class="season-finished-user__empty">
            ${t("leaderboard.season.noResult")}
        </div>
    `;
}


/* =========================================================
   TOP-3
   ========================================================= */

function renderFinishedTop3(users) {
    return `
        <div class="season-finished-top3">
            ${users.map((user) => `
                <div
                    class="
                        season-finished-top3__item
                        season-finished-top3__item--${user.rank}
                    "
                >
                    <span class="season-finished-top3__rank">
                        #${user.rank}
                    </span>

                    <img
                        src="${escapeAttribute(user.avatar)}"
                        alt="${escapeAttribute(user.name)}"
                    >

                    <strong>
                        ${escapeHtml(user.name)}
                    </strong>

                    <small>${user.xp} XP</small>
                </div>
            `).join("")}
        </div>
    `;
}


function getTopThree(users = []) {
    const usersByRank =
        new Map(
            users.map(
                (user) => [
                    user.rank,
                    user
                ]
            )
        );

    return [
        usersByRank.get(2),
        usersByRank.get(1),
        usersByRank.get(3)
    ].filter(Boolean);
}


/* =========================================================
   ПОКАЗАТЕЛЬ
   ========================================================= */

function renderMetric(
    icon,
    label,
    value
) {
    return `
        <div class="season-summary-item">
            <span class="material-symbols-rounded">
                ${icon}
            </span>

            <div>
                <small>${label}</small>
                <strong>${value}</strong>
            </div>
        </div>
    `;
}


/* =========================================================
   FORMAT / ESCAPE
   ========================================================= */

function formatDate(value) {
    if (!value) {
        return "";
    }

    const [
        year,
        month,
        day
    ] = String(value).split("-");

    if (!year || !month || !day) {
        return "";
    }

    return `${day}.${month}.${year}`;
}


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {
    return escapeHtml(value);
}

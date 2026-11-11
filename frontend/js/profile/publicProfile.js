import {
    fetchPublicProfile
} from "./publicProfileApi.js";

import { apiRequest } from "../api/apiClient.js";
import { loadSocialCounts } from "./social/profileSocialCounts.js";

import {
    renderProfileUserCard,
    renderProfileSectionHeader
} from "./profileComponents.js";

import {
    fetchProfileStats
} from "./stats/profileStatsApi.js";

import {
    renderProfileStatsBody
} from "./stats/profileStats.js";

import {
    t
} from "../../i18n/core/i18n.js";


const PERIODS = [
    "week",
    "month",
    "year"
];

const publicStatsCache =
    new Map();


function getUserCache(userId) {
    const key =
        String(userId);

    if (
        !publicStatsCache.has(key)
    ) {
        publicStatsCache.set(
            key,
            {
                profile: null,
                stats: new Map(),
                requests: new Map(),
                profileRequest: null
            }
        );
    }

    return publicStatsCache.get(
        key
    );
}


function loadProfile(
    userId,
    cache
) {
    if (cache.profile) {
        return Promise.resolve(
            cache.profile
        );
    }

    if (!cache.profileRequest) {
        cache.profileRequest =
            fetchPublicProfile(userId)
                .then((profile) => {
                    cache.profile =
                        profile;

                    return profile;
                })
                .finally(() => {
                    cache.profileRequest =
                        null;
                });
    }

    return cache.profileRequest;
}



function loadStats(
    userId,
    period,
    cache
) {
    if (
        cache.stats.has(
            period
        )
    ) {
        return Promise.resolve(
            cache.stats.get(
                period
            )
        );
    }

    if (
        !cache.requests.has(
            period
        )
    ) {
        const request =
            fetchProfileStats(
                period,
                userId
            )
                .then((data) => {
                    cache.stats.set(
                        period,
                        data
                    );

                    return data;
                })
                .finally(() => {
                    cache.requests.delete(
                        period
                    );
                });

        cache.requests.set(
            period,
            request
        );
    }

    return cache.requests.get(
        period
    );
}


function renderShell(
    root
) {
    root.innerHTML = `
        <section class="profile-stats-page public-profile-page">

            <div data-public-profile-header>
                ${renderProfileSectionHeader(
                    t("profile.main.title")
                )}
            </div>

            <div
                class="public-profile-card"
                data-public-profile-card
            ></div>

            <h2 class="public-profile-stats-title">
                ${t("profile.stats.title")}
            </h2>

            <main
                class="profile-stats-body"
                data-public-profile-stats
            >
                <div class="profile-stats-loading">
                    <div
                        class="profile-stats-loading__spinner"
                    ></div>

                    <span>
                        ${t("profile.stats.loading")}
                    </span>
                </div>
            </main>

        </section>
    `;
}


// The social button is available only in the closed test account.
// The backend independently validates the Telegram initData.
async function bindPublicFollow(cardRoot, userId) {
    const button = cardRoot.querySelector("[data-public-follow-action]");
    if (!button) return;

    let isFollowing = false;
    let busy = false;
    const setButton = () => {
        button.textContent = isFollowing ? t("profile.social.unfollow") : t("profile.social.follow");
        button.setAttribute("aria-label", isFollowing ? t("profile.social.unfollow") : t("profile.social.follow"));
        button.disabled = busy;
    };

    try {
        const summary = await apiRequest(`/api/follows/users/${encodeURIComponent(userId)}`);
        if (!button.isConnected) return;
        isFollowing = Boolean(summary.is_following);
        setButton();
        const counts = cardRoot.querySelectorAll(".profile-user-card__social-count strong");
        if (counts.length === 2) {
            counts[0].textContent = String(summary.following_count ?? 0);
            counts[1].textContent = String(summary.followers_count ?? 0);
        }
    } catch (error) {
        console.error("Follow status:", error);
        return;
    }

    button.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (busy) return;
        busy = true;
        setButton();
        try {
            const result = await apiRequest(
                `/api/follows/users/${encodeURIComponent(userId)}`,
                { method: isFollowing ? "DELETE" : "POST" }
            );
            isFollowing = Boolean(result.is_following);
            await loadSocialCounts(cardRoot, userId);
        } catch (error) {
            console.error("Follow action:", error);
            window.Telegram?.WebApp?.showAlert?.(t("profile.social.error"));
        } finally {
            busy = false;
            if (button.isConnected) setButton();
        }
    });
}


function renderPublicStats(
    root,
    data
) {
    const statsRoot =
        root.querySelector(
            "[data-public-profile-stats]"
        );

    if (!statsRoot) {
        return;
    }

    statsRoot.innerHTML =
        renderProfileStatsBody(
            data
        );
}


function bindBack(
    root,
    onBack
) {
    root.querySelector(
        "[data-profile-back]"
    )?.addEventListener(
        "click",
        () => onBack?.()
    );
}


function bindPeriods(
    root,
    userId,
    cache
) {
    root.addEventListener(
        "click",
        async (event) => {
            const button =
                event.target.closest(
                    "[data-profile-stats-period]"
                );

            if (!button) {
                return;
            }

            const period =
                button.dataset
                    .profileStatsPeriod;

            if (
                !PERIODS.includes(
                    period
                )
            ) {
                return;
            }

            const cached =
                cache.stats.get(
                    period
                );

            if (cached) {
                renderPublicStats(
                    root,
                    cached
                );

                return;
            }

            try {
                const data =
                    await loadStats(
                        userId,
                        period,
                        cache
                    );

                renderPublicStats(
                    root,
                    data
                );
            } catch (error) {
                console.error(
                    "Public profile stats:",
                    error
                );
            }
        }
    );
}


function prefetchOtherPeriods(
    userId,
    cache
) {
    for (
        const period
        of PERIODS
    ) {
        if (
            period === "week"
        ) {
            continue;
        }

        void loadStats(
            userId,
            period,
            cache
        ).catch(() => {});
    }
}


export async function openPublicProfilePage(
    root,
    userId,
    {
        onBack = null
    } = {}
) {
    if (
        !root ||
        !userId
    ) {
        return;
    }

    const cache =
        getUserCache(
            userId
        );

    renderShell(
        root
    );

    bindBack(
        root,
        onBack
    );

    bindPeriods(
        root,
        userId,
        cache
    );

    try {
        const profilePromise =
            loadProfile(
                userId,
                cache
            );

        const weekPromise =
            loadStats(
                userId,
                "week",
                cache
            );

        const [profile, week] = await Promise.all([profilePromise, weekPromise]);

        const cardRoot =
            root.querySelector(
                "[data-public-profile-card]"
            );

        if (cardRoot) {
            cardRoot.innerHTML =
                renderProfileUserCard(
                    profile,
                    {
                        mode: "public"
                    }
                );
            void bindPublicFollow(cardRoot, userId);
        }

        renderPublicStats(
            root,
            week
        );

        prefetchOtherPeriods(
            userId,
            cache
        );
    } catch (error) {
        console.error(
            "Public profile:",
            error
        );
    }
}

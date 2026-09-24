import {
    getProfileAvatar,
    getDefaultProfileAvatar
} from "./appearance/profileAppearanceAvatar.js"

import {
    getProfileBackground,
    getDefaultProfileBackground
} from "./appearance/profileAppearanceBackground.js"

import {
    isProfileFeatureEnabled
} from "./profileFeatures.js"

import {
    t
} from "../../i18n/core/i18n.js"


/* =========================================================
   PROFILE V2 — КОМПОНЕНТЫ
   ========================================================= */


/* =========================================================
   БЕЗОПАСНЫЙ ТЕКСТ
   ========================================================= */

function escapeProfileText(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}


/* =========================================================
   ЧИСЛО
   ========================================================= */

function normalizeProfileNumber(
    value,
    fallback = 0
) {
    const number =
        Number(value)

    if (!Number.isFinite(number)) {
        return fallback
    }

    return Math.max(
        0,
        Math.floor(number)
    )
}


/* =========================================================
   КАРТОЧКА ПОЛЬЗОВАТЕЛЯ
   ========================================================= */

export function renderProfileUserCard(
    profile = {}
) {
    const nickname =
        escapeProfileText(
            profile.nickname || "Player"
        )


    /* =====================================================
       AVATAR
       ===================================================== */

    const avatar =
        getProfileAvatar(
            profile.avatar_key
        )
        || getDefaultProfileAvatar()


    /* =====================================================
       BACKGROUND
       ===================================================== */

    const background =
        getProfileBackground(
            profile.background_key
        )
        || getDefaultProfileBackground()


    /* =====================================================
       LEVEL
       ===================================================== */

    const level =
        normalizeProfileNumber(
            profile.level,
            1
        )

    const levelXp =
        normalizeProfileNumber(
            profile.level_xp
        )

    const levelXpRequired =
        Math.max(
            1,
            normalizeProfileNumber(
                profile.level_xp_required,
                20
            )
        )

    const levelProgress =
        Math.min(
            100,
            normalizeProfileNumber(
                profile.level_progress
            )
        )


    /* =====================================================
       TEMPORARY LEAGUE
       Пока всем пользователям показываем Bronze.
       Позже этот блок заменяется данными profile.league.
       ===================================================== */

    const league = {
        title: t("profile.main.leagueBronze"),
        image: "/img/profile/league/league_bronze.png"
    }

    const avatarFrame =
        "/img/profile/frame/frame_bronze.png"


    /* =====================================================
       NICKNAME
       ===================================================== */

    const nicknameCanChange =
        profile.nickname_can_change === true


    /* =====================================================
       CARD
       ===================================================== */

    return `
        <section
            class="profile-user-card"
            style="background-image: url('${background.image}');"
        >
            <div class="profile-user-card__overlay"></div>

            <div class="profile-user-card__layout">

                <div class="profile-user-card__avatar-wrap">
                    <img
                        class="profile-user-card__avatar"
                        src="${avatar.image}"
                        alt="${t("profile.main.avatarAlt")}"
                    >

                    <img
                        class="profile-user-card__avatar-frame"
                        src="${avatarFrame}"
                        alt=""
                        aria-hidden="true"
                    >
                </div>


                <div class="profile-user-card__content">

                    <div class="profile-user-card__name-row">
                        <h2 class="profile-user-card__name">
                            ${nickname}
                        </h2>

                        ${
                            nicknameCanChange
                                ? `
                                    <span
                                        class="material-symbols-rounded profile-user-card__edit-icon"
                                        data-profile-edit-nickname
                                        role="button"
                                        tabindex="0"
                                        aria-label="${t("profile.main.editNicknameAria")}"
                                    >
                                        edit
                                    </span>
                                `
                                : ""
                        }
                    </div>


                    <div class="profile-user-card__meta">
                        <img
                            class="profile-user-card__league-icon"
                            src="${league.image}"
                            alt=""
                            aria-hidden="true"
                        >

                        <span class="profile-user-card__league-name">
                            ${league.title}
                        </span>

                        <span
                            class="profile-user-card__meta-separator"
                            aria-hidden="true"
                        >
                            •
                        </span>

                        <span class="profile-user-card__level-text">
                            ${t(
                                "profile.main.level",
                                { level }
                            )}
                        </span>
                    </div>


                    <div class="profile-user-card__progress-row">
                        <div
                            class="profile-user-card__progress"
                            aria-label="${t(
                                "profile.main.levelProgressAria",
                                {
                                    current: levelXp,
                                    required: levelXpRequired
                                }
                            )}"
                        >
                            <div
                                class="profile-user-card__progress-fill"
                                style="width: ${levelProgress}%;"
                            ></div>
                        </div>

                        <div class="profile-user-card__xp">
                            <span class="profile-user-card__xp-current">
                                ${levelXp}
                            </span>

                            <span class="profile-user-card__xp-total">
                                / ${levelXpRequired} XP
                            </span>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    `
}

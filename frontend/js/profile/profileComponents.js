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
   КЛЮЧ АВАТАРА
   ========================================================= */

function normalizeAvatarKey(value) {
    const avatarKey =
        String(value || "").trim()

    if (
        /^[a-zA-Z0-9_-]+$/.test(
            avatarKey
        )
    ) {
        return avatarKey
    }

    return "beginer_m"
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

    const avatarKey =
        normalizeAvatarKey(
            profile.avatar_key
        )

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

    const nicknameCanChange =
        profile.nickname_can_change === true


    return `
        <section
            class="profile-user-card"
            style="
                background-image:
                    url('./img/profile/background/background_beginer_1.jpg');
            "
        >

            <div class="profile-user-card__top">

                <div class="profile-user-card__avatar-wrap">

                    <img
                        class="profile-user-card__avatar"
                        src="./img/profile/avatar/${avatarKey}.png"
                        alt="Аватар пользователя"
                    >

                </div>


                <div class="profile-user-card__info">

                    <div class="profile-user-card__name-row">

                        <h2 class="profile-user-card__name">
                            ${nickname}
                        </h2>

                        ${
                            nicknameCanChange
                                ? `
                                    <span
                                        class="
                                            material-symbols-rounded
                                            profile-user-card__edit-icon
                                        "
                                        data-profile-edit-nickname
                                        role="button"
                                        tabindex="0"
                                        aria-label="Изменить никнейм"
                                    >
                                        edit
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    <div class="profile-user-card__level">

                        <span
                            class="
                                material-symbols-rounded
                                profile-user-card__level-icon
                            "
                            aria-hidden="true"
                        >
                            shield_with_heart
                        </span>

                        <span class="profile-user-card__level-text">
                            Уровень ${level}
                        </span>

                    </div>

                </div>

            </div>


            <div class="profile-user-card__progress-row">

                <div
                    class="profile-user-card__progress"
                    aria-label="
                        Прогресс уровня:
                        ${levelXp} из
                        ${levelXpRequired} XP
                    "
                >
                    <div
                        class="profile-user-card__progress-fill"
                        style="
                            width: ${levelProgress}%;
                        "
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

        </section>
    `
}
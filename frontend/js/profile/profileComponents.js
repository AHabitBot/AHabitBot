/* =========================================================
   PROFILE V2 — КОМПОНЕНТЫ
   ========================================================= */


/* =========================================================
   КАРТОЧКА ПОЛЬЗОВАТЕЛЯ
   ========================================================= */

export function renderProfileUserCard() {
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
                        src="./img/profile/avatar/beginer_m.png"
                        alt="Аватар пользователя"
                    >

                </div>


                <div class="profile-user-card__info">

                    <div class="profile-user-card__name-row">

                        <h2 class="profile-user-card__name">
                            Player4
                        </h2>

                        <span
                            class="
                                material-symbols-rounded
                                profile-user-card__edit-icon
                            "
                            aria-hidden="true"
                        >
                            edit
                        </span>

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
                            Уровень 12
                        </span>

                    </div>

                </div>

            </div>


            <div class="profile-user-card__progress-row">

                <div
                    class="profile-user-card__progress"
                    aria-hidden="true"
                >
                    <div
                        class="profile-user-card__progress-fill"
                        style="width: 65%;"
                    ></div>
                </div>


                <div class="profile-user-card__xp">

                    <span class="profile-user-card__xp-current">
                        650
                    </span>

                    <span class="profile-user-card__xp-total">
                        / 1000 XP
                    </span>

                </div>

            </div>

        </section>
    `
}
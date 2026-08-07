/* =========================================================
   PROFILE V2 — КОМПОНЕНТЫ
   ========================================================= */


/* =========================================================
   КАРТОЧКА ПОЛЬЗОВАТЕЛЯ
   ========================================================= */

export function renderProfileUserCard() {
    return `
        <section class="profile-user-card">

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
                            Вы
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


                    <div class="profile-user-card__level-row">

                        <span class="profile-user-card__level">
                            Уровень 12
                        </span>

                        <span class="profile-user-card__xp">
                            650 / 1000 XP
                        </span>

                    </div>


                    <div
                        class="profile-user-card__progress"
                        aria-hidden="true"
                    >
                        <div
                            class="profile-user-card__progress-fill"
                            style="width: 65%;"
                        ></div>
                    </div>

                </div>

            </div>

        </section>
    `
}
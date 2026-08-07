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



/* =========================================================
   МЕНЮ ПРОФИЛЯ
   ========================================================= */

export function renderProfileMenu() {
    return `
        <section class="profile-menu">

            <button
                type="button"
                class="profile-menu__item"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--stats
                        "
                        aria-hidden="true"
                    >
                        target
                    </span>

                    <span class="profile-menu__label">
                        Игровые показатели
                    </span>

                </div>

                <span
                    class="
                        material-symbols-rounded
                        profile-menu__arrow
                    "
                    aria-hidden="true"
                >
                    chevron_right
                </span>
            </button>


            <button
                type="button"
                class="profile-menu__item"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--achievements
                        "
                        aria-hidden="true"
                    >
                        workspace_premium
                    </span>

                    <span class="profile-menu__label">
                        Достижения
                    </span>

                </div>

                <div class="profile-menu__right">

                    <span class="profile-menu__value">
                        12/48
                    </span>

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__arrow
                        "
                        aria-hidden="true"
                    >
                        chevron_right
                    </span>

                </div>
            </button>


            <button
                type="button"
                class="profile-menu__item"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--appearance
                        "
                        aria-hidden="true"
                    >
                        checkroom
                    </span>

                    <span class="profile-menu__label">
                        Внешний вид
                    </span>

                </div>

                <span
                    class="
                        material-symbols-rounded
                        profile-menu__arrow
                    "
                    aria-hidden="true"
                >
                    chevron_right
                </span>
            </button>


            <button
                type="button"
                class="profile-menu__item"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--settings
                        "
                        aria-hidden="true"
                    >
                        settings
                    </span>

                    <span class="profile-menu__label">
                        Данные и настройки
                    </span>

                </div>

                <span
                    class="
                        material-symbols-rounded
                        profile-menu__arrow
                    "
                    aria-hidden="true"
                >
                    chevron_right
                </span>
            </button>


            <button
                type="button"
                class="profile-menu__item"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--support
                        "
                        aria-hidden="true"
                    >
                        help
                    </span>

                    <span class="profile-menu__label">
                        Поддержка
                    </span>

                </div>

                <span
                    class="
                        material-symbols-rounded
                        profile-menu__arrow
                    "
                    aria-hidden="true"
                >
                    chevron_right
                </span>
            </button>


            <button
                type="button"
                class="profile-menu__item"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--invite
                        "
                        aria-hidden="true"
                    >
                        person_add
                    </span>

                    <span class="profile-menu__label">
                        Пригласить друга
                    </span>

                </div>

                <div class="profile-menu__right">

                    <span class="profile-menu__reward">
                        +5 XP
                    </span>

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__arrow
                        "
                        aria-hidden="true"
                    >
                        chevron_right
                    </span>

                </div>
            </button>


            <button
                type="button"
                class="profile-menu__item"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--archive
                        "
                        aria-hidden="true"
                    >
                        inventory_2
                    </span>

                    <span class="profile-menu__label">
                        Архив привычек
                    </span>

                </div>

                <span
                    class="
                        material-symbols-rounded
                        profile-menu__arrow
                    "
                    aria-hidden="true"
                >
                    chevron_right
                </span>
            </button>

        </section>
    `
}
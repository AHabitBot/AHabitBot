import { t } from "../i18n/core/i18n.js";

const NAVIGATION_ID = "bottom-navigation";
const NAVIGATION_FADE_ID = "bottom-navigation-fade";

/* =========================================================
   ПРОВЕРИТЬ ДОСТУП К ПРОФИЛЮ
   ========================================================= */

export function canAccessProfile() {
    return true;
}


/* =========================================================
   РЕНДЕР НИЖНЕЙ НАВИГАЦИИ

   Привычки и лидерборд доступны всем.
   Профиль временно доступен только разрешённому Telegram ID.
   ========================================================= */

export function renderBottomNavigation(
    activePage = "habits"
) {

    const profileNavigationItem =
        canAccessProfile()
            ? `
                <button
                    type="button"
                    class="
                        bottom-navigation__item
                        ${
                            activePage === "profile"
                                ? "is-active"
                                : ""
                        }
                    "
                    data-navigation-page="profile"
                    aria-label="${t("common.navigation.profile.aria")}"
                    ${
                        activePage === "profile"
                            ? 'aria-current="page"'
                            : ""
                    }
                >
                    <span
                        class="
                            material-symbols-rounded
                            bottom-navigation__icon
                        "
                        aria-hidden="true"
                    >
                        person
                    </span>

                    <span class="bottom-navigation__label">
                        Профиль
                    </span>
                </button>
            `
            : "";

    return `
        <div
            id="${NAVIGATION_FADE_ID}"
            class="bottom-navigation-fade"
            aria-hidden="true"
        ></div>

        <nav
            id="${NAVIGATION_ID}"
            class="bottom-navigation"
            aria-label="${t("common.navigation.aria")}"
        >

            <button
                type="button"
                class="
                    bottom-navigation__item
                    ${
                        activePage === "habits"
                            ? "is-active"
                            : ""
                    }
                "
                data-navigation-page="habits"
                aria-label="${t("common.navigation.habits.aria")}"
                ${
                    activePage === "habits"
                        ? 'aria-current="page"'
                        : ""
                }
            >
                <span
                    class="
                        material-symbols-rounded
                        bottom-navigation__icon
                    "
                    aria-hidden="true"
                >
                    task_alt
                </span>

                <span class="bottom-navigation__label">
                    Главная
                </span>
            </button>


            <button
                type="button"
                class="
                    bottom-navigation__item
                    ${
                        activePage === "leaderboard"
                            ? "is-active"
                            : ""
                    }
                "
                data-navigation-page="leaderboard"
                aria-label="${t("common.navigation.leaderboard.aria")}"
                ${
                    activePage === "leaderboard"
                        ? 'aria-current="page"'
                        : ""
                }
            >
                <span
                    class="
                        material-symbols-rounded
                        bottom-navigation__icon
                    "
                    aria-hidden="true"
                >
                    trophy
                </span>

                <span class="bottom-navigation__label">
                    Лидерборд
                </span>
            </button>


            ${profileNavigationItem}

        </nav>
    `;
}


/* =========================================================
   ДОБАВИТЬ НАВИГАЦИЮ НА СТРАНИЦУ
   ========================================================= */

export function mountBottomNavigation(
    activePage = "habits"
) {
    removeBottomNavigation();

    document.body.insertAdjacentHTML(
        "beforeend",
        renderBottomNavigation(activePage)
    );

    bindBottomNavigationEvents();
}


/* =========================================================
   УДАЛИТЬ НАВИГАЦИЮ И ГРАДИЕНТ
   ========================================================= */

export function removeBottomNavigation() {
    document
        .getElementById(NAVIGATION_ID)
        ?.remove();

    document
        .getElementById(NAVIGATION_FADE_ID)
        ?.remove();
}


/* =========================================================
   ИЗМЕНИТЬ АКТИВНЫЙ РАЗДЕЛ
   ========================================================= */

export function setActiveNavigationPage(
    activePage
) {
    const navigation =
        document.getElementById(
            NAVIGATION_ID
        );

    if (!navigation) {
        return;
    }

    const buttons =
        navigation.querySelectorAll(
            "[data-navigation-page]"
        );

    buttons.forEach((button) => {
        const page =
            button.dataset.navigationPage;

        const isActive =
            page === activePage;

        button.classList.toggle(
            "is-active",
            isActive
        );

        if (isActive) {
            button.setAttribute(
                "aria-current",
                "page"
            );

            return;
        }

        button.removeAttribute(
            "aria-current"
        );
    });
}


/* =========================================================
   ПОДКЛЮЧИТЬ СОБЫТИЯ
   ========================================================= */

function bindBottomNavigationEvents() {
    const navigation =
        document.getElementById(
            NAVIGATION_ID
        );

    if (!navigation) {
        return;
    }

    navigation.addEventListener(
        "click",
        handleNavigationClick
    );
}


/* =========================================================
   ОБРАБОТАТЬ НАЖАТИЕ
   ========================================================= */

function handleNavigationClick(event) {
    const button =
        event.target.closest(
            "[data-navigation-page]"
        );

    if (!button) {
        return;
    }

    if (
        button.classList.contains(
            "is-active"
        )
    ) {
        return;
    }

    const page =
        button.dataset.navigationPage;

    if (!page) {
        return;
    }


    /* -----------------------------------------------------
       Дополнительная проверка доступа к профилю
       ----------------------------------------------------- */

    if (
        page === "profile" &&
        !canAccessProfile()
    ) {
        return;
    }


    setActiveNavigationPage(page);

    document.dispatchEvent(
        new CustomEvent(
            "app:navigate",
            {
                detail: {
                    page
                }
            }
        )
    );
}
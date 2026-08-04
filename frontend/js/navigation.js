import { canAccessLeaderboard } from "./leaderboard/leaderboardStore.js";

const NAVIGATION_ID = "bottom-navigation";

/**
 * Создаёт HTML нижней навигации.
 *
 * @param {"habits" | "leaderboard"} activePage
 * @returns {string}
 */
export function renderBottomNavigation(activePage = "habits") {
  const showLeaderboard = canAccessLeaderboard();

  return `
    <nav
      id="${NAVIGATION_ID}"
      class="bottom-navigation"
      aria-label="Основная навигация"
    >
      <button
        type="button"
        class="bottom-navigation__item ${
          activePage === "habits" ? "is-active" : ""
        }"
        data-navigation-page="habits"
        aria-label="Открыть привычки"
      >
        <span
          class="material-symbols-rounded bottom-navigation__icon"
          aria-hidden="true"
        >
          task_alt
        </span>

        <span class="bottom-navigation__label">
          Привычки
        </span>
      </button>

      ${
        showLeaderboard
          ? `
            <button
              type="button"
              class="bottom-navigation__item ${
                activePage === "leaderboard" ? "is-active" : ""
              }"
              data-navigation-page="leaderboard"
              aria-label="Открыть лидерборд"
            >
              <span
                class="material-symbols-rounded bottom-navigation__icon"
                aria-hidden="true"
              >
                trophy
              </span>

              <span class="bottom-navigation__label">
                Лидерборд
              </span>
            </button>
          `
          : ""
      }
    </nav>
  `;
}

/**
 * Добавляет навигацию в приложение.
 *
 * @param {"habits" | "leaderboard"} activePage
 */
export function mountBottomNavigation(activePage = "habits") {
  removeBottomNavigation();

  document.body.insertAdjacentHTML(
    "beforeend",
    renderBottomNavigation(activePage)
  );

  bindBottomNavigationEvents();
}

/**
 * Удаляет навигацию со страницы.
 */
export function removeBottomNavigation() {
  document.getElementById(NAVIGATION_ID)?.remove();
}

/**
 * Подсвечивает выбранный раздел без полной перерисовки.
 *
 * @param {"habits" | "leaderboard"} activePage
 */
export function setActiveNavigationPage(activePage) {
  const navigation = document.getElementById(NAVIGATION_ID);

  if (!navigation) {
    return;
  }

  const buttons = navigation.querySelectorAll(
    "[data-navigation-page]"
  );

  buttons.forEach((button) => {
    const page = button.dataset.navigationPage;
    const isActive = page === activePage;

    button.classList.toggle("is-active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

/**
 * Подключает обработчики нижней навигации.
 */
function bindBottomNavigationEvents() {
  const navigation = document.getElementById(NAVIGATION_ID);

  if (!navigation) {
    return;
  }

  navigation.addEventListener("click", handleNavigationClick);
}

/**
 * Обрабатывает нажатие на кнопку навигации.
 *
 * @param {MouseEvent} event
 */
function handleNavigationClick(event) {
    const button =
        event.target.closest(
            "[data-navigation-page]"
        );

    if (!button) {
        return;
    }

    const page =
        button.dataset.navigationPage;

    if (!page) {
        return;
    }

    if (
        button.classList.contains(
            "is-active"
        )
    ) {
        return;
    }

    if (
        page === "leaderboard"
        && !canAccessLeaderboard()
    ) {
        return;
    }

    const activeContent =
        document.querySelector(
            ".page.active .page-content"
        );

    button.classList.add(
        "is-pressed"
    );

    activeContent?.classList.add(
        "is-navigation-leaving"
    );

    window.setTimeout(() => {
        setActiveNavigationPage(page);

        document.dispatchEvent(
            new CustomEvent(
                "app:navigate",
                {
                    detail: {
                        page,
                    },
                }
            )
        );

        button.classList.remove(
            "is-pressed"
        );

        activeContent?.classList.remove(
            "is-navigation-leaving"
        );
    }, 180);
}
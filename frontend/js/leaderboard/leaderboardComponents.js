import {
  getActiveLeaderboardTab,
} from "./leaderboardStore.js";


function renderMaterialIcon(iconName) {
  return `
    <span
      class="material-symbols-rounded leaderboard-tabs__icon"
      aria-hidden="true"
    >
      ${iconName}
    </span>
  `;
}


export function renderLeaderboardHeader() {
  const activeTab = getActiveLeaderboardTab();

  const isGlobalActive = activeTab === "global";
  const isSeasonActive = activeTab === "season";

  return `
    <header class="leaderboard-header">
      <h1 class="leaderboard-header__title">
        Лидерборд
      </h1>

      <div
        class="leaderboard-tabs"
        role="tablist"
        aria-label="Тип рейтинга"
      >
        <button
          class="leaderboard-tabs__button ${
            isGlobalActive
              ? "leaderboard-tabs__button--active"
              : ""
          }"
          type="button"
          role="tab"
          data-leaderboard-tab="global"
          aria-selected="${isGlobalActive}"
          tabindex="${isGlobalActive ? "0" : "-1"}"
        >
          ${renderMaterialIcon("public")}

          <span class="leaderboard-tabs__label">
            Глобальный
          </span>
        </button>

        <button
          class="leaderboard-tabs__button ${
            isSeasonActive
              ? "leaderboard-tabs__button--active"
              : ""
          }"
          type="button"
          role="tab"
          data-leaderboard-tab="season"
          aria-selected="${isSeasonActive}"
          tabindex="${isSeasonActive ? "0" : "-1"}"
        >
          ${renderMaterialIcon("calendar_month")}

          <span class="leaderboard-tabs__label">
            Сезонный
          </span>
        </button>
      </div>
    </header>
  `;
}


export function renderLeaderboardContentShell() {
  const activeTab = getActiveLeaderboardTab();

  return `
    <section
      class="leaderboard-content"
      data-leaderboard-content
      data-active-tab="${activeTab}"
      aria-live="polite"
    ></section>
  `;
}




export function renderSectionIntro({
    title = "",
    subtitle = "",
    backgroundImage = ""
} = {}) {
    return `
        <section
            class="leaderboard-section-intro"
            style="background-image: url('${backgroundImage}');"
        >
            <div class="leaderboard-section-intro__content">
                <h2 class="leaderboard-section-intro__title">
                    ${title}
                </h2>

                <p class="leaderboard-section-intro__subtitle">
                    ${subtitle}
                </p>
            </div>
        </section>
    `
}
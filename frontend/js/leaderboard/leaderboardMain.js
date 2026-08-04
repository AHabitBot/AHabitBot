import {
  canAccessLeaderboard,
  getActiveLeaderboardTab,
} from "./leaderboardStore.js";

import {
  renderLeaderboardHeader,
  renderLeaderboardContentShell,
} from "./leaderboardComponents.js";

import {
  initLeaderboardEvents,
} from "./leaderboardEvents.js";


let leaderboardRoot = null;
let destroyLeaderboardEvents = null;


export function openLeaderboardPage(root) {
  if (!canAccessLeaderboard()) {
    console.warn(
      "Leaderboard is unavailable for this user"
    );

    return false;
  }

  renderLeaderboardPage(root);

  return true;
}


export function renderLeaderboardPage(root) {
  if (!root) {
    console.error(
      "Leaderboard: корневой контейнер не найден"
    );

    return;
  }

  destroyLeaderboardPage();

  leaderboardRoot = root;

  leaderboardRoot.innerHTML = `
    <main class="leaderboard-page">
      ${renderLeaderboardHeader()}
      ${renderLeaderboardContentShell()}
    </main>
  `;

  renderActiveLeaderboardContent();

  destroyLeaderboardEvents = initLeaderboardEvents({
    root: leaderboardRoot,
    onTabChange: renderActiveLeaderboardContent,
  });
}


function renderActiveLeaderboardContent() {
  if (!leaderboardRoot) {
    return;
  }

  const content = leaderboardRoot.querySelector(
    "[data-leaderboard-content]"
  );

  if (!content) {
    console.error(
      "Leaderboard: контейнер содержимого не найден"
    );

    return;
  }

  const activeTab = getActiveLeaderboardTab();

  content.dataset.activeTab = activeTab;

  /*
   * Пока содержимое остаётся пустым.
   *
   * На следующем этапе здесь подключим:
   *
   * global/globalLeaderboard.js
   * season/seasonLeaderboard.js
   *
   * Важно: при переключении вкладки будет обновляться
   * только leaderboard-content.
   * Хедер и вся страница заново не создаются.
   */

  content.innerHTML = "";
}


export function destroyLeaderboardPage() {
  if (typeof destroyLeaderboardEvents === "function") {
    destroyLeaderboardEvents();
  }

  destroyLeaderboardEvents = null;
  leaderboardRoot = null;
}
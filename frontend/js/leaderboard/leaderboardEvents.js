import {
  getActiveLeaderboardTab,
  setActiveLeaderboardTab,
} from "./leaderboardStore.js";


function updateLeaderboardTabs(root, activeTab) {
  const tabButtons = root.querySelectorAll(
    "[data-leaderboard-tab]"
  );

  tabButtons.forEach((button) => {
    const buttonTab = button.dataset.leaderboardTab;
    const isActive = buttonTab === activeTab;

    button.classList.toggle(
      "leaderboard-tabs__button--active",
      isActive
    );

    button.setAttribute(
      "aria-selected",
      String(isActive)
    );

    button.setAttribute(
      "tabindex",
      isActive ? "0" : "-1"
    );
  });
}


export function initLeaderboardEvents({
  root,
  onTabChange,
}) {
  if (!root) {
    console.error(
      "Leaderboard events: корневой контейнер не найден"
    );

    return null;
  }

  const handleClick = (event) => {
    const tabButton = event.target.closest(
      "[data-leaderboard-tab]"
    );

    if (!tabButton || !root.contains(tabButton)) {
      return;
    }

    const nextTab = tabButton.dataset.leaderboardTab;
    const currentTab = getActiveLeaderboardTab();

    if (!nextTab || nextTab === currentTab) {
      return;
    }

    setActiveLeaderboardTab(nextTab);
    updateLeaderboardTabs(root, nextTab);

    if (typeof onTabChange === "function") {
      onTabChange(nextTab);
    }
  };


  const handleKeydown = (event) => {
    if (
      event.key !== "ArrowLeft"
      && event.key !== "ArrowRight"
    ) {
      return;
    }

    const currentButton = event.target.closest(
      "[data-leaderboard-tab]"
    );

    if (!currentButton || !root.contains(currentButton)) {
      return;
    }

    const tabs = ["global", "season"];
    const currentTab = getActiveLeaderboardTab();
    const currentIndex = tabs.indexOf(currentTab);

    if (currentIndex === -1) {
      return;
    }

    event.preventDefault();

    const direction = event.key === "ArrowRight"
      ? 1
      : -1;

    const nextIndex =
      (currentIndex + direction + tabs.length)
      % tabs.length;

    const nextTab = tabs[nextIndex];

    setActiveLeaderboardTab(nextTab);
    updateLeaderboardTabs(root, nextTab);

    const nextButton = root.querySelector(
      `[data-leaderboard-tab="${nextTab}"]`
    );

    nextButton?.focus();

    if (typeof onTabChange === "function") {
      onTabChange(nextTab);
    }
  };


  root.addEventListener("click", handleClick);
  root.addEventListener("keydown", handleKeydown);

  return function destroyLeaderboardEvents() {
    root.removeEventListener("click", handleClick);
    root.removeEventListener("keydown", handleKeydown);
  };
}
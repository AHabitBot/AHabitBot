export const LEADERBOARD_ALLOWED_USER_IDS = new Set([
  900410719,
]);

export function getTelegramUserId() {
  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  return Number.isInteger(telegramId)
    ? telegramId
    : null;
}

export function canAccessLeaderboard() {
  const telegramId = getTelegramUserId();

  return telegramId !== null
    && LEADERBOARD_ALLOWED_USER_IDS.has(telegramId);
}

const leaderboardState = {
  activeTab: "global",
};

export function getLeaderboardState() {
  return leaderboardState;
}

export function getActiveLeaderboardTab() {
  return leaderboardState.activeTab;
}

export function setActiveLeaderboardTab(tab) {
  if (!["global", "season"].includes(tab)) {
    return;
  }

  leaderboardState.activeTab = tab;
}
import { canAccessLeaderboard } from "./leaderboardStore.js";

export function openLeaderboardPage() {
  if (!canAccessLeaderboard()) {
    console.warn("Leaderboard is unavailable for this user");
    return;
  }

  // Здесь позже запускаем полноценную страницу лидерборда.
}
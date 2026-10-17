// Единый справочник лиг: изображения можно заменить независимо от логики.
export const LEAGUE_ICON = "/img/profile/league/league_bronze.png";
export const LEAGUE_KEYS = [
    "bronze", "silver", "gold", "emerald", "sapphire",
    "ruby", "amethyst", "platinum", "diamond", "brilliant"
];
export function normalizeLeagueLevel(value) {
    const level = Number(value);
    return Number.isInteger(level) && level >= 1 && level <= 10 ? level : 1;
}
export function leagueNameKey(level, context = "leaderboard") {
    const key = LEAGUE_KEYS[normalizeLeagueLevel(level) - 1];
    return context === "profile" ? `profile.main.league.${key}` : `leaderboard.league.${key}`;
}

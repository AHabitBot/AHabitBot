// Единый справочник лиг: изображения можно заменить независимо от логики.
export const LEAGUE_ICON = "/img/profile/league/league_bronze.png";
// Existing art assets: use silver for level 2, bronze as a placeholder elsewhere.
export function leagueIcon(level) {
    return `/img/profile/league/league_${normalizeLeagueLevel(level) === 2 ? "silver" : "bronze"}.png`;
}
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

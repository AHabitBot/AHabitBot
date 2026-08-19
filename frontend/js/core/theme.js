const STORAGE_KEY = "ahabit-theme";
const DEFAULT_THEME = "light";
const ALLOWED_THEMES = new Set(["light", "dark"]);

export function normalizeTheme(theme) {
    return ALLOWED_THEMES.has(theme) ? theme : DEFAULT_THEME;
}

export function getCurrentTheme() {
    return normalizeTheme(
        document.documentElement.dataset.theme ||
        localStorage.getItem(STORAGE_KEY) ||
        DEFAULT_THEME
    );
}

export function applyTheme(theme, { persist = true } = {}) {
    const normalized = normalizeTheme(theme);
    const root = document.documentElement;

    root.dataset.theme = normalized;
    root.style.colorScheme = normalized;

    if (persist) {
        localStorage.setItem(STORAGE_KEY, normalized);
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute(
            "content",
            normalized === "dark" ? "#0d1214" : "#f8f9fb"
        );
    }

    const telegram = window.Telegram?.WebApp;
    if (telegram) {
        try {
            telegram.setHeaderColor(normalized === "dark" ? "#0d1214" : "#f8f9fb");
            telegram.setBackgroundColor(normalized === "dark" ? "#0d1214" : "#f8f9fb");
        } catch (error) {
            console.debug("Telegram theme colors are unavailable", error);
        }
    }

    return normalized;
}

export function syncThemeFromSettings(settings = {}) {
    return applyTheme(settings.theme || DEFAULT_THEME);
}

// Единая тёмная тема AHabit. Системные цвета Telegram сохраняем.
export const DEFAULT_THEME = "dark";

export function applyDarkTheme() {
    const root = document.documentElement;
    root.dataset.theme = "dark";
    root.style.colorScheme = "dark";

    try { localStorage.removeItem("ahabit-theme"); } catch (_) {}

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#0d1214");

    const telegram = window.Telegram?.WebApp;
    if (telegram) {
        try {
            telegram.setHeaderColor("#0d1214");
            telegram.setBackgroundColor("#0d1214");
        } catch (error) {
            console.debug("Telegram theme colors are unavailable", error);
        }
    }
    return DEFAULT_THEME;
}

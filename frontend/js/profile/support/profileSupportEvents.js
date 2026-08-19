// =========================================================
// SUPPORT CONTACT
// =========================================================

const SUPPORT_TELEGRAM_URL =
    "https://t.me/ssprvz01";


// =========================================================
// ОТКРЫТЬ ЧАТ ПОДДЕРЖКИ
// =========================================================

function openSupportContact() {
    const telegramWebApp =
        window.Telegram?.WebApp;

    // -----------------------------------------------------
    // TELEGRAM MINI APP
    // -----------------------------------------------------

    if (
        telegramWebApp
        && typeof telegramWebApp.openTelegramLink
            === "function"
    ) {
        telegramWebApp.openTelegramLink(
            SUPPORT_TELEGRAM_URL
        );

        return;
    }

    // -----------------------------------------------------
    // ОБЫЧНЫЙ БРАУЗЕР
    // -----------------------------------------------------

    window.open(
        SUPPORT_TELEGRAM_URL,
        "_blank",
        "noopener,noreferrer",
    );
}


// =========================================================
// EVENTS
// =========================================================

export function bindProfileSupportEvents(
    root,
) {
    const contactButton =
        root.querySelector(
            "[data-support-contact]"
        );

    if (!contactButton) {
        return;
    }

    contactButton.addEventListener(
        "click",
        openSupportContact,
    );
}
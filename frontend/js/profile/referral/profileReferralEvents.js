import { t } from "../../../i18n/core/i18n.js";

// =========================================================
// СКОПИРОВАТЬ РЕФЕРАЛЬНУЮ ССЫЛКУ
// =========================================================

async function copyReferralLink(
    referralLink,
    button,
) {
    if (!referralLink) {
        return;
    }

    const textElement =
        button.querySelector(
            ".profile-referral-button-text"
        );

    if (!textElement) {
        return;
    }

    const originalText =
        textElement.textContent;

    try {
        await navigator.clipboard.writeText(
            referralLink
        );

        textElement.textContent =
            t("profile.referral.copied");

        button.classList.add(
            "profile-referral-button--success"
        );

        window.setTimeout(
            () => {
                textElement.textContent =
                    originalText;

                button.classList.remove(
                    "profile-referral-button--success"
                );
            },
            1600,
        );

    } catch (error) {
        console.error(
            "Не удалось скопировать реферальную ссылку:",
            error,
        );
    }
}


// =========================================================
// ПОДЕЛИТЬСЯ РЕФЕРАЛЬНОЙ ССЫЛКОЙ
// =========================================================

function shareReferralLink(
    referralLink,
) {
    if (!referralLink) {
        return;
    }

    const text =
        t("profile.referral.shareText");

    const shareUrl =
        "https://t.me/share/url"
        + `?url=${encodeURIComponent(
            referralLink
        )}`
        + `&text=${encodeURIComponent(
            text
        )}`;

    const telegramWebApp =
        window.Telegram?.WebApp;

    if (
        telegramWebApp
        && typeof telegramWebApp.openTelegramLink
            === "function"
    ) {
        telegramWebApp.openTelegramLink(
            shareUrl
        );

        return;
    }

    window.open(
        shareUrl,
        "_blank",
        "noopener,noreferrer",
    );
}


// =========================================================
// ПОДКЛЮЧИТЬ СОБЫТИЯ СТРАНИЦЫ
// =========================================================

export function bindProfileReferralEvents({
    referralLink,
}) {
    const copyButton =
        document.querySelector(
            "[data-referral-copy]"
        );

    const shareButton =
        document.querySelector(
            "[data-referral-share]"
        );

    if (copyButton) {
        copyButton.addEventListener(
            "click",
            () => {
                copyReferralLink(
                    referralLink,
                    copyButton,
                );
            },
        );
    }

    if (shareButton) {
        shareButton.addEventListener(
            "click",
            () => {
                shareReferralLink(
                    referralLink
                );
            },
        );
    }
}
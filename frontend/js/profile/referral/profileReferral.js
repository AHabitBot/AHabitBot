import {
    renderProfileSectionHeader,
} from "../profileComponents.js";


import {
    getProfileAvatar,
    getDefaultProfileAvatar,
} from "../appearance/profileAppearanceAvatar.js";

import {
    getProfileReferral,
} from "./profileReferralApi.js";

import {
    RESOURCE_KEYS,
    registerResource,
    peekResource,
} from "../../core/resourceCache.js";

registerResource(
    RESOURCE_KEYS.REFERRAL,
    getProfileReferral,
);

import {
    bindProfileReferralEvents,
} from "./profileReferralEvents.js";


// =========================================================
// ПОЛУЧИТЬ АВАТАР ДЛЯ QR
// =========================================================

function getReferralAvatarImage(
    profile,
) {
    const avatar =
        getProfileAvatar(
            profile?.avatar_key
        )
        || getDefaultProfileAvatar();

    return (
        avatar?.image
        || ""
    );
}

// =========================================================
// СОЗДАТЬ КРУГЛЫЙ АВАТАР ДЛЯ QR
// =========================================================

async function createCircularQrAvatar(
    imageUrl,
) {
    if (!imageUrl) {
        return "";
    }

    return new Promise(
        (resolve) => {
            const image =
                new Image();

            image.onload = () => {
                const size = 256;

                const canvas =
                    document.createElement(
                        "canvas"
                    );

                canvas.width = size;
                canvas.height = size;

                const ctx =
                    canvas.getContext(
                        "2d"
                    );

                if (!ctx) {
                    resolve(imageUrl);
                    return;
                }


                // -----------------------------------------
                // БЕЛАЯ КРУГЛАЯ ПОДЛОЖКА
                // -----------------------------------------

                ctx.beginPath();

                ctx.arc(
                    size / 2,
                    size / 2,
                    size / 2,
                    0,
                    Math.PI * 2,
                );

                ctx.fillStyle =
                    "#ffffff";

                ctx.fill();


                // -----------------------------------------
                // КРУГЛАЯ ОБЛАСТЬ АВАТАРА
                // -----------------------------------------

                const border = 12;

                ctx.save();

                ctx.beginPath();

                ctx.arc(
                    size / 2,
                    size / 2,
                    (size / 2) - border,
                    0,
                    Math.PI * 2,
                );

                ctx.clip();


                // -----------------------------------------
                // OBJECT-FIT: COVER
                // -----------------------------------------

                const sourceWidth =
                    image.naturalWidth;

                const sourceHeight =
                    image.naturalHeight;

                const sourceSize =
                    Math.min(
                        sourceWidth,
                        sourceHeight
                    );

                const sourceX =
                    (
                        sourceWidth -
                        sourceSize
                    ) / 2;

                const sourceY =
                    (
                        sourceHeight -
                        sourceSize
                    ) / 2;


                ctx.drawImage(
                    image,

                    sourceX,
                    sourceY,
                    sourceSize,
                    sourceSize,

                    border,
                    border,
                    size - border * 2,
                    size - border * 2,
                );

                ctx.restore();


                resolve(
                    canvas.toDataURL(
                        "image/png"
                    )
                );
            };


            image.onerror = () => {
                console.warn(
                    "Не удалось подготовить круглый QR-аватар"
                );

                resolve(imageUrl);
            };


            image.src =
                imageUrl;
        }
    );
}


// =========================================================
// СОЗДАТЬ QR-КОД
// =========================================================

function renderReferralQr(
    root,
    referralLink,
    avatarImage,
) {
    const qrContainer =
        root.querySelector(
            "[data-referral-qr]"
        );

    if (
        !qrContainer
        || !referralLink
    ) {
        return;
    }

    if (
        typeof window.QRCodeStyling
        !== "function"
    ) {
        console.error(
            "QRCodeStyling не загружен"
        );

        return;
    }

    qrContainer.innerHTML = "";

    const qrOptions = {
        width: 320,
        height: 320,

        type: "svg",

        data: referralLink,

        margin: 10,

        qrOptions: {
            errorCorrectionLevel: "H",
        },

        dotsOptions: {
            type: "rounded",
            color: "#1f2c25",
        },

        cornersSquareOptions: {
            type: "extra-rounded",
            color: "#1f2c25",
        },

        cornersDotOptions: {
            type: "dot",
            color: "#1f2c25",
        },

        backgroundOptions: {
            color: "#ffffff",
        },
    };


    // -----------------------------------------------------
    // АВАТАР В ЦЕНТРЕ QR
    // -----------------------------------------------------

    if (avatarImage) {
        qrOptions.image =
            avatarImage;

        qrOptions.imageOptions = {
            hideBackgroundDots: true,

            /*
             * 0.22 = около 22% площади QR.
             * Достаточно заметно,
             * но безопасно для сканирования.
             */
            imageSize: 0.36,

            /*
             * Светлый отступ вокруг аватара,
             * чтобы QR-точки не соприкасались
             * с изображением.
             */
            margin: 2,
        };
    }


    const qrCode =
        new window.QRCodeStyling(
            qrOptions
        );

    qrCode.append(
        qrContainer
    );
}


// =========================================================
// РЕНДЕР СТРАНИЦЫ
// =========================================================

export async function renderProfileReferralPage(
    root,
) {
    root.innerHTML = `
        <section class="profile-page profile-referral-page">

            ${renderProfileSectionHeader(
                "Пригласи друга"
            )}

            <div class="profile-referral-content">

                <p class="profile-referral-intro">
                    Поделись ссылкой или QR-кодом
                    и получи бонусы за каждого
                    приглашённого друга
                </p>

                <div class="profile-referral-qr-card">
                    <div
                        class="profile-referral-qr"
                        data-referral-qr
                    ></div>
                </div>


                <!-- =========================================
                     СТАТИСТИКА
                     ========================================= -->

                <div class="profile-referral-stats">

                    <div class="profile-referral-stat">

                        <div class="profile-referral-stat-header">

                            <span
                                class="
                                    material-symbols-rounded
                                    profile-referral-stat-icon
                                    profile-referral-stat-icon--friends
                                "
                            >
                                group
                            </span>

                            <span class="profile-referral-stat-label">
                                Приглашено
                            </span>

                        </div>

                        <span
                            class="profile-referral-stat-value"
                            data-referral-invited
                        >
                            0
                        </span>

                    </div>


                    <div
                        class="profile-referral-stat-divider"
                    ></div>


                    <div class="profile-referral-stat">

                        <div class="profile-referral-stat-header">

                            <span
                                class="
                                    material-symbols-rounded
                                    profile-referral-stat-icon
                                    profile-referral-stat-icon--xp
                                "
                            >
                                award_star
                            </span>

                            <span class="profile-referral-stat-label">
                                Заработано XP
                            </span>

                        </div>

                        <span
                            class="profile-referral-stat-value"
                            data-referral-xp
                        >
                            0
                        </span>

                    </div>

                </div>


                <!-- =========================================
                     КНОПКИ
                     ========================================= -->

                <div class="profile-referral-actions">

                    <button
                        type="button"
                        class="
                            profile-referral-button
                            profile-referral-button--secondary
                        "
                        data-referral-copy
                    >

                        <span
                            class="
                                material-symbols-rounded
                                profile-referral-button-icon
                            "
                        >
                            content_copy
                        </span>

                        <span
                            class="profile-referral-button-text"
                        >
                            Скопировать ссылку
                        </span>

                    </button>


                    <button
                        type="button"
                        class="
                            profile-referral-button
                            profile-referral-button--primary
                        "
                        data-referral-share
                    >

                        <span
                            class="
                                material-symbols-rounded
                                profile-referral-button-icon
                            "
                        >
                            ios_share
                        </span>

                        <span
                            class="profile-referral-button-text"
                        >
                            Пригласить друга
                        </span>

                    </button>

                </div>

            </div>

        </section>
    `;


    try {

/*
 * Referral и Profile уже загружены
 * во время Bootstrap.
 *
 * Здесь только читаем готовый snapshot.
 * Никаких API-запросов.
 */

const referralData =
    peekResource(
        RESOURCE_KEYS.REFERRAL
    );

const profile =
    peekResource(
        RESOURCE_KEYS.PROFILE
    );


if (!referralData) {
    throw new Error(
        "Referral отсутствует в Resource Cache"
    );
}


if (!profile) {
    console.warn(
        "Profile отсутствует в Resource Cache для QR"
    );
}


        const referralLink =
            referralData?.referral_link
            ?? "";

        const invitedCount =
            Number(
                referralData?.invited_count
                ?? 0
            );

        const earnedXp =
            Number(
                referralData?.earned_xp
                ?? 0
            );


        const invitedElement =
            root.querySelector(
                "[data-referral-invited]"
            );

        const xpElement =
            root.querySelector(
                "[data-referral-xp]"
            );


        if (invitedElement) {
            invitedElement.textContent =
                String(invitedCount);
        }


        if (xpElement) {
            xpElement.textContent =
                String(earnedXp);
        }


        const avatarImage =
            getReferralAvatarImage(
                profile
            );

        const circularAvatarImage =
            await createCircularQrAvatar(
                avatarImage
            );

        renderReferralQr(
            root,
            referralLink,
            circularAvatarImage,
        );


        bindProfileReferralEvents({
            referralLink,
        });

    } catch (error) {
        console.error(
            "Не удалось загрузить реферальные данные:",
            error,
        );
    }
}
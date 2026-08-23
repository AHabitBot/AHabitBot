import {
    renderProfileSectionHeader,
} from "../profileComponents.js";

import {
    bindProfileSupportEvents,
} from "./profileSupportEvents.js";


import {
    t,
} from "../../../i18n/core/i18n.js";


// =========================================================
// FAQ
// =========================================================

const SUPPORT_QUESTIONS = [
    {
        titleKey: "profile.support.q1.title",
        textKey: "profile.support.q1.text",
    },
    {
        titleKey: "profile.support.q2.title",
        textKey: "profile.support.q2.text",
    },
    {
        titleKey: "profile.support.q3.title",
        textKey: "profile.support.q3.text",
    },
    {
        titleKey: "profile.support.q4.title",
        textKey: "profile.support.q4.text",
    },
    {
        titleKey: "profile.support.q5.title",
        textKey: "profile.support.q5.text",
    },
    {
        titleKey: "profile.support.q6.title",
        textKey: "profile.support.q6.text",
    },
    {
        titleKey: "profile.support.q7.title",
        textKey: "profile.support.q7.text",
    },
];


// =========================================================
// РЕНДЕР ОДНОГО ВОПРОСА
// =========================================================

function renderSupportQuestion(
    question,
) {
    return `
        <article class="profile-support-question">

            <div
                class="profile-support-question__icon"
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">
                    question_mark
                </span>
            </div>

            <div class="profile-support-question__content">

                <h3 class="profile-support-question__title">
                    ${t(question.titleKey)}
                </h3>

                <p class="profile-support-question__text">
                    ${t(question.textKey)}
                </p>

            </div>

        </article>
    `;
}


// =========================================================
// РЕНДЕР СПИСКА FAQ
// =========================================================

function renderSupportQuestions() {
    return SUPPORT_QUESTIONS
        .map(
            renderSupportQuestion
        )
        .join("");
}


// =========================================================
// СТРАНИЦА ПОДДЕРЖКИ
// =========================================================

export function renderProfileSupportPage(
    root,
) {
    root.innerHTML = `
        <section class="profile-support-page">

            <div class="profile-support-scroll">

            <!-- =============================================
                 HEADER
                 ============================================= -->

            <header class="profile-support-header">

                ${renderProfileSectionHeader(
                    t("profile.support.title")
                )}

                <div class="profile-support-heading">

                    <p class="profile-support-heading__title">
                        ${t("profile.support.heading.title")}
                    </p>

                    <p class="profile-support-heading__text">
                        ${t("profile.support.heading.text")}
                    </p>

                </div>

            </header>


            <!-- =============================================
                 BODY
                 Скроллится только эта часть
                 ============================================= -->

            <main class="profile-support-body">

                <section
                    class="profile-support-faq"
                    aria-label="${t("profile.support.faqAria")}"
                >
                    ${renderSupportQuestions()}
                </section>

            </main>

            </div>


            <!-- =============================================
                 FOOTER
                 Всегда закреплён снизу
                 ============================================= -->

            <footer class="profile-support-footer">

                <div class="profile-support-feedback">

                    <div class="profile-support-feedback__top">

                        <div
                            class="profile-support-feedback__icon"
                            aria-hidden="true"
                        >
                            <span class="material-symbols-rounded">
                                chat_bubble
                            </span>
                        </div>


                        <div class="profile-support-feedback__content">

                            <div class="profile-support-feedback__title">
                                ${t("profile.support.feedback.title")}
                            </div>

                            <div class="profile-support-feedback__text">
                                ${t("profile.support.feedback.text")}
                            </div>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="profile-support-feedback__button"
                        data-support-contact
                    >

                        <span
                            class="
                                material-symbols-rounded
                                profile-support-feedback__button-icon
                            "
                            aria-hidden="true"
                        >
                            chat_bubble
                        </span>

                        <span>
                            ${t("profile.support.feedback.button")}
                        </span>

                    </button>

                </div>

            </footer>

        </section>
    `;

    bindProfileSupportEvents(
        root
    );
}
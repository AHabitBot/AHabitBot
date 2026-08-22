import {
    renderProfileSectionHeader,
} from "../profileComponents.js";

import {
    bindProfileSupportEvents,
} from "./profileSupportEvents.js";


// =========================================================
// FAQ
// =========================================================

const SUPPORT_QUESTIONS = [
    {
        title:
            "Как отменить подтверждение привычки?",

        text:
            "Нажмите на галочку подтверждённой "
            + "привычки ещё раз — подтверждение "
            + "за сегодняшний день будет отменено.",
    },

    {
        title:
            "Как работают серии?",

        text:
            "Есть две серии: общая и серия отдельной "
            + "привычки. Общая серия показывает, "
            + "сколько дней подряд вы подтверждали "
            + "хотя бы одну привычку. Серия привычки "
            + "считается отдельно для каждой привычки.",
    },

    {
        title:
            "Что происходит при пропуске дня?",

        text:
            "Если привычка не подтверждена "
            + "в нужный день, её текущая серия "
            + "прерывается.",
    },

    {
        title:
            "Как начисляется XP?",

        text:
            "За подтверждение привычки вы получаете "
            + "+5 XP. XP начисляется максимум "
            + "за 3 подтверждения в день — до "
            + "15 XP в сутки. Остальные привычки "
            + "можно подтверждать, но дополнительный "
            + "XP за них не начисляется.",
    },

    {
        title:
            "Как определяется место в лидерборде?",

        text:
            "Место зависит от количества заработанного "
            + "XP. Чем больше XP — тем выше позиция. "
            + "В сезонном лидерборде учитывается "
            + "результат текущего сезона.",
    },

    {
        title:
            "Как получить новые аватары и оформления?",

        text:
            "Новые аватары и оформления открываются "
            + "за прогресс в AHabit: достижение новых "
            + "уровней, получение достижений и высокие "
            + "места по итогам сезона.",
    },

    {
        title:
            "Зачем архивировать привычку?",

        text:
            "Если привычка больше не актуальна, "
            + "её можно перенести в архив. Она исчезнет "
            + "из активных привычек, но сохранится "
            + "в вашей истории.",
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
                    ${question.title}
                </h3>

                <p class="profile-support-question__text">
                    ${question.text}
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
                    "Поддержка"
                )}

                <div class="profile-support-heading">

                    <p class="profile-support-heading__title">
                        Чем можем помочь?
                    </p>

                    <p class="profile-support-heading__text">
                        Найдите ответ на вопрос
                        или напишите нам.
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
                    aria-label="Часто задаваемые вопросы"
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
                                Остались вопросы?
                            </div>

                            <div class="profile-support-feedback__text">
                                Напишите нам — сообщение
                                получит команда AHabit.
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
                            Задать вопрос
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
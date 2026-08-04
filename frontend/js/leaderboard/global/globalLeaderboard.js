/* =========================================================
   GLOBAL LEADERBOARD

   Контент глобального рейтинга.
   Пока используется статический frontend-каркас.
   ========================================================= */


/* =========================================================
   ВВОДНЫЙ БЛОК
   ========================================================= */

function renderGlobalLeaderboardIntro() {
    return `
        <section
            class="leaderboard-intro"
            aria-labelledby="global-leaderboard-title"
        >

            <div class="leaderboard-intro__copy">

                <h2
                    id="global-leaderboard-title"
                    class="leaderboard-intro__title"
                >
                    Глобальный рейтинг
                </h2>

                <p class="leaderboard-intro__description">
                    Соревнуйтесь с лучшими<br>
                    привычками мира
                </p>

            </div>

            <div
                class="leaderboard-intro__visual"
                aria-hidden="true"
            >
                <img
                    class="leaderboard-intro__image"
                    src="./img/leaderboard/global-section-intro.png"
                    alt=""
                    draggable="false"
                >
            </div>

        </section>
    `;
}


/* =========================================================
   КОНТЕЙНЕР БУДУЩЕГО ПОДИУМА
   ========================================================= */

function renderGlobalLeaderboardPodium() {
    return `
        <section
            class="leaderboard-podium"
            aria-label="Три лучших пользователя"
        ></section>
    `;
}


/* =========================================================
   КОНТЕЙНЕР БУДУЩЕГО СПИСКА
   ========================================================= */

function renderGlobalLeaderboardList() {
    return `
        <section
            class="leaderboard-ranking"
            aria-label="Глобальный рейтинг пользователей"
        ></section>
    `;
}


/* =========================================================
   КОНТЕЙНЕР МЕСТА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
   ========================================================= */

function renderGlobalCurrentUser() {
    return `
        <section
            class="leaderboard-current-user"
            aria-label="Ваше место в рейтинге"
        ></section>
    `;
}


/* =========================================================
   ПОЛНЫЙ КОНТЕНТ ГЛОБАЛЬНОГО РЕЙТИНГА
   ========================================================= */

export function renderGlobalLeaderboard() {
    return `
        <div class="leaderboard-global">

            ${renderGlobalLeaderboardIntro()}

            ${renderGlobalLeaderboardPodium()}

            ${renderGlobalLeaderboardList()}

            ${renderGlobalCurrentUser()}

        </div>
    `;
}
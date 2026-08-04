export function renderTopThree(users = []) {

    return `
        <section class="leaderboard-top-three">

            ${users.map(user => `

                <div class="
                    leaderboard-top-card
                    leaderboard-top-card--${user.rank}
                ">

                    <div class="leaderboard-top-card__medal">
                        ${user.medal}
                    </div>

                    <img
                        class="leaderboard-top-card__avatar"
                        src="${user.avatar}"
                        alt="${user.name}"
                    >

                    <div class="leaderboard-top-card__name">
                        ${user.name}
                    </div>

                    <div class="leaderboard-top-card__xp">

                        <span class="material-symbols-rounded">
                            trophy
                        </span>

                        ${user.xp}

                        <span>XP</span>

                    </div>

                </div>

            `).join("")}

        </section>
    `;

}
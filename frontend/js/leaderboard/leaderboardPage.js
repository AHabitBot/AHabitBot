import {
    formatLeaderboardXp,
    getCurrentLeaderboardUser,
    getLeaderboardUsersAfterTop,
    getSelectedLeaderboardTab,
    getTopLeaderboardUsers
} from "./leaderboardStore.js"


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}


function getUserInitial(name) {
    const safeName =
        String(name ?? "")
            .trim()

    if (!safeName) {
        return "?"
    }

    return safeName
        .charAt(0)
        .toUpperCase()
}


function createAvatar(user, className = "") {
    const name =
        escapeHtml(user?.name)

    const avatar =
        escapeHtml(user?.avatar)

    const initial =
        escapeHtml(
            getUserInitial(user?.name)
        )

    return `
        <div
            class="leaderboard-avatar ${className}"
            data-avatar-wrapper
        >
            <span
                class="leaderboard-avatar__fallback"
                aria-hidden="true"
            >
                ${initial}
            </span>

            <img
                class="leaderboard-avatar__image"
                src="${avatar}"
                alt="Аватар пользователя ${name}"
                loading="lazy"
                data-avatar-image
            >
        </div>
    `
}


function getMedalMarkup(position) {
    const medals = {
        1: {
            className: "leaderboard-medal--gold",
            label: "Золотая медаль"
        },
        2: {
            className: "leaderboard-medal--silver",
            label: "Серебряная медаль"
        },
        3: {
            className: "leaderboard-medal--bronze",
            label: "Бронзовая медаль"
        }
    }

    const medal =
        medals[position]

    if (!medal) {
        return ""
    }

    return `
        <div
            class="leaderboard-medal ${medal.className}"
            aria-label="${medal.label}"
        >
            <span class="leaderboard-medal__number">
                ${position}
            </span>
        </div>
    `
}


function createPodiumUserCard(user) {
    if (!user) {
        return ""
    }

    const name =
        escapeHtml(user.name)

    const xp =
        formatLeaderboardXp(user.xp)

    const isWinner =
        user.position === 1

    return `
        <article
            class="
                leaderboard-podium-card
                leaderboard-podium-card--position-${user.position}
                ${isWinner
                    ? "leaderboard-podium-card--winner"
                    : ""
                }
            "
        >
            ${
                isWinner
                    ? `
                        <div
                            class="leaderboard-crown"
                            aria-label="Первое место"
                        >
                            👑
                        </div>
                    `
                    : ""
            }

            ${createAvatar(
                user,
                "leaderboard-avatar--podium"
            )}

            ${getMedalMarkup(user.position)}

            <div class="leaderboard-podium-card__name">
                ${name}
            </div>

            <div class="leaderboard-podium-card__xp">
                <span
                    class="material-symbols-rounded"
                    aria-hidden="true"
                >
                    trophy
                </span>

                <strong>${xp}</strong>
                <span>XP</span>
            </div>
        </article>
    `
}


function createPodium() {
    const topUsers =
        getTopLeaderboardUsers(3)

    const first =
        topUsers.find(
            user => user.position === 1
        )

    const second =
        topUsers.find(
            user => user.position === 2
        )

    const third =
        topUsers.find(
            user => user.position === 3
        )

    return `
        <section
            class="leaderboard-podium"
            aria-label="Тройка лидеров"
        >
            ${createPodiumUserCard(second)}
            ${createPodiumUserCard(first)}
            ${createPodiumUserCard(third)}
        </section>
    `
}


function createLeaderboardListItem(user) {
    const name =
        escapeHtml(user.name)

    const xp =
        formatLeaderboardXp(user.xp)

    const isCurrentUser =
        user.id ===
        getCurrentLeaderboardUser()?.id

    return `
        <article
            class="
                leaderboard-list-item
                ${isCurrentUser
                    ? "leaderboard-list-item--current"
                    : ""
                }
            "
            data-user-id="${user.id}"
        >
            <div class="leaderboard-list-item__position">
                ${user.position}
            </div>

            ${createAvatar(
                user,
                "leaderboard-avatar--list"
            )}

            <div class="leaderboard-list-item__name">
                ${name}
            </div>

            <div class="leaderboard-list-item__xp">
                <strong>${xp}</strong>
                <span>XP</span>
            </div>
        </article>
    `
}


function createLeaderboardList() {
    const users =
        getLeaderboardUsersAfterTop(97)

    if (!users.length) {
        return `
            <div class="leaderboard-empty">
                В рейтинге пока нет пользователей
            </div>
        `
    }

    return `
        <section
            class="leaderboard-list"
            aria-label="Глобальный рейтинг пользователей"
        >
            ${users
                .map(createLeaderboardListItem)
                .join("")
            }
        </section>
    `
}


function createCurrentUserBlock() {
    const user =
        getCurrentLeaderboardUser()

    if (!user) {
        return ""
    }

    const xp =
        formatLeaderboardXp(user.xp)

    return `
        <section
            class="leaderboard-current-user"
            aria-label="Ваше место в рейтинге"
        >
            <div class="leaderboard-current-user__position">
                ${user.position}
            </div>

            ${createAvatar(
                user,
                "leaderboard-avatar--current"
            )}

            <div class="leaderboard-current-user__name">
                Вы
            </div>

            <div class="leaderboard-current-user__xp">
                <span
                    class="material-symbols-rounded"
                    aria-hidden="true"
                >
                    trophy
                </span>

                <strong>
                    ${xp}
                </strong>

                <span>XP</span>
            </div>
        </section>
    `
}


function createLeaderboardTabs() {
    const selectedTab =
        getSelectedLeaderboardTab()

    return `
        <div
            class="leaderboard-tabs"
            role="tablist"
            aria-label="Разделы лидерборда"
        >
            <button
                class="
                    leaderboard-tab
                    ${selectedTab === "global"
                        ? "leaderboard-tab--active"
                        : ""
                    }
                "
                type="button"
                role="tab"
                aria-selected="${selectedTab === "global"}"
                data-leaderboard-tab="global"
            >
                Глобальный
            </button>

            <button
                class="
                    leaderboard-tab
                    ${selectedTab === "season"
                        ? "leaderboard-tab--active"
                        : ""
                    }
                "
                type="button"
                role="tab"
                aria-selected="${selectedTab === "season"}"
                data-leaderboard-tab="season"
            >
                Сезонный
            </button>
        </div>
    `
}


function createGlobalLeaderboardContent() {
    return `
        <div class="leaderboard-global">
            <section class="leaderboard-hero">
                <div class="leaderboard-hero__content">
                    <h2 class="leaderboard-hero__title">
                        Глобальный рейтинг
                    </h2>

                    <p class="leaderboard-hero__description">
                        Соревнуйтесь с пользователями
                        со всего мира и поднимайтесь
                        на вершину.
                    </p>
                </div>

                <div
                    class="leaderboard-hero__visual"
                    aria-hidden="true"
                >
                    <div class="leaderboard-globe">
                        🌍
                    </div>
                </div>
            </section>

            ${createPodium()}

            <div class="leaderboard-ranking-area">
                ${createLeaderboardList()}
            </div>

            ${createCurrentUserBlock()}
        </div>
    `
}


function createSeasonPlaceholder() {
    return `
        <section class="leaderboard-season-placeholder">
            <div
                class="leaderboard-season-placeholder__icon"
                aria-hidden="true"
            >
                🏆
            </div>

            <h2 class="leaderboard-season-placeholder__title">
                Сезонный рейтинг
            </h2>

            <p class="leaderboard-season-placeholder__description">
                Этот раздел мы создадим после полной
                полировки глобального лидерборда.
            </p>
        </section>
    `
}


function createLeaderboardContent() {
    const selectedTab =
        getSelectedLeaderboardTab()

    if (selectedTab === "season") {
        return createSeasonPlaceholder()
    }

    return createGlobalLeaderboardContent()
}


function initAvatarFallbacks(root) {
    const images =
        root.querySelectorAll(
            "[data-avatar-image]"
        )

    images.forEach(image => {
        const wrapper =
            image.closest(
                "[data-avatar-wrapper]"
            )

        const showFallback = () => {
            wrapper?.classList.add(
                "leaderboard-avatar--fallback"
            )

            image.remove()
        }

        image.addEventListener(
            "error",
            showFallback,
            {
                once: true
            }
        )

        if (
            image.complete &&
            image.naturalWidth === 0
        ) {
            showFallback()
        }
    })
}


export function renderLeaderboardPage(root) {
    if (!root) {
        console.error(
            "Leaderboard: контейнер страницы не найден"
        )

        return
    }

    root.innerHTML = `
        <main
            class="leaderboard-page"
            data-leaderboard-page
        >
            <header class="leaderboard-header">
                <h1 class="leaderboard-header__title">
                    Лидерборд
                </h1>
            </header>

            ${createLeaderboardTabs()}

            <div class="leaderboard-content">
                ${createLeaderboardContent()}
            </div>
        </main>
    `

    initAvatarFallbacks(root)
}
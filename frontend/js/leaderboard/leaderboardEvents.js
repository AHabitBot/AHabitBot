import {
    getSelectedLeaderboardTab,
    setSelectedLeaderboardTab
} from "./leaderboardStore.js"

import {
    renderLeaderboardPage
} from "./leaderboardPage.js"


function handleLeaderboardTabClick(event) {
    const tabButton =
        event.target.closest(
            "[data-leaderboard-tab]"
        )

    if (!tabButton) {
        return
    }

    const nextTab =
        tabButton.dataset.leaderboardTab

    const currentTab =
        getSelectedLeaderboardTab()

    if (!nextTab || nextTab === currentTab) {
        return
    }

    setSelectedLeaderboardTab(nextTab)

    const leaderboardRoot =
        document.getElementById(
            "leaderboard-root"
        )

    if (!leaderboardRoot) {
        console.error(
            "Leaderboard: не найден #leaderboard-root"
        )

        return
    }

    renderLeaderboardPage(
        leaderboardRoot
    )
}


function bindLeaderboardTabs(root) {
    root.addEventListener(
        "click",
        handleLeaderboardTabClick
    )
}


export function initLeaderboardEvents() {
    const leaderboardRoot =
        document.getElementById(
            "leaderboard-root"
        )

    if (!leaderboardRoot) {
        console.error(
            "Leaderboard: не найден контейнер #leaderboard-root"
        )

        return
    }

    renderLeaderboardPage(
        leaderboardRoot
    )

    bindLeaderboardTabs(
        leaderboardRoot
    )
}
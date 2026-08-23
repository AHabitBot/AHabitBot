import {
    apiRequest
} from "../api/apiClient.js"

import {
    RESOURCE_KEYS,
    setResource
} from "./resourceCache.js"

import {
    setHabits,
    setHabitsStatistics
} from "../habits/habitsStore.js"

import {
    buildGlobalLeaderboardResource
} from "../leaderboard/global/globalLeaderboard.js"

import {
    buildSeasonLeaderboardResource
} from "../leaderboard/season/seasonLeaderboard.js"

import {
    syncThemeFromSettings
} from "./theme.js"

import {
    setLanguage
} from "../../i18n/core/i18n.js"


function normalizeHabit(habit = {}) {
    return {
        id: String(habit.id),
        name: habit.title || "",
        icon: habit.emoji || "✱",
        color: habit.color || "green",
        size: habit.size || "large",
        xpReward: Number(habit.xp_reward) || 5,
        createdAt: habit.created_at || null,
        completedToday: Boolean(habit.completed_today),
        streak: Number(habit.streak) || 0,
        weekProgress: Array.isArray(habit.week_progress)
            ? habit.week_progress
            : [],
        completedDates: Array.isArray(habit.completed_dates)
            ? habit.completed_dates
            : []
    }
}


function hydrateHabits(data = {}) {
    const habits = Array.isArray(data.habits)
        ? data.habits.map(normalizeHabit)
        : []

    const statistics = data.statistics || {}

    setHabits(habits)

    setHabitsStatistics({
        currentStreak: Number(statistics.current_streak) || 0,
        maxStreak: Number(statistics.max_streak) || 0,
        totalConfirmations: Number(statistics.total_confirmations) || 0,
        totalXp: Number(statistics.total_xp) || 0
    })
}


function hydrateResources(data) {
    /*
     * Привычки храним отдельно в habitsStore.
     * В Resource Cache их больше не дублируем.
     */
    hydrateHabits(data.habits)


    /*
     * Профиль
     */
    setResource(
        RESOURCE_KEYS.PROFILE,
        data.profile
    )


    /*
     * Игровые показатели
     */
    setResource(
        RESOURCE_KEYS.STATS_WEEK,
        data.stats.week
    )

    setResource(
        RESOURCE_KEYS.STATS_MONTH,
        data.stats.month
    )

    setResource(
        RESOURCE_KEYS.STATS_YEAR,
        data.stats.year
    )


    /*
     * Лидерборды
     */
    setResource(
        RESOURCE_KEYS.LEADERBOARD_GLOBAL,
        buildGlobalLeaderboardResource(
            data.leaderboard.global
        )
    )

    setResource(
        RESOURCE_KEYS.LEADERBOARD_SEASON,
        buildSeasonLeaderboardResource(
            data.leaderboard.season
        )
    )


    /*
     * Достижения
     */
    setResource(
        RESOURCE_KEYS.ACHIEVEMENTS,
        data.achievements
    )


    /*
     * Реферальные данные
     */
    setResource(
        RESOURCE_KEYS.REFERRAL,
        data.referral
    )
}


function preloadImage(src) {
    if (!src) {
        return
    }

    const image = new Image()
    image.src = src
}


function preloadCurrentAppearance(profile = {}) {
    const avatarKey = String(
        profile.avatar_key || "standard_m_01"
    )

    const backgroundKey = String(
        profile.background_key || "background_forest_1"
    )

    if (
        /^[a-zA-Z0-9_-]+$/.test(
            avatarKey
        )
    ) {
        preloadImage(
            `/img/profile/avatar/avatar_${avatarKey}.png`
        )
    }

    if (
        /^[a-zA-Z0-9_-]+$/.test(
            backgroundKey
        )
    ) {
        preloadImage(
            `/img/profile/background/${backgroundKey}.jpg`
        )
    }
}


export async function bootstrapApp({ onProgress } = {}) {
    const reportProgress = (value) => {
        if (typeof onProgress === "function") {
            onProgress(value)
        }
    }

    reportProgress(8)

    const data = await apiRequest(
        "/api/bootstrap"
    )

    if (
        !data ||
        typeof data !== "object" ||
        !data.habits ||
        !data.profile ||
        !data.leaderboard ||
        !data.stats
    ) {
        throw new Error(
            "Bootstrap: сервер вернул неполные данные"
        )
    }

    /*
     * Один раз наполняем всё состояние приложения.
     */
    reportProgress(72)

    setLanguage(
        data.settings?.language || "ru",
        { emit: false }
    )

    reportProgress(80)

    syncThemeFromSettings(data.settings || {})

    reportProgress(86)

    hydrateResources(data)

    reportProgress(94)


    /*
     * Заранее подгружаем только текущий
     * аватар и фон пользователя.
     *
     * Остальные изображения приложение
     * может загружать позже самостоятельно.
     */
    preloadCurrentAppearance(
        data.profile
    )

    reportProgress(97)

    return data
}
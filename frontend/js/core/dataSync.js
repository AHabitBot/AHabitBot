import {
    RESOURCE_KEYS,
    refreshCachedResources
} from "./resourceCache.js"


/* =========================================================
   DATA SYNC

   Здесь хранится карта зависимостей данных
   от действий пользователя.

   ВАЖНО:

   - страницы сами не решают,
     что нужно обновлять;

   - они только сообщают,
     какое действие произошло;

   - Resource Cache обновляется в фоне;

   - уже открытая страница
     НЕ перерисовывается автоматически.
   ========================================================= */


/* =========================================================
   ОБЩИЙ HELPER
   ========================================================= */

function syncResources(
    resourceKeys,
    actionName
) {
    return refreshCachedResources(
        resourceKeys
    )
        .then(
            (results) => {

                results.forEach(
                    (result) => {

                        if (
                            result.status ===
                            "rejected"
                        ) {
                            console.warn(
                                `Data Sync: "${actionName}" — фоновое обновление не удалось`,
                                result.reason
                            )
                        }
                    }
                )

                return results
            }
        )
}


/* =========================================================
   ПОДТВЕРЖДЕНИЕ ПРИВЫЧКИ

   Может изменить:

   - XP;
   - уровень;
   - достижения;
   - статистику;
   - глобальный рейтинг;
   - сезонный рейтинг.
   ========================================================= */

const HABIT_CONFIRMATION_RESOURCES = [
    RESOURCE_KEYS.PROFILE,
    RESOURCE_KEYS.ACHIEVEMENTS,

    RESOURCE_KEYS.STATS_WEEK,
    RESOURCE_KEYS.STATS_MONTH,
    RESOURCE_KEYS.STATS_YEAR,

    RESOURCE_KEYS.LEADERBOARD_GLOBAL,
    RESOURCE_KEYS.LEADERBOARD_SEASON
]


export function syncAfterHabitConfirmation() {
    return syncResources(
        HABIT_CONFIRMATION_RESOURCES,
        "habit_confirmation"
    )
}


/* =========================================================
   АРХИВАЦИЯ ПРИВЫЧКИ

   Архивация НЕ изменяет:

   - XP;
   - достижения;
   - статистику;
   - лидерборд.

   Она изменяет только принадлежность привычки
   к активному списку / архиву.

   ARCHIVED_HABITS обновляем только если
   пользователь уже когда-либо открывал Архив.
   ========================================================= */

const HABIT_ARCHIVE_RESOURCES = [
    RESOURCE_KEYS.ARCHIVED_HABITS
]


export function syncAfterHabitArchive() {
    return syncResources(
        HABIT_ARCHIVE_RESOURCES,
        "habit_archive"
    )
}


/* =========================================================
   ВОССТАНОВЛЕНИЕ ПРИВЫЧКИ

   Восстановление также НЕ пересчитывает:

   - XP;
   - достижения;
   - статистику;
   - лидерборд.

   История привычки остаётся прежней.

   Обновляем только уже использованный
   ресурс Архива.
   ========================================================= */

const HABIT_RESTORE_RESOURCES = [
    RESOURCE_KEYS.ARCHIVED_HABITS
]


export function syncAfterHabitRestore() {
    return syncResources(
        HABIT_RESTORE_RESOURCES,
        "habit_restore"
    )
}


/* =========================================================
   ИЗМЕНЕНИЕ NICKNAME

   Nickname отображается:

   - в Profile;
   - в Global Leaderboard;
   - в Season Leaderboard.
   ========================================================= */

const NICKNAME_CHANGE_RESOURCES = [
    RESOURCE_KEYS.PROFILE,

    RESOURCE_KEYS.LEADERBOARD_GLOBAL,
    RESOURCE_KEYS.LEADERBOARD_SEASON
]


export function syncAfterNicknameChange() {
    return syncResources(
        NICKNAME_CHANGE_RESOURCES,
        "nickname_change"
    )
}


/* =========================================================
   ИЗМЕНЕНИЕ ВНЕШНЕГО ВИДА

   Avatar / Background могут отображаться:

   - в Profile;
   - в Global Leaderboard;
   - в Season Leaderboard.
   ========================================================= */

const APPEARANCE_CHANGE_RESOURCES = [
    RESOURCE_KEYS.PROFILE,

    RESOURCE_KEYS.LEADERBOARD_GLOBAL,
    RESOURCE_KEYS.LEADERBOARD_SEASON
]


export function syncAfterAppearanceChange() {
    return syncResources(
        APPEARANCE_CHANGE_RESOURCES,
        "appearance_change"
    )
}
/* =========================================================
   PROFILE V2 — ДОСТУПНОСТЬ РАЗДЕЛОВ
   ========================================================= */


/*
    true  — раздел доступен
    false — раздел пока находится в разработке

    ВАЖНО:
    пока весь профиль отдельно закрыт проверкой Telegram ID.

    Позже общий ID-фильтр профиля удалим,
    а эти флаги оставим для постепенного открытия разделов.
*/

export const PROFILE_FEATURES = {
    stats: true,
    achievements: true,
    appearance: true,
    settings: true,
    support: true,
    referral: true,
    archive: true
}


/* =========================================================
   ПРОВЕРИТЬ ДОСТУПНОСТЬ
   ========================================================= */

export function isProfileFeatureEnabled(feature) {
    return PROFILE_FEATURES[feature] === true
}
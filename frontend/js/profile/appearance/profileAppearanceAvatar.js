import { t } from "../../../i18n/core/i18n.js";

/* =========================================================
   PROFILE APPEARANCE — AVATAR
   ========================================================= */


/* =========================================================
   AVATAR OPTIONS
   ========================================================= */

export const PROFILE_AVATARS = [

    /* =====================================================
       STANDARD — LEVEL 1
       ===================================================== */

    {
        id: "standard_m_01",
        category: "standard",
        requiredLevel: 1,
        image: "./img/profile/avatar/avatar_standard_m_01.png"
    },
    {
        id: "standard_f_01",
        category: "standard",
        requiredLevel: 1,
        image: "./img/profile/avatar/avatar_standard_f_01.png"
    },


    /* =====================================================
       STANDARD — LEVEL 5
       ===================================================== */

    {
        id: "standard_m_02",
        category: "standard",
        requiredLevel: 5,
        image: "./img/profile/avatar/avatar_standard_m_02.png"
    },
    {
        id: "standard_f_02",
        category: "standard",
        requiredLevel: 5,
        image: "./img/profile/avatar/avatar_standard_f_02.png"
    },


    /* =====================================================
       STANDARD — LEVEL 10
       ===================================================== */

    {
        id: "standard_m_03",
        category: "standard",
        requiredLevel: 10,
        image: "./img/profile/avatar/avatar_standard_m_03.png"
    },
    {
        id: "standard_f_03",
        category: "standard",
        requiredLevel: 10,
        image: "./img/profile/avatar/avatar_standard_f_03.png"
    },


    /* =====================================================
       STANDARD — LEVEL 15
       ===================================================== */

    {
        id: "standard_m_04",
        category: "standard",
        requiredLevel: 15,
        image: "./img/profile/avatar/avatar_standard_m_04.png"
    },
    {
        id: "standard_f_04",
        category: "standard",
        requiredLevel: 15,
        image: "./img/profile/avatar/avatar_standard_f_04.png"
    },


    /* =====================================================
       STANDARD — LEVEL 20
       ===================================================== */

    {
        id: "standard_m_05",
        category: "standard",
        requiredLevel: 20,
        image: "./img/profile/avatar/avatar_standard_m_05.png"
    },
    {
        id: "standard_f_05",
        category: "standard",
        requiredLevel: 20,
        image: "./img/profile/avatar/avatar_standard_f_05.png"
    }

]


/* =========================================================
   DEFAULT AVATAR
   ========================================================= */

export const DEFAULT_PROFILE_AVATAR_ID =
    "standard_m_01"


/* =========================================================
   GET AVATAR
   ========================================================= */

export function getProfileAvatar(
    avatarId
) {
    return (
        PROFILE_AVATARS.find(
            avatar =>
                avatar.id === avatarId
        )
        || null
    )
}


/* =========================================================
   GET DEFAULT AVATAR
   ========================================================= */

export function getDefaultProfileAvatar() {
    return getProfileAvatar(
        DEFAULT_PROFILE_AVATAR_ID
    )
}


/* =========================================================
   IS AVATAR UNLOCKED
   ========================================================= */

export function isProfileAvatarUnlocked(
    avatar,
    userLevel
) {
    if (!avatar) {
        return false
    }

    const level =
        Math.max(
            1,
            Number(userLevel) || 1
        )

    const requiredLevel =
        Math.max(
            1,
            Number(
                avatar.requiredLevel
            ) || 1
        )

    return (
        level >= requiredLevel
    )
}


/* =========================================================
   GET AVATAR UNLOCK LEVEL
   ========================================================= */

export function getProfileAvatarUnlockLevel(
    avatarId
) {
    const avatar =
        getProfileAvatar(
            avatarId
        )

    if (!avatar) {
        return null
    }

    return (
        Math.max(
            1,
            Number(
                avatar.requiredLevel
            ) || 1
        )
    )
}
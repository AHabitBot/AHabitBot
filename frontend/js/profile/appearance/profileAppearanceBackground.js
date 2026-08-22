import { t } from "../../../i18n/core/i18n.js";

/* =========================================================
   PROFILE APPEARANCE — BACKGROUND
   ========================================================= */


/* =========================================================
   BACKGROUND OPTIONS
   ========================================================= */
export const PROFILE_BACKGROUNDS = [
    {
        id: "background_forest_1",
        image: "./img/profile/background/background_forest_1.jpg"
    },
    {
        id: "background_mountain_2",
        image: "./img/profile/background/background_mountain_2.jpg"
    },
    {
        id: "background_desert_3",
        image: "./img/profile/background/background_desert_3.jpg"
    }
]


/* =========================================================
   DEFAULT BACKGROUND
   ========================================================= */

export const DEFAULT_PROFILE_BACKGROUND_ID =
    "background_forest_1"


/* =========================================================
   GET BACKGROUND
   ========================================================= */

export function getProfileBackground(
    backgroundId
) {
    return (
        PROFILE_BACKGROUNDS.find(
            background =>
                background.id === backgroundId
        )
        || null
    )
}


/* =========================================================
   GET DEFAULT BACKGROUND
   ========================================================= */

export function getDefaultProfileBackground() {
    return getProfileBackground(
        DEFAULT_PROFILE_BACKGROUND_ID
    )
}
/* =========================================================
   PROFILE APPEARANCE — FRAME
   ========================================================= */

export const PROFILE_FRAMES = [
    {
        id: "frame_bronze",
        image: "./img/profile/frame/frame_bronze.png"
    },
    {
        id: "frame_vine",
        image: "./img/profile/frame/frame_vine.png"
    }
]

export const DEFAULT_PROFILE_FRAME_ID =
    "frame_bronze"

export function getProfileFrame(frameId) {
    return (
        PROFILE_FRAMES.find(
            frame => frame.id === frameId
        )
        || null
    )
}

export function getDefaultProfileFrame() {
    return getProfileFrame(
        DEFAULT_PROFILE_FRAME_ID
    )
}

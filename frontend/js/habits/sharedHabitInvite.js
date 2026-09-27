import { apiRequest } from "../api/apiClient.js"
import { t } from "../../i18n/core/i18n.js"

function getInviteToken() {
    const startParam = String(
        window.Telegram?.WebApp?.initDataUnsafe?.start_param || ""
    )
    if (!startParam.startsWith("habit_")) return ""
    return startParam.slice(6).trim()
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

function avatarSrc(key) {
    const safe = /^[a-zA-Z0-9_-]+$/.test(String(key || ""))
        ? String(key)
        : "standard_m_01"
    return `/img/profile/avatar/avatar_${safe}.png`
}

function closeInvite() {
    document.querySelector("[data-shared-invite-overlay]")?.remove()
}

function renderInvite(invite, token) {
    closeInvite()

    const overlay = document.createElement("div")
    overlay.className = "shared-invite-overlay"
    overlay.dataset.sharedInviteOverlay = ""

    const disabled = invite.is_own || invite.already_joined || invite.is_full
    let buttonText = t("habits.sharedInvite.join")
    if (invite.is_own) buttonText = t("habits.sharedInvite.own")
    else if (invite.already_joined) buttonText = t("habits.sharedInvite.alreadyJoined")
    else if (invite.is_full) buttonText = t("habits.sharedInvite.full")

    overlay.innerHTML = `
        <div class="shared-invite-card">
            <button class="shared-invite-card__close" type="button" data-shared-invite-close>×</button>
            <img class="shared-invite-card__avatar" src="${avatarSrc(invite.avatar_key)}" alt="">
            <div class="shared-invite-card__eyebrow">${escapeHtml(invite.owner_name)}</div>
            <h2 class="shared-invite-card__title">${escapeHtml(invite.title)}</h2>
            <p class="shared-invite-card__text">${t("habits.sharedInvite.text")}</p>
            <button class="shared-invite-card__join" type="button" data-shared-invite-join ${disabled ? "disabled" : ""}>
                ${buttonText}
            </button>
        </div>
    `

    document.body.appendChild(overlay)
    overlay.querySelector("[data-shared-invite-close]")?.addEventListener("click", closeInvite)

    const joinButton = overlay.querySelector("[data-shared-invite-join]")
    joinButton?.addEventListener("click", async () => {
        if (joinButton.disabled) return
        joinButton.disabled = true
        joinButton.textContent = t("habits.sharedInvite.joining")
        try {
            await apiRequest(`/api/habits/invite/${encodeURIComponent(token)}/join`, { method: "POST" })
            joinButton.textContent = t("habits.sharedInvite.joined")
            window.setTimeout(() => window.location.reload(), 500)
        } catch (error) {
            console.error("Не удалось присоединиться к привычке", error)
            joinButton.disabled = false
            joinButton.textContent = t("habits.sharedInvite.join")
        }
    })
}

export async function openSharedHabitInviteFromTelegram() {
    const token = getInviteToken()
    if (!token) return

    try {
        const data = await apiRequest(`/api/habits/invite/${encodeURIComponent(token)}`)
        if (data?.invite) renderInvite(data.invite, token)
    } catch (error) {
        console.error("Не удалось открыть приглашение привычки", error)
    }
}

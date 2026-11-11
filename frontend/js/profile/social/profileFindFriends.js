import { apiRequest } from "../../api/apiClient.js";
import { getProfileAvatar, getDefaultProfileAvatar } from "../appearance/profileAppearanceAvatar.js";
import { t } from "../../../i18n/core/i18n.js";
import { renderProfileSectionHeader } from "../profileComponents.js";

const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
export function openFindFriendsPage(root, { onBack, onSearch, onInvite, onUser } = {}) {
    root.innerHTML = `<section class="profile-find-friends">
      ${renderProfileSectionHeader(t("profile.social.findFriends"))}
      <div class="profile-find-friends__actions">
        <button type="button" class="profile-find-friends__action" data-find-search><span class="material-symbols-rounded" aria-hidden="true">search</span><span class="profile-find-friends__action-text"><strong>${t("profile.social.searchByName")}</strong></span><span class="material-symbols-rounded" aria-hidden="true">chevron_right</span></button>
        <button type="button" class="profile-find-friends__action" data-find-invite><span class="material-symbols-rounded" aria-hidden="true">person_add</span><span class="profile-find-friends__action-text"><strong>${t("profile.social.inviteFriend")}</strong></span><span class="material-symbols-rounded" aria-hidden="true">chevron_right</span></button>
      </div>
      <h2 class="profile-find-friends__heading">${t("profile.social.suggestions")}</h2>
      <div class="profile-find-friends__suggestions" aria-live="polite"><p class="profile-find-friends__empty">${t("profile.social.loading")}</p></div>
    </section>`;
    root.querySelector("[data-profile-back]")?.addEventListener("click", e => { e.stopPropagation(); onBack?.(); });
    root.querySelector("[data-find-search]")?.addEventListener("click", () => onSearch?.());
    root.querySelector("[data-find-invite]")?.addEventListener("click", () => onInvite?.());
    const container = root.querySelector(".profile-find-friends__suggestions");
    void (async () => {
        try {
            const data = await apiRequest("/api/follows/suggestions?limit=3");
            if (!container.isConnected) return;
            const items = data.items || [];
            if (!items.length) {
                container.innerHTML = `<p class="profile-find-friends__empty">${escape(t("profile.social.suggestionsSoon"))}</p>`;
                return;
            }
            container.replaceChildren();
            for (const item of items) {
                const avatar = getProfileAvatar(item.avatar_key) || getDefaultProfileAvatar();
                const card = document.createElement("div");
                card.className = "profile-find-friends__person";
                card.innerHTML = `<button type="button" class="profile-find-friends__identity"><img src="${escape(avatar.image)}" alt=""><strong>${escape(item.nickname || "Player")}</strong><small>${escape(t("profile.social.mutualFriend"))} ${escape(item.mutual_name || "")}</small></button><button type="button" class="profile-find-friends__follow">${escape(t("profile.social.follow"))}</button>`;
                card.querySelector(".profile-find-friends__identity").addEventListener("click", () => onUser?.(item.id));
                const follow = card.querySelector(".profile-find-friends__follow");
                follow.addEventListener("click", async () => {
                    follow.disabled = true;
                    try {
                        await apiRequest(`/api/follows/users/${encodeURIComponent(item.id)}`, { method: "POST" });
                        if (card.isConnected) card.remove();
                        if (container.isConnected && !container.children.length) container.innerHTML = `<p class="profile-find-friends__empty">${escape(t("profile.social.suggestionsSoon"))}</p>`;
                    } catch (error) {
                        console.error("Follow suggestion:", error);
                        if (follow.isConnected) { follow.disabled = false; follow.textContent = t("profile.social.follow"); }
                    }
                });
                container.append(card);
            }
        } catch (error) {
            console.error("Friend suggestions:", error);
            if (container.isConnected) container.innerHTML = `<p class="profile-find-friends__empty">${escape(t("profile.social.loadError"))}</p>`;
        }
    })();
}

export function openFindFriendsSearchPage(root, { onBack } = {}) {
    root.innerHTML = `<section class="profile-find-friends">
      ${renderProfileSectionHeader(t("profile.social.searchByName"))}
      <p class="profile-find-friends__empty">${t("profile.social.searchSoon")}</p>
    </section>`;
    root.querySelector("[data-profile-back]")?.addEventListener("click", e => { e.stopPropagation(); onBack?.(); });
}

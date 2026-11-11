import { apiRequest } from "../../api/apiClient.js";
import { getProfileAvatar, getDefaultProfileAvatar } from "../appearance/profileAppearanceAvatar.js";
import { t } from "../../../i18n/core/i18n.js";
import { renderProfileSectionHeader } from "../profileComponents.js";

const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const PAGE_SIZE = 30;

function createSuggestions(root, container, { full = false, onUser } = {}) {
    let offset = 0;
    let loading = false;
    let finished = false;
    let shown = 0;
    const pageSize = full ? PAGE_SIZE : 3;
    const empty = () => `<p class="profile-find-friends__empty">${escape(t("profile.social.suggestionsSoon"))}</p>`;
    const load = async () => {
        if (loading || finished || !container.isConnected) return;
        loading = true;
        const more = root.querySelector("[data-find-more]");
        if (more) more.disabled = true;
        try {
            const data = await apiRequest(`/api/follows/suggestions?limit=${pageSize}&offset=${offset}`);
            if (!container.isConnected) return;
            const items = data.items || [];
            offset += items.length;
            finished = !data.has_more;
            for (const item of items) {
                const avatar = getProfileAvatar(item.avatar_key) || getDefaultProfileAvatar();
                const card = document.createElement("div");
                card.className = "profile-find-friends__person";
                card.innerHTML = `<button type="button" class="profile-find-friends__identity"><img src="${escape(avatar.image)}" alt=""><span class="profile-find-friends__details"><strong>${escape(item.nickname || "Player")}</strong><small>${escape(t("profile.social.mutualFriend"))} ${escape(item.mutual_name || "")}</small></span></button><button type="button" class="profile-find-friends__follow">${escape(t("profile.social.follow"))}</button><button type="button" class="profile-find-friends__dismiss" aria-label="${escape(t("profile.social.hideSuggestion"))}" title="${escape(t("profile.social.hideSuggestion"))}"><span class="material-symbols-rounded" aria-hidden="true">close</span></button>`;
                card.querySelector(".profile-find-friends__identity").addEventListener("click", () => onUser?.(item.id));
                const follow = card.querySelector(".profile-find-friends__follow");
                const dismiss = card.querySelector(".profile-find-friends__dismiss");
                const removeCard = () => {
                    if (!card.isConnected) return;
                    card.remove();
                    shown--;
                    // Reload the first page after a mutation to avoid offset skipping.
                    // On the compact page, refill up to three suggestions.
                    void refresh();
                };
                follow.addEventListener("click", async () => {
                    follow.disabled = true;
                    dismiss.disabled = true;
                    try {
                        await apiRequest(`/api/follows/users/${encodeURIComponent(item.id)}`, { method: "POST" });
                        removeCard();
                    } catch (error) {
                        console.error("Follow suggestion:", error);
                        if (follow.isConnected) { follow.disabled = false; dismiss.disabled = false; }
                    }
                });
                dismiss.addEventListener("click", async () => {
                    follow.disabled = true;
                    dismiss.disabled = true;
                    try {
                        await apiRequest(`/api/follows/suggestions/${encodeURIComponent(item.id)}/hide`, { method: "POST" });
                        removeCard();
                    } catch (error) {
                        console.error("Hide suggestion:", error);
                        if (dismiss.isConnected) { follow.disabled = false; dismiss.disabled = false; }
                    }
                });
                container.append(card);
                shown++;
            }
            if (!shown) container.innerHTML = empty();
            if (more) more.hidden = finished;
        } catch (error) {
            console.error("Friend suggestions:", error);
            if (!shown && container.isConnected) container.innerHTML = `<p class="profile-find-friends__empty">${escape(t("profile.social.loadError"))}</p>`;
        } finally {
            loading = false;
            if (more?.isConnected) more.disabled = false;
        }
    };
    const refresh = async () => {
        if (!container.isConnected) return;
        container.innerHTML = "";
        offset = 0;
        shown = 0;
        finished = false;
        if (loading) { // Wait for the in-flight request before refreshing.
            return;
        }
        await load();
    };
    root.querySelector("[data-find-more]")?.addEventListener("click", load);
    void load();
}

export function openFindFriendsPage(root, { onBack, onSearch, onInvite, onUser, onAll } = {}) {
    root.innerHTML = `<section class="profile-find-friends">
      ${renderProfileSectionHeader(t("profile.social.findFriends"))}
      <div class="profile-find-friends__actions">
        <button type="button" class="profile-find-friends__action" data-find-search><span class="material-symbols-rounded" aria-hidden="true">search</span><span class="profile-find-friends__action-text"><strong>${t("profile.social.searchByName")}</strong></span><span class="material-symbols-rounded" aria-hidden="true">chevron_right</span></button>
        <button type="button" class="profile-find-friends__action" data-find-invite><span class="material-symbols-rounded" aria-hidden="true">person_add</span><span class="profile-find-friends__action-text"><strong>${t("profile.social.inviteFriend")}</strong></span><span class="material-symbols-rounded" aria-hidden="true">chevron_right</span></button>
      </div>
      <div class="profile-find-friends__heading-row"><h2 class="profile-find-friends__heading">${t("profile.social.suggestions")}</h2><button type="button" class="profile-find-friends__all" data-find-all>${t("profile.social.seeAll")}</button></div>
      <div class="profile-find-friends__suggestions" aria-live="polite"></div>
    </section>`;
    root.querySelector("[data-profile-back]")?.addEventListener("click", e => { e.stopPropagation(); onBack?.(); });
    root.querySelector("[data-find-search]")?.addEventListener("click", () => onSearch?.());
    root.querySelector("[data-find-invite]")?.addEventListener("click", () => onInvite?.());
    root.querySelector("[data-find-all]")?.addEventListener("click", () => onAll?.());
    createSuggestions(root, root.querySelector(".profile-find-friends__suggestions"), { onUser });
}

export function openFindFriendsAllPage(root, { onBack, onUser } = {}) {
    root.innerHTML = `<section class="profile-find-friends">
      ${renderProfileSectionHeader(t("profile.social.suggestions"))}
      <div class="profile-find-friends__suggestions" aria-live="polite"></div>
      <button type="button" class="profile-find-friends__more" data-find-more hidden>${t("profile.social.more")}</button>
    </section>`;
    root.querySelector("[data-profile-back]")?.addEventListener("click", e => { e.stopPropagation(); onBack?.(); });
    createSuggestions(root, root.querySelector(".profile-find-friends__suggestions"), { full: true, onUser });
}

export function openFindFriendsSearchPage(root, { onBack } = {}) {
    root.innerHTML = `<section class="profile-find-friends">
      ${renderProfileSectionHeader(t("profile.social.searchByName"))}
      <p class="profile-find-friends__empty">${t("profile.social.searchSoon")}</p>
    </section>`;
    root.querySelector("[data-profile-back]")?.addEventListener("click", e => { e.stopPropagation(); onBack?.(); });
}

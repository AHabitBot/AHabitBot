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
    const section = full ? null : root.querySelector("[data-find-suggestions-section]");
    const syncSection = () => {
        if (section) section.hidden = shown === 0;
    };
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
            if (!shown && full) container.innerHTML = empty();
            syncSection();
            if (more) more.hidden = finished;
        } catch (error) {
            console.error("Friend suggestions:", error);
            if (!shown && full && container.isConnected) container.innerHTML = `<p class="profile-find-friends__empty">${escape(t("profile.social.loadError"))}</p>`;
            syncSection();
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
        syncSection();
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
      <div data-find-suggestions-section hidden>
        <div class="profile-find-friends__heading-row"><h2 class="profile-find-friends__heading">${t("profile.social.suggestions")}</h2><button type="button" class="profile-find-friends__all" data-find-all>${t("profile.social.seeAll")}</button></div>
        <div class="profile-find-friends__suggestions" aria-live="polite"></div>
      </div>
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

export function openFindFriendsSearchPage(root, { onBack, onUser } = {}) {
    root.innerHTML = `<section class="profile-find-friends">
      ${renderProfileSectionHeader(t("profile.social.searchByName"))}
      <div class="profile-find-friends__search-field">
        <span class="material-symbols-rounded" aria-hidden="true">search</span>
        <input type="search" maxlength="64" autocomplete="off" spellcheck="false" aria-label="${escape(t("profile.social.searchPlaceholder"))}" placeholder="${escape(t("profile.social.searchPlaceholder"))}" data-user-query>
      </div>
      <div class="profile-find-friends__suggestions" data-user-results aria-live="polite"></div>
      <button type="button" class="profile-find-friends__more" data-search-more hidden>${escape(t("profile.social.more"))}</button>
    </section>`;
    root.querySelector("[data-profile-back]")?.addEventListener("click", e => { e.stopPropagation(); onBack?.(); });
    const input = root.querySelector("[data-user-query]");
    const container = root.querySelector("[data-user-results]");
    const more = root.querySelector("[data-search-more]");
    let timer;
    let generation = 0;
    let offset = 0;
    let busy = false;
    let hasMore = false;
    const message = key => { container.innerHTML = `<p class="profile-find-friends__empty">${escape(t(key))}</p>`; };
    const load = async (append = false) => {
        const query = input.value.trim();
        if (!query || !container.isConnected || (append && (busy || !hasMore))) return;
        const current = ++generation;
        const nextOffset = append ? offset : 0;
        busy = true;
        more.disabled = true;
        if (!append) message("profile.social.loading");
        try {
            const data = await apiRequest(`/api/follows/search?q=${encodeURIComponent(query)}&limit=30&offset=${nextOffset}`);
            if (current !== generation || !container.isConnected) return;
            const items = data.items || [];
            if (!append) container.replaceChildren();
            offset = nextOffset + items.length;
            hasMore = !!data.has_more;
            for (const item of items) {
                const avatar = getProfileAvatar(item.avatar_key) || getDefaultProfileAvatar();
                const card = document.createElement("div");
                card.className = "profile-find-friends__person";
                card.innerHTML = `<button type="button" class="profile-find-friends__identity"><img src="${escape(avatar.image)}" alt=""><span class="profile-find-friends__details"><strong>${escape(item.nickname || "Player")}</strong></span></button><button type="button" class="profile-find-friends__follow">${escape(t(item.is_following ? "profile.social.unfollow" : "profile.social.follow"))}</button>`;
                card.querySelector(".profile-find-friends__identity").addEventListener("click", () => onUser?.(item.id));
                const button = card.querySelector(".profile-find-friends__follow");
                let following = !!item.is_following;
                button.addEventListener("click", async () => {
                    button.disabled = true;
                    try {
                        await apiRequest(`/api/follows/users/${encodeURIComponent(item.id)}`, { method: following ? "DELETE" : "POST" });
                        following = !following;
                        if (button.isConnected) button.textContent = t(following ? "profile.social.unfollow" : "profile.social.follow");
                    } catch (error) {
                        console.error("Search follow:", error);
                    } finally { if (button.isConnected) button.disabled = false; }
                });
                container.append(card);
            }
            if (!container.children.length) message("profile.social.noSearchResults");
            more.hidden = !hasMore;
        } catch (error) {
            console.error("User search:", error);
            if (current === generation && container.isConnected) message("profile.social.loadError");
        } finally {
            if (current === generation) { busy = false; more.disabled = false; }
        }
    };
    input.addEventListener("input", () => {
        clearTimeout(timer);
        generation++;
        busy = false;
        offset = 0;
        hasMore = false;
        more.hidden = true;
        if (!input.value.trim()) { container.replaceChildren(); return; }
        timer = setTimeout(() => void load(), 300);
    });
    more.addEventListener("click", () => void load(true));
    input.focus();
}

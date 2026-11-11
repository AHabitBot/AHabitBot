import { apiRequest } from "../../api/apiClient.js";
import { t } from "../../../i18n/core/i18n.js";
import { renderProfileSectionHeader } from "../profileComponents.js";
import { getProfileAvatar, getDefaultProfileAvatar } from "../appearance/profileAppearanceAvatar.js";

const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

// userId=null means authenticated user. onBack restores the calling screen.
export function openSocialList(root, { userId = null, initialTab = "following", onBack, onUser, onFind } = {}) {
    let tab = initialTab === "followers" ? "followers" : "following";
    let offset = 0;
    let loading = false;
    let generation = 0;
    const pageSize = 30;
    const path = userId == null ? "/api/follows/me/list" : `/api/follows/users/${encodeURIComponent(userId)}/list`;
    const showShell = () => {
        root.innerHTML = `<section class="profile-social-page">
          ${renderProfileSectionHeader(t("profile.social.friends"))}
          <div class="profile-social-page__panel">
          <div class="profile-social-page__tabs" role="tablist">
            <button type="button" data-social-tab="following" role="tab" aria-selected="${tab === "following"}" class="${tab === "following" ? "is-active" : ""}">${t("profile.social.following")}</button>
            <button type="button" data-social-tab="followers" role="tab" aria-selected="${tab === "followers"}" class="${tab === "followers" ? "is-active" : ""}">${t("profile.social.followers")}</button>
          </div>
          <div class="profile-social-page__list" aria-live="polite"></div>
          </div>
          <button type="button" class="profile-social-page__more" data-social-more hidden>${t("profile.social.more")}</button>
          <button type="button" class="profile-social-page__find" data-social-find><span class="material-symbols-rounded" aria-hidden="true">person_add</span>${t("profile.social.find")}</button>
        </section>`;
        root.querySelector("[data-profile-back]")?.addEventListener("click", (e) => { e.stopPropagation(); onBack?.(); });
        root.querySelectorAll("[data-social-tab]").forEach(button => button.addEventListener("click", () => {
            if (button.dataset.socialTab === tab) return;
            tab = button.dataset.socialTab;
            offset = 0;
            generation++;
            showShell();
            void load();
        }));
        root.querySelector("[data-social-more]")?.addEventListener("click", () => void load());
        root.querySelector("[data-social-find]")?.addEventListener("click", () => {
            if (onFind) onFind();
            else root.dispatchEvent(new CustomEvent("profile-social-find-request", { bubbles: true }));
        });
    };
    const load = async () => {
        if (loading) return;
        loading = true;
        const current = generation;
        const list = root.querySelector(".profile-social-page__list");
        const more = root.querySelector("[data-social-more]");
        if (offset === 0) list.innerHTML = `<p class="profile-social-page__empty">${escape(t("profile.social.loading"))}</p>`;
        more.hidden = true;
        try {
            const data = await apiRequest(`${path}?kind=${tab}&limit=${pageSize}&offset=${offset}`);
            if (current !== generation || !list.isConnected) return;
            if (offset === 0) list.replaceChildren();
            for (const item of data.items || []) {
                const avatar = getProfileAvatar(item.avatar_key) || getDefaultProfileAvatar();
                const button = document.createElement("button");
                button.type = "button";
                button.className = "profile-social-page__user";
                button.innerHTML = `<span class="profile-social-page__avatar"><img src="${escape(avatar.image)}" alt=""></span><span class="profile-social-page__identity"><strong>${escape(item.nickname || "Player")}</strong><small>${escape(t("profile.social.level"))} ${Math.max(1, Number(item.level) || 1)}</small></span><span class="material-symbols-rounded" aria-hidden="true">chevron_right</span>`;
                button.addEventListener("click", () => onUser?.(item.id, () => openSocialList(root, { userId, initialTab: tab, onBack, onUser })));
                list.append(button);
            }
            offset += (data.items || []).length;
            if (offset === 0) list.innerHTML = `<p class="profile-social-page__empty">${escape(t("profile.social.empty"))}</p>`;
            more.hidden = !data.has_more;
        } catch (error) {
            console.error("Social list:", error);
            if (current === generation && list.isConnected) list.innerHTML = `<p class="profile-social-page__empty">${escape(t("profile.social.loadError"))}</p>`;
        } finally { loading = false; }
    };
    showShell();
    void load();
}

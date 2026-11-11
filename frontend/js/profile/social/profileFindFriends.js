import { t } from "../../../i18n/core/i18n.js";
import { renderProfileSectionHeader } from "../profileComponents.js";

// Screen-only stage: recommendations and search data are connected in later stages.
export function openFindFriendsPage(root, { onBack, onSearch, onInvite } = {}) {
    root.innerHTML = `<section class="profile-find-friends">
      ${renderProfileSectionHeader(t("profile.social.findFriends"))}
      <div class="profile-find-friends__actions">
        <button type="button" class="profile-find-friends__action" data-find-search><span class="material-symbols-rounded" aria-hidden="true">search</span><span class="profile-find-friends__action-text"><strong>${t("profile.social.searchByName")}</strong><small>${t("profile.social.searchDescription")}</small></span><span class="material-symbols-rounded" aria-hidden="true">chevron_right</span></button>
        <button type="button" class="profile-find-friends__action" data-find-invite><span class="material-symbols-rounded" aria-hidden="true">person_add</span><span class="profile-find-friends__action-text"><strong>${t("profile.social.inviteFriend")}</strong><small>${t("profile.social.inviteDescription")}</small></span><span class="material-symbols-rounded" aria-hidden="true">chevron_right</span></button>
      </div>
      <h2 class="profile-find-friends__heading">${t("profile.social.suggestions")}</h2>
      <p class="profile-find-friends__empty">${t("profile.social.suggestionsSoon")}</p>
    </section>`;
    root.querySelector("[data-profile-back]")?.addEventListener("click", e => { e.stopPropagation(); onBack?.(); });
    root.querySelector("[data-find-search]")?.addEventListener("click", () => onSearch?.());
    root.querySelector("[data-find-invite]")?.addEventListener("click", () => onInvite?.());
}

export function openFindFriendsSearchPage(root, { onBack } = {}) {
    root.innerHTML = `<section class="profile-find-friends">
      ${renderProfileSectionHeader(t("profile.social.searchByName"))}
      <p class="profile-find-friends__empty">${t("profile.social.searchSoon")}</p>
    </section>`;
    root.querySelector("[data-profile-back]")?.addEventListener("click", e => { e.stopPropagation(); onBack?.(); });
}

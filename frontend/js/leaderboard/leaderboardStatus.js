import { apiRequest } from "../api/apiClient.js";

const EMOJI = ["🔥","💪","😎","🚀","💩","🏆","⚡","👑","🧠","🥇","🦁","🦊"];
const LABELS = {
 ru: ["Мой статус", "ГОТОВО", "ОЧИСТИТЬ СТАТУС", "Не удалось сохранить статус"],
 uk: ["Мій статус", "ГОТОВО", "ОЧИСТИТИ СТАТУС", "Не вдалося зберегти статус"],
 en: ["My status", "DONE", "CLEAR STATUS", "Could not save status"],
 de: ["Mein Status", "FERTIG", "STATUS LÖSCHEN", "Status konnte nicht gespeichert werden"]
};
const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const language = () => (document.documentElement.lang || "en").split("-")[0];
const words = () => LABELS[language()] || LABELS.en;

export function renderStatusBubble(user, currentUserId) {
 const self = user.userId === currentUserId;
 if (!user.statusEmoji && !self) return "";
 return `<button type="button" class="lb-status-bubble${self ? ' lb-status-bubble--own' : ''}" data-lb-status-user="${user.userId}" ${self ? 'aria-label="Change status"' : 'disabled aria-label="User status"'}>${user.statusEmoji ? escape(user.statusEmoji) : '+'}</button>`;
}

export function bindLeaderboardStatuses(root, currentUser) {
 if (root.dataset.lbStatusBound) return;
 root.dataset.lbStatusBound = '1';
 root.addEventListener('click', event => {
   const button = event.target.closest('[data-lb-status-user]');
   if (!button || !root.contains(button) || !currentUser || currentUser.xp <= 0 || Number(button.dataset.lbStatusUser) !== currentUser.userId) return;
   event.stopPropagation();
   openPicker(root, currentUser);
 });
}

function openPicker(root, currentUser) {
 document.querySelector('.lb-status-overlay')?.remove();
 let selected = currentUser.statusEmoji || null;
 const [title, done, clear, failed] = words();
 const overlay = document.createElement('div');
 overlay.className = 'lb-status-overlay';
 overlay.innerHTML = `<section class="lb-status-sheet" role="dialog" aria-modal="true" aria-label="${title}"><div class="lb-status-heading"><strong>${title}</strong><button class="lb-status-close" aria-label="Close">×</button></div><div class="lb-status-preview">${escape(selected || '🙂')}</div><div class="lb-status-grid">${EMOJI.map(e => `<button type="button" class="lb-status-choice${e === selected ? ' is-selected' : ''}" data-emoji="${escape(e)}">${escape(e)}</button>`).join('')}</div><button class="lb-status-save">${done}</button><button class="lb-status-clear">${clear}</button></section>`;
 document.body.append(overlay);
 const close = () => overlay.remove();
 overlay.addEventListener('click', async event => {
   if (event.target === overlay || event.target.closest('.lb-status-close')) { close(); return; }
   const choice = event.target.closest('[data-emoji]');
   if (choice) { selected = choice.dataset.emoji; overlay.querySelector('.lb-status-preview').textContent = selected; overlay.querySelectorAll('.lb-status-choice').forEach(b => b.classList.toggle('is-selected', b === choice)); return; }
   const save = event.target.closest('.lb-status-save');
   const reset = event.target.closest('.lb-status-clear');
   if (!save && !reset) return;
   const emoji = reset ? null : selected;
   if (emoji === null && save) return;
   const buttons = overlay.querySelectorAll('button'); buttons.forEach(b => b.disabled = true);
   try {
     await apiRequest('/api/leaderboard/status', {method:'PUT',body:{emoji}});
     currentUser.statusEmoji = emoji;
     root.querySelectorAll(`[data-lb-status-user="${currentUser.userId}"]`).forEach(b => { b.textContent = emoji || '+'; });
     close();
   } catch (error) { alert(error?.message || failed); buttons.forEach(b => b.disabled = false); }
 });
}

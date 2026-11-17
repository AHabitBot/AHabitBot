import { t } from '../../i18n/core/i18n.js';
import { developmentDirectionName, developmentResearchName } from './developmentTranslations.js';
// Отдельный HTML-рендерер исследований. Не использует шаблон обычной привычки.
import { getResearch } from './developmentCatalog.js'

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))
}

export function renderDevelopmentCard(habit) {
  const d = habit.development
  if (!d) return ''
  const id = safe(habit.id)
  const target = Math.max(1, Number(d.target) || 7)
  const progress = Math.min(target, Math.max(0, Number(d.progress) || 0))
  const ready = Boolean(d.ready || progress >= target)
  const research = getResearch(d.key)
  const icon = safe(research?.icon || 'auto_awesome')
  const cycle = Number(d.cycle)
  const cycleLabel = ({1:"I",2:"II",3:"III"})[cycle]
  const title = safe(`${research ? developmentResearchName(research.key) : habit.name}${cycleLabel ? ` ${cycleLabel}` : ""}`)
  const directionName = safe(developmentDirectionName(d.direction || research?.direction || "body"))
  const dots = Array.from({length:target}, (_, i) =>
    `<span class="development-habit__dot ${i < progress ? 'is-done' : ''}"></span>`
  ).join('')
  return `<article class="habit-card habit-card--large development-habit" data-habit-id="${id}" data-development-card="1">
    <span class="development-habit__icon material-symbols-rounded" aria-hidden="true">${icon}</span>
    ${ready
      ? `<button class="development-habit__improve" type="button" data-development-improve-habit="${id}">${t("development.improve")}</button>`
      : `<button class="habit-card__check development-habit__check ${habit.completedToday ? 'is-completed' : ''}" type="button" data-development-confirm="${id}" aria-label="${safe(t("development.confirmResearch"))}" aria-pressed="${Boolean(habit.completedToday)}"><span class="habit-card__check-mark material-symbols-rounded">check</span></button>`}
    <div class="development-habit__body"><h2>${title}</h2><p>${safe(t("development.habitSubtitle", {direction:directionName}))}</p></div>
    <div class="development-habit__footer"><div class="development-habit__dots">${dots}</div><strong>${progress}/${target}</strong></div>
  </article>`
}

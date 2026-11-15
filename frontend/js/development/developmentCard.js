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
  const title = safe(research?.name || habit.name)
  const dots = Array.from({length:7}, (_, i) =>
    `<span class="development-habit__dot ${i < Math.min(progress,7) ? 'is-done' : ''}"></span>`
  ).join('')
  return `<article class="development-habit" data-habit-id="${id}" data-development-card="1">
    <span class="development-habit__icon material-symbols-rounded" aria-hidden="true">${icon}</span>
    ${ready
      ? `<button class="development-habit__improve" type="button" data-development-improve-habit="${id}">Улучшить</button>`
      : `<button class="development-habit__check ${habit.completedToday ? 'is-done' : ''}" type="button" data-development-confirm="${id}" aria-label="Подтвердить исследование" aria-pressed="${Boolean(habit.completedToday)}"><span class="material-symbols-rounded">check</span></button>`}
    <div class="development-habit__body"><h2>${title}</h2><p>Развитие · ${Number(d.cycle)} уровень</p></div>
    <div class="development-habit__footer"><div class="development-habit__dots">${dots}</div><strong>${progress}/${target}</strong></div>
  </article>`
}

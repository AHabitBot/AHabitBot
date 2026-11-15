// Исследования используют кнопку и анимации обычных привычек,
// но сохраняют собственный endpoint и собственный прогресс.
import { apiRequest } from '../api/apiClient.js'

const pending = new Set()
const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms))
const REWARD_MS = 650

function animateResearchResult(card, action, response, desired) {
    const oldCount = Number(card.querySelector('.development-habit__footer strong')?.textContent?.split('/')[0] || 0)
    const target = Math.max(1, Number(response?.target) || Number(card.querySelectorAll('.development-habit__dot').length) || 7)
    const progress = Math.min(target, Math.max(0, Number(response?.progress ?? oldCount)))
    const dots = card.querySelectorAll('.development-habit__dot')
    dots.forEach((dot, index) => {
        const wasDone = dot.classList.contains('is-done')
        const nowDone = index < progress
        dot.classList.toggle('is-done', nowDone)
        dot.classList.remove('is-rewarded', 'is-unrewarded')
        if (wasDone !== nowDone) {
            void dot.offsetWidth
            dot.classList.add(nowDone ? 'is-rewarded' : 'is-unrewarded')
            window.setTimeout(() => dot.classList.remove('is-rewarded', 'is-unrewarded'), REWARD_MS)
        }
    })
    const count = card.querySelector('.development-habit__footer strong')
    if (count) {
        count.textContent = `${progress}/${target}`
        if (progress !== oldCount) {
            count.classList.remove('is-updated')
            void count.offsetWidth
            count.classList.add('is-updated')
            window.setTimeout(() => count.classList.remove('is-updated'), REWARD_MS)
        }
    }
    action.classList.toggle('is-completed', desired)
    action.setAttribute('aria-pressed', String(desired))
    action.setAttribute('aria-label', desired ? 'Отменить подтверждение исследования' : 'Подтвердить исследование')
    const confirmation = response?.confirmation || {}
    const changed = Boolean(confirmation.confirmation_state_changed)
    const habit = confirmation.habit || {}
    const amount = desired ? (habit.xp_awarded_today ? Number(habit.xp_amount_today) : 0)
        : Number(habit.xp_removed_today || 0)
    if (changed && amount > 0) {
        const reward = document.createElement('span')
        reward.className = `habit-card__xp-reward${desired ? '' : ' is-removed'}`
        reward.textContent = `${desired ? '+' : '-'}${amount} XP`
        reward.setAttribute('aria-hidden', 'true')
        card.querySelector('.habit-card__xp-reward')?.remove()
        card.appendChild(reward)
        window.setTimeout(() => reward.remove(), REWARD_MS)
    }
}

export function initDevelopmentCardEvents(card, { getCompletedToday = () => false } = {}) {
    const id = card?.dataset?.habitId
    if (!id || card.dataset.developmentCard !== '1') return
    if (card.dataset.developmentEventsBound !== '1') {
        card.addEventListener('click', event => {
            if (!event.target.closest('button')) event.stopPropagation()
        })
        card.dataset.developmentEventsBound = '1'
    }
    const action = card.querySelector('[data-development-confirm], [data-development-improve-habit]')
    if (!action) return
    action.addEventListener('click', async event => {
        event.preventDefault()
        event.stopPropagation()
        if (action.disabled || pending.has(id)) return
        pending.add(id)
        action.disabled = true
        const isImprove = Boolean(action.dataset.developmentImproveHabit)
        const currentlyDone = action.classList.contains('is-completed') || Boolean(getCompletedToday(id))
        const desired = !currentlyDone
        if (!isImprove) {
            action.classList.add('is-confirming')
            action.classList.toggle('is-unconfirming', !desired)
            action.setAttribute('aria-busy', 'true')
        }
        try {
            if (isImprove) {
                await apiRequest(`/api/development/${encodeURIComponent(id)}/improve`, { method: 'POST' })
                action.textContent = 'Улучшено'
                card.dataset.developmentCompleted = '1'
            } else {
                const response = await apiRequest(`/api/development/${encodeURIComponent(id)}/confirmation`, {
                    method: 'PUT', body: { is_confirmed: desired }
                })
                // Сохраняем загрузку до завершения серверной операции и обновления списка.
                const refresh = new CustomEvent('ahabit:habits-refresh', { detail: { waitFor: [], silent: true } })
                window.dispatchEvent(refresh)
                await Promise.all(refresh.detail.waitFor)
                action.classList.remove('is-confirming', 'is-unconfirming')
                action.removeAttribute('aria-busy')
                // Карточка остаётся в DOM: анимируем её без пересоздания списка.
                animateResearchResult(card, action, response, desired)
                if (Boolean(response?.ready || (Number(response?.progress) >= Number(response?.target) && Number(response?.target) > 0))) {
                    const improve = document.createElement('button')
                    improve.type = 'button'
                    improve.className = 'development-habit__improve'
                    improve.dataset.developmentImproveHabit = id
                    improve.textContent = 'Улучшить'
                    action.replaceWith(improve)
                    // Новый обработчик для кнопки «Улучшить» привязывается к этой карточке.
                    initDevelopmentCardEvents(card)
                }
                if (!desired && response?.confirmation?.confirmation_state_changed) {
                    action.classList.add('is-unconfirm-success')
                    window.setTimeout(() => action.classList.remove('is-unconfirm-success'), 320)
                }
            }
            if (isImprove) window.dispatchEvent(new Event('ahabit:habits-refresh'))
        } catch (error) {
            action.classList.remove('is-confirming', 'is-unconfirming')
            action.removeAttribute('aria-busy')
            alert(error?.message || 'Не удалось обновить исследование')
        } finally {
            action.disabled = false
            pending.delete(id)
        }
    })
}

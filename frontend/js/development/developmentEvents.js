// Исследования: независимая обработка событий, без логики обычных привычек.
import { apiRequest } from '../api/apiClient.js'

const pending = new Set()

export function initDevelopmentCardEvents(card, { getCompletedToday = () => false } = {}) {
    const id = card?.dataset?.habitId
    if (!id || card.dataset.developmentCard !== '1') return

    // Клики по свободной области исследования не открывают обычные детали привычки.
    card.addEventListener('click', event => {
        if (!event.target.closest('button')) event.stopPropagation()
    })

    const action = card.querySelector('[data-development-confirm], [data-development-improve-habit]')
    if (!action) return
    action.addEventListener('click', async event => {
        event.preventDefault()
        event.stopPropagation()
        if (action.disabled || pending.has(id)) return
        pending.add(id)
        action.disabled = true
        try {
            if (action.dataset.developmentImproveHabit) {
                await apiRequest(`/api/development/${encodeURIComponent(id)}/improve`, { method: 'POST' })
                // The server archived the research; prevent another claim while the list refreshes.
                action.textContent = 'Улучшено'
                card.dataset.developmentCompleted = '1'
            } else {
                await apiRequest(`/api/development/${encodeURIComponent(id)}/confirmation`, {
                    method: 'PUT', body: { is_confirmed: !getCompletedToday(id) }
                })
            }
            window.dispatchEvent(new Event('ahabit:habits-refresh'))
        } catch (error) {
            alert(error?.message || 'Не удалось обновить исследование')
            action.disabled = false
        } finally {
            pending.delete(id)
        }
    })
}

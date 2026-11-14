import { getResearch, RESEARCH_DAYS, RESEARCH_CATALOG } from './developmentCatalog.js';
import { icon } from './development.js';
import { directionHtml } from './developmentDirection.js';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function upgradeHtml(key){
 const item=getResearch(key);if(!item)return directionHtml('body');
 const direction=RESEARCH_CATALOG[item.direction];
 const requirements=item.requires.length?item.requires.map(r=>`${RESEARCH_CATALOG[item.direction].items.find(i=>i.key===r.key)?.name||r.key} ${['','I','II','III'][r.level]}`).join(' + '):'Доступно сразу';
 return `<div class="development-screen development-screen--${direction.color}"><header class="development-heading development-heading--upgrade"><button class="development-back" data-development-back="${direction.key}" aria-label="Назад">${icon('arrow_back')}</button><div class="development-heading__title"><h1>${escapeHtml(item.name)}</h1><span class="development-subtitle">Уровень 0 / 3</span></div></header>
 <section class="development-detail"><div class="development-line"><strong>Исследование</strong><span>Не начато</span></div><div class="development-detail__row">${icon('calendar_month')}<span>Прогресс</span><strong>0 / 7 дней</strong></div><div class="development-progress"><span style="width:0%"></span></div><div class="development-detail__row">${icon('lock')}<span>Открытие</span><strong>${escapeHtml(requirements)}</strong></div></section>
 <section class="development-detail development-detail--tasks"><div class="development-detail__row">${icon('assignment')}<strong>Задания по уровням</strong></div>${item.tasks.map((task,index)=>`<div class="development-task"><span class="development-task__level">${['I','II','III'][index]} · ${RESEARCH_DAYS[index]} дн.</span><span>${escapeHtml(task)}</span></div>`).join('')}</section>
 <section class="development-detail development-detail--reward"><div class="development-detail__row">${icon('star')}<span>Награда</span></div><div class="development-reward__content"><strong>${escapeHtml(item.name)} +1</strong><p>XP +0.10 к разделу ${escapeHtml(direction.name)}</p></div></section><p class="development-preview-note">Запуск исследования станет доступен после подключения backend.</p></div>`;
}

import { getResearch, RESEARCH_DAYS, RESEARCH_CATALOG } from './developmentCatalog.js';
import { icon, researchRecord, researchState } from './development.js?v=20261115-dev-state-sync5';
import { directionHtml } from './developmentDirection.js?v=20261115-dev-state-sync5';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function upgradeHtml(key, cycle=1){
 cycle=Math.max(1,Math.min(3,Number(cycle)||1));
 const item=getResearch(key);if(!item)return directionHtml('body');
 const direction=RESEARCH_CATALOG[item.direction];
 const roman=['','I','II','III'][cycle];
 const days=RESEARCH_DAYS[cycle-1];
 const record=researchRecord(key,cycle);
 const done=new Set(researchState().research.filter(r=>r.completed).map(r=>`${r.key}:${r.cycle}`));
 const allowed=(cycle===1||done.has(`${key}:${cycle-1}`))&&item.requires.every(r=>done.has(`${r.key}:${cycle}`));
 const progress=record?.progress||0;
 const status=record?.completed?'Завершено':record?.ready?'Готово к улучшению':record?'Исследуется':allowed?'Доступно':'Заблокировано';
 const nextCycle=cycle<3&&record?.completed;
 const action=record?.completed?(nextCycle?`<button type="button" class="development-action" data-development-next-cycle="${cycle+1}" data-development-next-key="${escapeHtml(key)}">${escapeHtml(item.name)} ${['','I','II','III'][cycle+1]} доступно</button>`:''):record?.ready?`<button type="button" class="development-action" data-development-improve="${record.habit_id}" data-development-key="${key}" data-development-cycle="${cycle}">Улучшить</button>`:(record&&!record.completed?`<button type="button" class="development-action" data-development-go-habits="${record.habit_id}">К привычке</button>`:(!record&&allowed?`<button type="button" class="development-action" data-development-start="${key}" data-direction="${item.direction}" data-development-cycle="${cycle}" data-development-key="${key}">Начать исследование</button>`:''));
 const requirements=cycle>1
  ? `${item.name} ${['','I','II'][cycle-1]}`
  : (item.requires.length?item.requires.map(r=>`${direction.items.find(i=>i.key===r.key)?.name||r.key} ${['','I','II','III'][r.level]}`).join(' + '):'Доступно сразу');
 return `<div class="development-screen development-screen--${direction.color}"><header class="development-heading development-heading--upgrade"><button class="development-back" data-development-back="${direction.key}" aria-label="Назад">${icon('arrow_back')}</button><div class="development-heading__title"><h1>${escapeHtml(item.name)} ${roman}</h1><span class="development-subtitle">${escapeHtml(direction.name)} · Цикл ${roman}</span></div></header>
 <section class="development-detail"><div class="development-line"><strong>Исследование</strong><span>${status}</span></div><div class="development-detail__row">${icon('calendar_month')}<span>Прогресс</span><strong>${progress} / ${days} дней</strong></div><div class="development-progress"><span style="width:${progress/days*100}%"></span></div><div class="development-detail__row">${icon('lock')}<span>Открытие</span><strong>${escapeHtml(requirements)}</strong></div></section>
 <section class="development-detail development-detail--tasks"><div class="development-detail__row">${icon('assignment')}<strong>Задание</strong></div><div class="development-task"><span>${escapeHtml(item.tasks[cycle-1])}</span></div></section>
 <section class="development-detail development-detail--reward"><div class="development-detail__row">${icon('star')}<span>Награда</span></div><div class="development-reward__content"><strong>${escapeHtml(item.name)} +1</strong><p>XP +0.10 к разделу ${escapeHtml(direction.name)}</p></div></section>${action?`<div class="development-action-wrap">${action}</div>`:""}</div>`;
}

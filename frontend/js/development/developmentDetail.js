import { developmentDirectionName, developmentResearchName, developmentTaskText } from './developmentTranslations.js';
import { t } from '../../i18n/core/i18n.js';
import { getResearch, RESEARCH_DAYS, RESEARCH_CATALOG } from './developmentCatalog.js';
import { icon, researchRecord, researchState } from './development.js?v=20261115-dev-cancel7';
import { directionHtml } from './developmentDirection.js?v=20261115-dev-cancel7';
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
 const status=record?.completed?t('development.completed'):record?.ready?t('development.ready'):record?t('development.inProgress'):allowed?t('development.available'):t('development.locked');
 const nextCycle=cycle<3&&record?.completed;
 const action=record?.completed?(nextCycle?`<button type="button" class="development-action" data-development-next-cycle="${cycle+1}" data-development-next-key="${escapeHtml(key)}">${escapeHtml(developmentResearchName(item.key))} ${['','I','II','III'][cycle+1]} ${t("development.available")}</button>`:''):record?.ready?`<button type="button" class="development-action" data-development-improve="${record.habit_id}" data-development-key="${key}" data-development-cycle="${cycle}">${t("development.improve")}</button>`:(record&&!record.completed?`<button type="button" class="development-action" data-development-go-habits="${record.habit_id}">${t("development.goHabit")}</button>`:(!record&&allowed?`<button type="button" class="development-action" data-development-start="${key}" data-direction="${item.direction}" data-development-cycle="${cycle}" data-development-key="${key}">${t("development.start")}</button>`:''));
 const cancelAction=record&&!record.completed&&!record.ready?`<button type="button" class="development-action development-action--cancel" data-development-cancel="${record.habit_id}">${t("development.cancel")}</button>`:'';
 const requirements=cycle>1
  ? `${developmentResearchName(item.key)} ${['','I','II'][cycle-1]}`
  : (item.requires.length?item.requires.map(r=>`${developmentResearchName(r.key)} ${roman}`).join(' + '):t('development.availableNow'));
 return `<div class="development-screen development-screen--${direction.color}"><header class="development-heading development-heading--upgrade"><button class="development-back" data-development-back="${direction.key}" aria-label="${t("development.back")}">${icon('arrow_back')}</button><div class="development-heading__title"><h1>${escapeHtml(developmentResearchName(item.key))} ${roman}</h1><span class="development-subtitle">${escapeHtml(developmentDirectionName(direction.key))} · ${t("development.cycle")} ${roman}</span></div></header>
 <section class="development-detail"><div class="development-line"><strong>${t("development.research")}</strong><span>${status}</span></div><div class="development-detail__row">${icon('calendar_month')}<span>${t("development.progress")}</span><strong>${progress} / ${days} ${t("development.days")}</strong></div><div class="development-progress"><span style="width:${progress/days*100}%"></span></div><div class="development-detail__row">${icon('lock')}<span>${t("development.unlock")}</span><strong>${escapeHtml(requirements)}</strong></div></section>
 <section class="development-detail development-detail--tasks"><div class="development-detail__row">${icon('assignment')}<strong>${t("development.task")}</strong></div><div class="development-task"><span>${escapeHtml(developmentTaskText(item.key,cycle))}</span></div></section>
 <section class="development-detail development-detail--reward"><div class="development-detail__row">${icon('star')}<span>${t("development.reward")}</span></div><div class="development-reward__content"><strong>${escapeHtml(developmentResearchName(item.key))} +1</strong><p>${t("development.bonusEarned")}</p></div></section>${action?`<div class="development-action-wrap">${action}${cancelAction}</div>`:""}</div>`;
}

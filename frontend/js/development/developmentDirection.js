import { RESEARCH_CATALOG } from './developmentCatalog.js';
import { icon, rootHtml } from './development.js';
export function directionHtml(key){
 const d=RESEARCH_CATALOG[key];if(!d)return rootHtml();
 const nodes=`<div class="development-tree development-tree--catalog">${d.items.map((item,index)=>`<button type="button" class="development-node ${index?'development-node--locked':''}" data-development-upgrade="${item.key}">${icon(item.icon)}<strong>${item.name}</strong><small>${index?'🔒 ':''}0 / 3</small></button>`).join('')}</div>`;
 return `<div class="development-screen development-screen--${d.color}"><header class="development-heading development-heading--direction"><button class="development-back" data-development-back="root" aria-label="Назад">${icon('arrow_back')}</button><h1>${d.name}</h1></header><div class="development-overall"><div class="development-overall__main"><div class="development-line"><span>Прогресс направления</span><strong>0 / 12</strong></div><div class="development-progress"><span style="width:0%"></span></div></div></div>${nodes}<p class="development-preview-note">Нажми на улучшение, чтобы посмотреть задания и условия открытия. Замочки показывают состояние при нулевом прогрессе.</p></div>`;
}

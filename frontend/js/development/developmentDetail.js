import { icon } from "./development.js";
import { directionHtml } from "./developmentDirection.js";

export function upgradeHtml(key){
    const item={endurance:['Выносливость','directions_run'],strength:['Сила','fitness_center'],health:['Здоровье','favorite']}[key];
    if(!item)return directionHtml('body');
    return `<div class="development-screen development-screen--body"><header class="development-heading development-heading--upgrade"><button class="development-back" data-development-back="body" aria-label="Назад">${icon('arrow_back')}</button><div class="development-heading__title"><h1>${item[0]}</h1><span class="development-subtitle">Уровень 0 / 3</span></div></header><section class="development-detail"><div class="development-line"><strong>Исследование</strong><span>Не начато</span></div><div class="development-detail__row">${icon('calendar_month')}<span>Прогресс</span><strong>0 / 7 дней</strong></div><div class="development-progress"><span style="width:0%"></span></div><div class="development-detail__row">${icon('ac_unit')}<span>Статус</span><strong>Недоступно</strong></div></section><section class="development-detail development-detail--reward"><div class="development-detail__row">${icon('star')}<span>Награда</span></div><div class="development-reward__content"><strong>${item[0]} +1</strong><p>XP +0.10 к разделу Тело</p></div></section><p class="development-preview-note">Запуск исследования станет доступен после подключения backend.</p></div>`;
}

// Временный интерфейс развития. Реальные исследования подключаются отдельно.
export const DIRECTIONS = [
    {key:'body', name:'Тело', icon:'fitness_center', color:'body', items:[['Выносливость','directions_run'],['Сила','fitness_center'],['Здоровье','favorite']]},
    {key:'mind', name:'Разум', icon:'psychology', color:'mind', items:[]},
    {key:'will', name:'Воля', icon:'local_fire_department', color:'will', items:[]},
    {key:'psyche', name:'Психика', icon:'favorite', color:'psyche', items:[]}
];
export const icon = (name) => `<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
export const rootHtml = () => `<div class="development-screen">
    <header class="development-heading"><h1>Развитие</h1></header>
    <p class="development-intro">Прокачивай ключевые сферы жизни через реальные привычки</p>
    <div class="development-overall"><div class="development-overall__icon">${icon('hexagon')}</div><div class="development-overall__main"><div class="development-line"><strong>Общий прогресс</strong><strong>0 / 48</strong></div><div class="development-progress"><span style="width:0%"></span></div></div></div>
    <div class="development-directions">${DIRECTIONS.map(d=>`<button type="button" class="development-direction development-direction--${d.color}" data-development-direction="${d.key}"><span class="development-direction__icon">${icon(d.icon)}</span><span class="development-direction__arrow">${icon('chevron_right')}</span><strong>${d.name}</strong><span class="development-direction__count">0 / 12</span><span class="development-progress"><span style="width:0%"></span></span></button>`).join('')}</div>
    <div class="development-section-title">${icon('science')}<h2>Исследования</h2><span>0 / 1 (Free)</span></div>
    <div class="development-empty">Нет активных исследований</div>
    <p class="development-preview-note">Предварительный интерфейс. Прогресс и исследования будут подключены после реализации серверной логики.</p>
</div>`;
import { directionHtml } from "./developmentDirection.js";
import { upgradeHtml } from "./developmentDetail.js";

export function renderDevelopment(root){
    if(!root)return;
    root.innerHTML=rootHtml();
    // Назначаем обработчик только один раз; повторные открытия не добавляют слушатели.
    if(root.dataset.developmentBound)return;
    root.dataset.developmentBound='1';
    root.addEventListener('click',event=>{
        const button=event.target.closest('[data-development-direction], [data-development-back], [data-development-upgrade]');
        if(!button || !root.contains(button))return;
        if(button.dataset.developmentDirection)root.innerHTML=directionHtml(button.dataset.developmentDirection);
        else if(button.dataset.developmentBack)root.innerHTML=button.dataset.developmentBack==='root'?rootHtml():directionHtml(button.dataset.developmentBack);
        else if(button.dataset.developmentUpgrade)root.innerHTML=upgradeHtml(button.dataset.developmentUpgrade);
    });
}

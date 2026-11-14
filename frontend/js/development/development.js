// Временный интерфейс развития. Реальные исследования подключаются отдельно.
const DIRECTIONS = [
    {key:'body', name:'Тело', icon:'fitness_center', color:'body', items:[['Выносливость','directions_run'],['Сила','fitness_center'],['Здоровье','favorite']]},
    {key:'mind', name:'Разум', icon:'psychology', color:'mind', items:[]},
    {key:'will', name:'Воля', icon:'local_fire_department', color:'will', items:[]},
    {key:'psyche', name:'Психика', icon:'favorite', color:'psyche', items:[]}
];
const icon = (name) => `<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
const rootHtml = () => `<div class="development-screen">
    <header class="development-heading"><h1>Развитие</h1></header>
    <p class="development-intro">Прокачивай ключевые сферы жизни через реальные привычки</p>
    <div class="development-overall"><div class="development-overall__icon">${icon('hexagon')}</div><div class="development-overall__main"><div class="development-line"><strong>Общий прогресс</strong><strong>0 / 48</strong></div><div class="development-progress"><span style="width:0%"></span></div></div></div>
    <div class="development-directions">${DIRECTIONS.map(d=>`<button type="button" class="development-direction development-direction--${d.color}" data-development-direction="${d.key}"><span class="development-direction__icon">${icon(d.icon)}</span><span class="development-direction__arrow">${icon('chevron_right')}</span><strong>${d.name}</strong><span class="development-direction__count">0 / 12</span><span class="development-progress"><span style="width:0%"></span></span></button>`).join('')}</div>
    <div class="development-section-title">${icon('science')}<h2>Исследования</h2><span>0 / 1 (Free)</span></div>
    <div class="development-empty">Нет активных исследований</div>
    <p class="development-preview-note">Предварительный интерфейс. Прогресс и исследования будут подключены после реализации серверной логики.</p>
</div>`;
function directionHtml(key){
    const d=DIRECTIONS.find(x=>x.key===key);
    if(!d)return rootHtml();
    const nodes=d.key==='body'?`<div class="development-tree"><button class="development-node" data-development-upgrade="endurance">${icon('directions_run')}<strong>Выносливость</strong><small>0 / 3</small></button><div class="development-tree__branches"><button class="development-node development-node--locked" data-development-upgrade="strength">${icon('fitness_center')}<strong>Сила</strong><small>0 / 3</small></button><button class="development-node development-node--locked" data-development-upgrade="health">${icon('favorite')}<strong>Здоровье</strong><small>0 / 3</small></button></div><div class="development-node development-node--locked development-node--final">${icon('lock')}<strong>Скоро</strong></div></div>`:`<div class="development-empty">Дерево направления будет добавлено после согласования улучшений</div>`;
    return `<div class="development-screen development-screen--${d.color}"><header class="development-heading development-heading--direction"><button class="development-back" data-development-back="root" aria-label="Назад">${icon('arrow_back')}</button><h1>${d.name}</h1></header><div class="development-overall"><div class="development-overall__main"><div class="development-line"><span>Прогресс направления</span><strong>0 / 12</strong></div><div class="development-progress"><span style="width:0%"></span></div></div></div>${nodes}<p class="development-preview-note">Схема предварительная. У каждого направления будет собственное расширяемое дерево.</p></div>`;
}
function upgradeHtml(key){
    const item={endurance:['Выносливость','directions_run'],strength:['Сила','fitness_center'],health:['Здоровье','favorite']}[key];
    if(!item)return directionHtml('body');
    return `<div class="development-screen development-screen--body"><header class="development-heading development-heading--upgrade"><button class="development-back" data-development-back="body" aria-label="Назад">${icon('arrow_back')}</button><div class="development-heading__title"><h1>${item[0]}</h1><span class="development-subtitle">Уровень 0 / 3</span></div></header><p class="development-intro">Развивай ${item[0].toLowerCase()} через реальные привычки.</p><section class="development-detail"><div class="development-line"><strong>Исследование</strong><span>Не начато</span></div><div class="development-detail__row">${icon('calendar_month')}<span>Прогресс</span><strong>0 / 7 дней</strong></div><div class="development-progress"><span style="width:0%"></span></div><div class="development-detail__row">${icon('ac_unit')}<span>Статус</span><strong>Недоступно</strong></div></section><section class="development-detail development-detail--reward"><div class="development-detail__row">${icon('star')}<span>Награда</span></div><div class="development-reward__content"><strong>${item[0]} +1</strong><p>XP +0.10 к разделу Тело</p></div></section><p class="development-preview-note">Запуск исследования станет доступен после подключения backend.</p></div>`;
}
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

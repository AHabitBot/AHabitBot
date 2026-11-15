import { DIRECTIONS } from './developmentCatalog.js';
import { directionHtml } from './developmentDirection.js';
import { upgradeHtml } from './developmentDetail.js';
export const icon = name => `<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
export const rootHtml = () => `<div class="development-screen">
<header class="development-heading"><h1>Развитие</h1></header>
<p class="development-intro">Прокачивай ключевые сферы жизни через реальные привычки</p>
<div class="development-overall"><div class="development-overall__icon">${icon('hexagon')}</div><div class="development-overall__main"><div class="development-line"><strong>Общий прогресс</strong><strong>0 / 48</strong></div><div class="development-progress"><span style="width:0%"></span></div></div></div>
<div class="development-directions">${DIRECTIONS.map(d=>`<button type="button" class="development-direction development-direction--${d.color}" data-development-direction="${d.key}"><span class="development-direction__icon">${icon(d.icon)}</span><span class="development-direction__arrow">${icon('chevron_right')}</span><strong>${d.name}</strong><span class="development-direction__count">0 / 12</span><span class="development-progress"><span style="width:0%"></span></span></button>`).join('')}</div>
<div class="development-section-title">${icon('science')}<h2>Исследования</h2><span>0 / 1 (Free)</span></div>
<div class="development-empty">Нет активных исследований</div>
<p class="development-preview-note">Каталог исследований доступен для просмотра. Запуск и прогресс будут подключены после реализации серверной логики.</p></div>`;
// Keep the actual direction DOM when opening a research detail. This avoids
// rebuilding the tree and preserves the exact scroll position on return.
export function renderDevelopment(root,{reset=false}={}){
 if(!root)return;
 if(root.dataset.developmentBound){
  if(reset && typeof root.resetDevelopmentPage==='function')root.resetDevelopmentPage();
  return;
 }
 root.dataset.developmentBound='1';
 const history=[];
 root.resetDevelopmentPage=()=>{
  history.length=0;
  root.innerHTML=rootHtml();
  root.dataset.developmentPage='root';
  root.scrollTop=0;
 };
 const showPage=(html, pageType)=>{
  const current=root.firstElementChild;
  if(current)history.push({node:current,scrollTop:root.scrollTop});
  root.innerHTML=html;
  root.dataset.developmentPage=pageType;
  root.scrollTop=0;
 };
 const goBack=()=>{
  const previous=history.pop();
  if(!previous)return;
  root.replaceChildren(previous.node);
  root.dataset.developmentPage=previous.node.dataset.pageType||'root';
  // The scroll container stays mounted; restoring the original node preserves
  // the tree, its layout and the user's location without a second render.
  root.scrollTop=previous.scrollTop;
  requestAnimationFrame(()=>{root.scrollTop=previous.scrollTop;});
 };
 root.innerHTML=rootHtml();
 root.dataset.developmentPage='root';
 root.addEventListener('click',event=>{
  const button=event.target.closest('[data-development-direction], [data-development-back], [data-development-upgrade]');
  if(!button||!root.contains(button))return;
  if(button.hasAttribute('data-development-back')){goBack();return;}
  if(button.dataset.developmentDirection){
   if(root.firstElementChild)root.firstElementChild.dataset.pageType='root';
   showPage(directionHtml(button.dataset.developmentDirection),'direction');
  }else if(button.dataset.developmentUpgrade){
   const cycle=Number(button.dataset.developmentCycle)||1;
   if(root.firstElementChild)root.firstElementChild.dataset.pageType='direction';
   showPage(upgradeHtml(button.dataset.developmentUpgrade,cycle),'detail');
  }
 });
}

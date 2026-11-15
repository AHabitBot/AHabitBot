import { apiRequest } from '../api/apiClient.js';
import { DIRECTIONS } from './developmentCatalog.js';
import { directionHtml } from './developmentDirection.js';
import { upgradeHtml } from './developmentDetail.js';
export const icon = name => `<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
let developmentState = {research:[]};
export const researchState = () => developmentState;
export const researchRecord = (key,cycle) => developmentState.research.find(r=>r.key===key&&r.cycle===cycle);
export const rootHtml = () => `<div class="development-screen">
<header class="development-heading"><h1>Развитие</h1></header>
<p class="development-intro">Прокачивай ключевые сферы жизни через реальные привычки</p>
<div class="development-overall"><div class="development-overall__icon">${icon('hexagon')}</div><div class="development-overall__main"><div class="development-line"><strong>Общий прогресс</strong><strong>${developmentState.research.filter(r=>r.completed).length} / 144</strong></div><div class="development-progress"><span style="width:0%"></span></div></div></div>
<div class="development-directions">${DIRECTIONS.map(d=>`<button type="button" class="development-direction development-direction--${d.color}" data-development-direction="${d.key}"><span class="development-direction__icon">${icon(d.icon)}</span><span class="development-direction__arrow">${icon('chevron_right')}</span><strong>${d.name}</strong><span class="development-direction__count">${developmentState.research.filter(r=>r.direction===d.key&&r.completed).length} / 36</span><span class="development-progress"><span style="width:0%"></span></span></button>`).join('')}</div>
<div class="development-section-title">${icon('science')}<h2>Исследования</h2><span>${developmentState.research.filter(r=>!r.completed).length} активных</span></div>
<div class="development-empty">Нет активных исследований</div>
<p class="development-preview-note">Выбери направление и начни исследование.</p></div>`;
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
 let refreshSequence=0;
 const refreshState=async()=>{
  const sequence=++refreshSequence;
  const next=await apiRequest('/api/development');
  if(sequence!==refreshSequence)return false;
  developmentState=next;
  return true;
 };
 const refreshVisible=()=>{
  const page=root.dataset.developmentPage;
  if(page==='root')root.innerHTML=rootHtml();
  else if(page==='direction' && root.dataset.developmentDirectionKey)
   root.innerHTML=directionHtml(root.dataset.developmentDirectionKey);
  else if(page==='detail' && root.dataset.developmentResearchKey)
   root.innerHTML=upgradeHtml(root.dataset.developmentResearchKey,Number(root.dataset.developmentCycle)||1);
 };
 root.resetDevelopmentPage=()=>{
  history.length=0;
  root.innerHTML=rootHtml();
  root.dataset.developmentPage='root';
  root.scrollTop=0;
  refresh().catch(error=>console.error('Развитие:',error));
 };
 const showPage=(html, pageType)=>{
  const current=root.firstElementChild;
  if(current)history.push({page:root.dataset.developmentPage||'root',direction:root.dataset.developmentDirectionKey||'',key:root.dataset.developmentResearchKey||'',cycle:root.dataset.developmentCycle||'',scrollTop:root.scrollTop});
  root.innerHTML=html;
  root.dataset.developmentPage=pageType;
  root.scrollTop=0;
 };
 const goBack=()=>{
  const previous=history.pop();
  if(!previous)return;
  // Rebuild from fresh server state instead of restoring stale saved markup.
  root.dataset.developmentPage=previous.page;
  root.dataset.developmentDirectionKey=previous.direction||'';
  root.dataset.developmentResearchKey=previous.key||'';
  root.dataset.developmentCycle=previous.cycle||'';
  refreshVisible();
  // The scroll container stays mounted; restoring the original node preserves
  // the tree, its layout and the user's location without a second render.
  root.scrollTop=previous.scrollTop;
  requestAnimationFrame(()=>{root.scrollTop=previous.scrollTop;});
 };
 root.innerHTML=rootHtml();
 root.dataset.developmentPage='root';
 const refresh = async () => { try {if(await refreshState())refreshVisible();}catch(error){console.error('Развитие:',error);} };
 refresh();
 window.addEventListener('ahabit:habits-refresh', refresh);
 root.addEventListener('click',async event=>{
  const button=event.target.closest('[data-development-direction], [data-development-back], [data-development-upgrade], [data-development-start], [data-development-improve]');
  if(!button||!root.contains(button))return;
  if(button.hasAttribute('data-development-back')){goBack();return;}
  if(button.dataset.developmentStart || button.dataset.developmentImprove){
   button.disabled=true;
   try{
    if(button.dataset.developmentStart){await apiRequest('/api/development/start',{method:'POST',body:{direction:button.dataset.direction,key:button.dataset.developmentStart,cycle:Number(button.dataset.developmentCycle)}});}
    else {await apiRequest(`/api/development/${button.dataset.developmentImprove}/improve`,{method:'POST'});}
    await refreshState();
    // Keep the current detail view, but rebuild it using the latest statuses.
    refreshVisible();
    window.dispatchEvent(new Event('ahabit:habits-refresh'));
    window.dispatchEvent(new Event('focus'));
   }catch(error){alert(error.message||'Не удалось выполнить действие');button.disabled=false;}
   return;
  }
  if(button.dataset.developmentDirection){
   showPage(directionHtml(button.dataset.developmentDirection),'direction');
   root.dataset.developmentDirectionKey=button.dataset.developmentDirection;
  }else if(button.dataset.developmentUpgrade){
   const cycle=Number(button.dataset.developmentCycle)||1;
   showPage(upgradeHtml(button.dataset.developmentUpgrade,cycle),'detail');
   root.dataset.developmentResearchKey=button.dataset.developmentUpgrade;
   root.dataset.developmentCycle=String(cycle);
  }
 });
}

import { developmentDirectionName, developmentResearchName } from './developmentTranslations.js';
import { t } from '../../i18n/core/i18n.js';
import { apiRequest } from '../api/apiClient.js';
import { DIRECTIONS, RESEARCH_CATALOG, getResearch, RESEARCH_DAYS } from './developmentCatalog.js';
import { directionHtml } from './developmentDirection.js?v=20261115-dev-cancel7';
import { upgradeHtml } from './developmentDetail.js?v=20261115-dev-cancel7';
export const icon = name => `<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
let developmentState = {research:[]};
export const researchState = () => developmentState;
export const researchRecord = (key,cycle) => developmentState.research.find(r=>r.key===key&&Number(r.cycle)===Number(cycle));
const escapeHtml = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const activeResearchHtml = () => {
 const active=developmentState.research.filter(r=>!r.completed);
 if(!active.length)return '<div class="development-empty">${t("development.empty")}</div>';
 return `<div class="development-active-list">${active.map(r=>{
  const direction=DIRECTIONS.find(d=>d.key===r.direction);
  const item=getResearch(r.key);
  const target=Number(r.target)||RESEARCH_DAYS[Number(r.cycle)-1]||7;
  const progress=Math.max(0,Math.min(target,Number(r.progress)||0));
  return `<button type="button" class="development-active-item" data-development-active="${escapeHtml(r.key)}" data-development-cycle="${Number(r.cycle)||1}"><span>${escapeHtml(direction?developmentDirectionName(direction.key):r.direction)} · ${escapeHtml(item?developmentResearchName(item.key):r.key)} ${progress}/${target}</span>${icon('chevron_right')}</button>`;
 }).join('')}</div>`;
};
const totalResearchCount = () => DIRECTIONS.reduce((sum, direction) => sum + (RESEARCH_CATALOG[direction.key]?.items.length || 0) * 3, 0);
const directionResearchCount = key => (RESEARCH_CATALOG[key]?.items.length || 0) * 3;
export const rootHtml = () => `<div class="development-screen">
<header class="development-heading"><h1>${t("development.title")}</h1></header>
<p class="development-intro">${t("development.intro")}</p>
<div class="development-overall"><div class="development-overall__icon">${icon('hexagon')}</div><div class="development-overall__main"><div class="development-line"><strong>${t("development.overall")}</strong><strong>${developmentState.research.filter(r=>r.completed).length} / ${totalResearchCount()}</strong></div><div class="development-progress"><span style="width:${Math.min(100,Math.round(developmentState.research.filter(r=>r.completed).length/totalResearchCount()*100))}%"></span></div></div></div>
<div class="development-directions">${DIRECTIONS.map(d=>`<button type="button" class="development-direction development-direction--${d.color}" data-development-direction="${d.key}"><span class="development-direction__icon">${icon(d.icon)}</span><span class="development-direction__arrow">${icon('chevron_right')}</span><strong>${escapeHtml(developmentDirectionName(d.key))}</strong><span class="development-direction__count">${developmentState.research.filter(r=>r.direction===d.key&&r.completed).length} / ${directionResearchCount(d.key)}</span><span class="development-progress"><span style="width:${Math.min(100,Math.round(developmentState.research.filter(r=>r.direction===d.key&&r.completed).length/directionResearchCount(d.key)*100))}%"></span></span></button>`).join('')}</div>
<div class="development-section-title">${icon('science')}<h2>${t("development.research")}</h2><span>${t("development.activeCount", {count:developmentState.research.filter(r=>!r.completed).length})}</span></div>
${activeResearchHtml()}
<p class="development-preview-note">${t("development.choose")}</p></div>`;
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
  if(!next || !Array.isArray(next.research))throw new Error(t('development.invalidResponse'));
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
 const refresh = async () => { try {if(await refreshState())refreshVisible();}catch(error){console.error('Развитие:',error); throw error;} };
 refresh();
 window.addEventListener('app:languagechange', () => {
  refreshVisible();
 });
 window.addEventListener('ahabit:habits-refresh', event => {
  const task = refresh();
  if (Array.isArray(event.detail?.waitFor)) event.detail.waitFor.push(task);
  else task.catch(error => console.error('Развитие:', error));
 });
 root.addEventListener('click',async event=>{
  const button=event.target.closest('[data-development-direction], [data-development-back], [data-development-upgrade], [data-development-start], [data-development-improve], [data-development-go-habits], [data-development-active], [data-development-next-cycle], [data-development-cancel]');
  if(!button||!root.contains(button))return;
  if(button.hasAttribute('data-development-cancel')){
   if(!window.confirm(t('development.cancelConfirm')))return;
   button.disabled=true;
   try{
    await apiRequest(`/api/development/${encodeURIComponent(button.dataset.developmentCancel)}/cancel`,{method:'POST'});
    await refreshState();
    refreshVisible();
    window.dispatchEvent(new Event('ahabit:habits-refresh'));
   }catch(error){alert(error?.message||t('development.cancelError'));button.disabled=false;}
   return;
  }
  if(button.hasAttribute('data-development-next-cycle')){
   const key=button.dataset.developmentNextKey;
   const cycle=Number(button.dataset.developmentNextCycle);
   const item=getResearch(key);
   if(!item||!Number.isInteger(cycle)||cycle<2||cycle>3)return;
   // Navigate back to the direction tree and scroll to the next cycle.
   history.length=0;
   root.dataset.developmentPage='direction';
   root.dataset.developmentDirectionKey=item.direction;
   root.dataset.developmentResearchKey='';
   root.innerHTML=directionHtml(item.direction);
   const section=root.querySelector(`[data-development-cycle-section="${cycle}"]`);
   if(section){
    const top=section.getBoundingClientRect().top-root.getBoundingClientRect().top+root.scrollTop-75;
    root.scrollTo({top:Math.max(0,top),behavior:'smooth'});
   }
   return;
  }
  if(button.hasAttribute('data-development-back')){goBack();return;}
  if(button.hasAttribute('data-development-go-habits')){
   document.dispatchEvent(new CustomEvent('app:navigate',{detail:{page:'habits'}}));
   return;
  }
  if(button.hasAttribute('data-development-active')){
   const key=button.dataset.developmentActive;const cycle=Number(button.dataset.developmentCycle)||1;
   showPage(upgradeHtml(key,cycle),'detail');
   root.dataset.developmentResearchKey=key;root.dataset.developmentCycle=String(cycle);return;
  }
  if(button.dataset.developmentStart || button.dataset.developmentImprove){
   button.disabled=true;
   try{
    if(button.dataset.developmentStart){
     const direction=button.dataset.direction,key=button.dataset.developmentStart,cycle=Number(button.dataset.developmentCycle);
     const created=await apiRequest('/api/development/start',{method:'POST',body:{direction,key,cycle}});
     // The POST succeeded: reflect the record immediately even if a later GET races.
     if(created?.habit_id && !researchRecord(key,cycle))developmentState={...developmentState,research:[...developmentState.research,{direction,key,cycle,habit_id:created.habit_id,progress:created.progress||0,target:created.target||RESEARCH_DAYS[cycle-1],completed:false,ready:false}]};
    }
    else {await apiRequest(`/api/development/${button.dataset.developmentImprove}/improve`,{method:'POST'});}
    try { await refreshState(); } catch(refreshError) { console.error('Не удалось обновить исследования после успешного действия:',refreshError); }
    // Keep the current detail view, but rebuild it using the latest statuses.
    refreshVisible();
    window.dispatchEvent(new Event('ahabit:habits-refresh'));
    window.dispatchEvent(new Event('focus'));
   }catch(error){alert(error.message||t('development.actionError'));button.disabled=false;}
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

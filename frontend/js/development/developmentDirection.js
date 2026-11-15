import { RESEARCH_CATALOG } from './developmentCatalog.js';
import { icon, rootHtml, researchState, researchRecord } from './development.js?v=20261115-dev-state-sync5';

// Display links are a deliberately sparse, non-crossing tree. Actual access
// requirements remain in the catalog and will be enforced by the backend.
// Each direction has its own 12-node silhouette, repeated for cycles I–III.
// These are display-only connections; access rules stay in developmentCatalog.js.
const LAYOUTS = {
 body: [['endurance'],['strength','health'],['flexibility','nutrition','recovery'],['posture','balance'],['coordination','speed','agility'],['fitness']],
 mind: [['attention'],['memory','focus'],['logic','learning'],['analysis','creativity','planning'],['thinking','speech'],['erudition','strategy']],
 will: [['discipline'],['self_control','persistence'],['responsibility'],['patience','decisiveness'],['consistency','courage','initiative'],['purpose','resilience','character']],
 psyche: [['awareness'],['calm','self_esteem','empathy'],['confidence','stress'],['emotional_control','adaptability'],['acceptance','optimism','inner_balance'],['psychological_resilience']]
};
const X = {1:[50],2:[26,74],3:[17,50,83]};
const ROW_STEP = 142;
const Y0 = 50;
const R = 33;
const escapeHtml = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function renderCycle(direction, cycle) {
 const rows=LAYOUTS[direction.key];
 const items=new Map(direction.items.map(item=>[item.key,item]));
 const points=new Map();
 rows.forEach((row,i)=>row.forEach((key,j)=>points.set(key,{x:X[row.length][j],y:Y0+i*ROW_STEP})));
 const height=Y0+(rows.length-1)*ROW_STEP+92;
 // Visual routes use an ordered, non-crossing hierarchy. The complete
 // unlock prerequisites remain in RESEARCH_CATALOG and are not altered here.
 // A child is visually attached to the nearest node in the preceding row.
 // Nearest-neighbour mapping keeps each parent's children adjacent and
 // prevents crossing lines even when row widths differ by direction.
 const paths=[];
 for(let i=1;i<rows.length;i++){
  const parents=rows[i-1];
  const children=rows[i];
  const parentIndices=children.map((key,j)=>{
   const childX=points.get(key).x;
   let closest=0;
   for(let k=1;k<parents.length;k++){
    if(Math.abs(points.get(parents[k]).x-childX)<Math.abs(points.get(parents[closest]).x-childX)) closest=k;
   }
   return closest;
  });
  const grouped=new Map();
  children.forEach((key,j)=>{
   const parentKey=parents[parentIndices[j]];
   if(!grouped.has(parentKey))grouped.set(parentKey,[]);
   grouped.get(parentKey).push(key);
  });
  for(const [parentKey,childKeys] of grouped){
   const a=points.get(parentKey);
   const sy=a.y+R;
   const ey=points.get(childKeys[0]).y-R;
   const busY=Math.round((sy+ey)/2);
   const xs=childKeys.map(key=>points.get(key).x);
   const minX=Math.min(a.x,...xs), maxX=Math.max(a.x,...xs);
   // Orthogonal stems and a shared horizontal bus, all at 1.5px in CSS.
   // A straight aligned pair needs just one continuous vertical segment.
   if(childKeys.length===1 && xs[0]===a.x){
    paths.push(`<path d="M ${a.x} ${sy} V ${ey}"/>`);
   }else{
    paths.push(`<path d="M ${a.x} ${sy} V ${busY}"/>`);
    if(maxX>minX)paths.push(`<path d="M ${minX} ${busY} H ${maxX}"/>`);
    childKeys.forEach(key=>{
     const x=points.get(key).x;
     paths.push(`<path d="M ${x} ${busY} V ${ey}"/>`);
    });
   }
  }
 }
 const nodes=rows.flat().map(key=>{
  const item=items.get(key),p=points.get(key);
  const record=researchRecord(key,cycle);
  const done=new Set(researchState().research.filter(r=>r.completed).map(r=>`${r.key}:${r.cycle}`));
  const available=(cycle===1||done.has(`${key}:${cycle-1}`))&&item.requires.every(r=>done.has(`${r.key}:${cycle}`));
  const state=record?.completed?'completed':record?.ready?'ready':record?'active':available?'available':'locked';
  return `<button type="button" class="development-skill development-skill--${state}" style="left:${p.x}%;top:${p.y}px" data-development-upgrade="${escapeHtml(key)}" data-development-cycle="${cycle}" aria-label="${escapeHtml(item.name)} ${cycle}. ${state==='completed'?'Завершено':state==='ready'?'Готово к улучшению':state==='active'?'Исследуется':available?'Доступно':'Закрыто'}"><span class="development-skill__circle">${icon(state==='locked'?'lock':item.icon)}</span><span class="development-skill__name">${escapeHtml(item.name)} ${['','I','II','III'][cycle]}</span></button>`;
 }).join('');
 return `<section class="development-cycle" data-development-cycle-section="${cycle}"><div class="development-cycle__heading"><strong>Цикл ${['','I','II','III'][cycle]}</strong><span>${['','Основа','Развитие','Мастерство'][cycle]} · ${researchState().research.filter(r=>r.direction===direction.key&&r.cycle===cycle&&r.completed).length} / 12</span></div><div class="development-tree-map" style="height:${height}px"><svg class="development-tree-map__links" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">${paths.join('')}</svg>${nodes}</div></section>`;
}
export function directionHtml(key){
 const direction=RESEARCH_CATALOG[key];if(!direction)return rootHtml();
 return `<div class="development-screen development-screen--${direction.color}"><header class="development-heading development-heading--direction"><button class="development-back" data-development-back="root" aria-label="Назад">${icon('arrow_back')}</button><h1>${escapeHtml(direction.name)}</h1></header><div class="development-overall"><div class="development-overall__main"><div class="development-line"><span>Прогресс направления</span><strong>${researchState().research.filter(r=>r.direction===key&&r.completed).length} / 36</strong></div><div class="development-progress"><span style="width:${Math.min(100,Math.round(researchState().research.filter(r=>r.direction===key&&r.completed).length/36*100))}%"></span></div></div></div><div class="development-cycles">${[1,2,3].map(c=>renderCycle(direction,c)).join('')}</div><p class="development-preview-note">Выбирай доступные исследования и выполняй задания.</p></div>`;
}

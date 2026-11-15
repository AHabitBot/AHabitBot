import { RESEARCH_CATALOG } from './developmentCatalog.js';
import { icon, rootHtml } from './development.js';

// Display links are a deliberately sparse, non-crossing tree. Actual access
// requirements remain in the catalog and will be enforced by the backend.
const LAYOUTS = {
 body: [['endurance'],['strength','health'],['flexibility','nutrition','recovery'],['posture','balance'],['coordination','speed','agility'],['fitness']],
 mind: [['attention'],['memory','focus'],['logic','learning','planning'],['analysis','creativity'],['thinking','speech','erudition'],['strategy']],
 will: [['discipline'],['self_control','persistence'],['responsibility','patience','decisiveness'],['consistency','courage'],['initiative','purpose','resilience'],['character']],
 psyche: [['awareness'],['calm','self_esteem'],['empathy','confidence','stress'],['emotional_control','adaptability'],['acceptance','optimism','inner_balance'],['psychological_resilience']]
};
const PARENTS = {
 body: {strength:'endurance',health:'endurance',flexibility:'strength',nutrition:'health',recovery:'health',posture:'flexibility',balance:'nutrition',coordination:'balance',speed:'posture',agility:'coordination',fitness:'agility'},
 mind: {memory:'attention',focus:'attention',logic:'memory',learning:'memory',planning:'focus',analysis:'logic',creativity:'learning',thinking:'analysis',speech:'creativity',erudition:'learning',strategy:'thinking'},
 will: {self_control:'discipline',persistence:'discipline',responsibility:'self_control',patience:'self_control',decisiveness:'persistence',consistency:'responsibility',courage:'decisiveness',initiative:'consistency',purpose:'persistence',resilience:'patience',character:'purpose'},
 psyche: {calm:'awareness',self_esteem:'awareness',empathy:'calm',confidence:'self_esteem',stress:'calm',emotional_control:'stress',adaptability:'confidence',acceptance:'emotional_control',optimism:'self_esteem',inner_balance:'acceptance',psychological_resilience:'inner_balance'}
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
 // One visible parent per node, only adjacent rows. This prevents crossing
 // and sprawling connector paths; unlock logic can have extra prerequisites.
 const paths=[];
 rows.forEach((row,i)=>{
  if(!i)return;
  const previous=new Set(rows[i-1]);
  row.forEach(key=>{
   const parent=PARENTS[direction.key][key];
   if(!previous.has(parent))return;
   const a=points.get(parent),b=points.get(key);
   const sy=a.y+R, ey=b.y-R, mid=(sy+ey)/2;
   paths.push(`<path d="M ${a.x} ${sy} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${ey}"/>`);
  });
 });
 const nodes=rows.flat().map(key=>{
  const item=items.get(key),p=points.get(key);
  const available=cycle===1 && item.requires.length===0;
  const state=available?'available':'locked';
  return `<button type="button" class="development-skill development-skill--${state}" style="left:${p.x}%;top:${p.y}px" data-development-upgrade="${escapeHtml(key)}" data-development-cycle="${cycle}" aria-label="${escapeHtml(item.name)} ${cycle}. ${available?'Доступно':'Закрыто'}"><span class="development-skill__circle">${icon(available?item.icon:'lock')}</span><span class="development-skill__name">${escapeHtml(item.name)} ${['','I','II','III'][cycle]}</span></button>`;
 }).join('');
 return `<section class="development-cycle"><div class="development-cycle__heading"><strong>Цикл ${['','I','II','III'][cycle]}</strong><span>${['','Основа','Развитие','Мастерство'][cycle]} · 0 / 12</span></div><div class="development-tree-map" style="height:${height}px"><svg class="development-tree-map__links" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">${paths.join('')}</svg>${nodes}</div></section>`;
}
export function directionHtml(key){
 const direction=RESEARCH_CATALOG[key];if(!direction)return rootHtml();
 return `<div class="development-screen development-screen--${direction.color}"><header class="development-heading development-heading--direction"><button class="development-back" data-development-back="root" aria-label="Назад">${icon('arrow_back')}</button><h1>${escapeHtml(direction.name)}</h1></header><div class="development-overall"><div class="development-overall__main"><div class="development-line"><span>Прогресс направления</span><strong>0 / 36</strong></div><div class="development-progress"><span style="width:0%"></span></div></div></div><div class="development-cycles">${[1,2,3].map(c=>renderCycle(direction,c)).join('')}</div><p class="development-preview-note">Предпросмотр дерева. Запуск исследований и реальные статусы появятся после подключения backend.</p></div>`;
}

import { RESEARCH_CATALOG } from './developmentCatalog.js';
import { icon, rootHtml } from './development.js';

// Visual rows define placement only. Actual prerequisites remain in developmentCatalog.js.
const BODY_ROWS = [
 ['endurance'], ['strength','health'], ['nutrition'],
 ['flexibility','recovery'], ['posture','balance','coordination'],
 ['speed','agility'], ['fitness']
];
function layout(items, key) {
 const byKey = new Map(items.map(item => [item.key, item]));
 if (key === 'body') return BODY_ROWS.map(row => row.map(k => byKey.get(k)).filter(Boolean));
 const depths = new Map();
 function depth(item, visited = new Set()) {
  if (depths.has(item.key)) return depths.get(item.key);
  if (visited.has(item.key)) return 0;
  const seen = new Set(visited); seen.add(item.key);
  const n = item.requires.length ? 1 + Math.max(...item.requires.map(r => byKey.has(r.key) ? depth(byKey.get(r.key),seen) : 0)) : 0;
  depths.set(item.key,n); return n;
 }
 items.forEach(item => depth(item));
 const rows=[];
 items.forEach(item => {const d=depths.get(item.key);(rows[d] ||= []).push(item);});
 return rows.filter(Boolean);
}
export function directionHtml(key){
 const d=RESEARCH_CATALOG[key]; if(!d)return rootHtml();
 const rows=layout(d.items,key), positions=new Map(), rowHeight=153, height=rows.length*rowHeight+16;
 rows.forEach((row,r)=>row.forEach((item,i)=>positions.set(item.key,{x:(i+0.5)*1000/row.length,y:r*rowHeight+12})));
 const links=d.items.flatMap(item=>item.requires.map(req=>{
  const a=positions.get(req.key), b=positions.get(item.key);if(!a||!b)return '';
  const y1=a.y+112,y2=b.y, mid=y1+(y2-y1)*0.5;
  return `<path d="M ${a.x} ${y1} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${y2}"/>`;
 })).join('');
 const nodes=d.items.map(item=>{
  const p=positions.get(item.key),locked=item.requires.length>0;
  return `<button type="button" class="development-node development-tree-node ${locked?'development-node--locked':''}" style="left:${p.x/10}%;top:${p.y}px" data-development-upgrade="${item.key}">${icon(item.icon)}<strong>${item.name}</strong><small>${locked?'🔒 ':''}0 / 3</small></button>`;
 }).join('');
 return `<div class="development-screen development-screen--${d.color}"><header class="development-heading development-heading--direction"><button class="development-back" data-development-back="root" aria-label="Назад">${icon('arrow_back')}</button><h1>${d.name}</h1></header><div class="development-overall"><div class="development-overall__main"><div class="development-line"><span>Прогресс направления</span><strong>0 / 36</strong></div><div class="development-progress"><span style="width:0%"></span></div></div></div><div class="development-tree-map" style="height:${height}px"><svg class="development-tree-map__links" viewBox="0 0 1000 ${height}" preserveAspectRatio="none" aria-hidden="true">${links}</svg>${nodes}</div><p class="development-preview-note">Нажми на улучшение, чтобы посмотреть задания и условия открытия. Замочки показывают состояние при нулевом прогрессе.</p></div>`;
}

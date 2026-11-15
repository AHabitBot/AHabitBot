import { RESEARCH_CATALOG } from './developmentCatalog.js';
import { icon, rootHtml } from './development.js';

// Visual placement only: access rules always come from the catalog.
const BODY_ROWS = [
  ['endurance'], ['strength', 'health'], ['flexibility', 'nutrition', 'recovery'],
  ['posture', 'balance', 'coordination'], ['speed', 'agility', 'fitness']
];

function treeRows(items, direction) {
  const byKey = new Map(items.map(item => [item.key, item]));
  if (direction === 'body') return BODY_ROWS.map(row => row.map(key => byKey.get(key)).filter(Boolean));
  const cache = new Map();
  function depth(item) {
    if (cache.has(item.key)) return cache.get(item.key);
    const result = item.requires.length
      ? 1 + Math.max(...item.requires.map(req => depth(byKey.get(req.key)))) : 0;
    cache.set(item.key, result);
    return result;
  }
  const levels = [];
  items.forEach(item => (levels[depth(item)] ||= []).push(item));
  // No more than three nodes on one row: avoids tiny or overlapping nodes.
  return levels.filter(Boolean).flatMap(level => {
    const rows = [];
    for (let i = 0; i < level.length; i += 3) rows.push(level.slice(i, i + 3));
    return rows;
  });
}

const X_POSITIONS = {1:[500], 2:[270,730], 3:[170,500,830]};
const ROW_HEIGHT = 146;
const FIRST_Y = 61;
const NODE_RADIUS = 37;

export function directionHtml(key) {
  const direction = RESEARCH_CATALOG[key];
  if (!direction) return rootHtml();
  const rows = treeRows(direction.items, key);
  const positions = new Map();
  rows.forEach((row, rowIndex) => row.forEach((item, index) => {
    positions.set(item.key, {x:X_POSITIONS[row.length][index], y:FIRST_Y + rowIndex * ROW_HEIGHT});
  }));
  const height = FIRST_Y + (rows.length - 1) * ROW_HEIGHT + 95;
  const links = direction.items.flatMap(item => item.requires.map(requirement => {
    const from = positions.get(requirement.key);
    const to = positions.get(item.key);
    if (!from || !to) return '';
    const start = from.y + NODE_RADIUS;
    const end = to.y - NODE_RADIUS;
    const midpoint = start + (end-start)/2;
    return `<path d="M ${from.x} ${start} C ${from.x} ${midpoint}, ${to.x} ${midpoint}, ${to.x} ${end}"/>`;
  })).join('');
  const nodes = direction.items.map(item => {
    const position = positions.get(item.key);
    const locked = item.requires.length > 0;
    const requirements = item.requires.map(req => `${direction.items.find(x => x.key === req.key)?.name || req.key} ${req.level}`).join(', ');
    return `<button type="button" class="development-skill ${locked ? 'development-skill--locked' : 'development-skill--available'}" style="left:${position.x/10}%;top:${position.y}px" data-development-upgrade="${item.key}" aria-label="${item.name}. ${locked ? 'Требуется: '+requirements : 'Доступно'}. Уровень 0 из 3"><span class="development-skill__circle">${icon(locked ? 'lock' : item.icon)}</span><span class="development-skill__name">${item.name}</span><span class="development-skill__level">0 / 3</span></button>`;
  }).join('');
  return `<div class="development-screen development-screen--${direction.color}"><header class="development-heading development-heading--direction"><button class="development-back" data-development-back="root" aria-label="Назад">${icon('arrow_back')}</button><h1>${direction.name}</h1></header><div class="development-overall"><div class="development-overall__main"><div class="development-line"><span>Прогресс направления</span><strong>0 / 36</strong></div><div class="development-progress"><span style="width:0%"></span></div></div></div><div class="development-tree-map" style="height:${height}px"><svg class="development-tree-map__links" viewBox="0 0 1000 ${height}" preserveAspectRatio="none" aria-hidden="true">${links}</svg>${nodes}</div><p class="development-preview-note">Нажми на улучшение, чтобы посмотреть задания и условия открытия. Прогресс пока демонстрационный.</p></div>`;
}

import { t } from '../../i18n/core/i18n.js';
export const developmentDirectionName = direction => t(`development.direction.${direction}`);
export const developmentResearchName = key => t(`development.researchName.${key}`);
export const developmentTaskText = (key, cycle) => t(`development.taskText.${key}.${Math.max(1,Math.min(3,Number(cycle)||1))}`);

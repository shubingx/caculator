import { guidedScenarioData } from '../../data/guided-scenarios.js';

export function getModelDisplayName(scenarioKey) {
    return guidedScenarioData[scenarioKey]?.displayName || '線性規劃模型（LP）';
}

window.getModelDisplayName = getModelDisplayName;

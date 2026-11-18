import { templates } from '../../data/templates.js';
export function loadTemplateModel(templateName) {
    const template = templates[templateName];
    if (!template) {
        showToast(`找不到範本：${templateName}`, 'error');
        return false;
    }

    lpState = JSON.parse(JSON.stringify(template.model));
    showToast(template.message, 'success');
    switchMainTab('general');
    renderAllGeneralLPInputs();
    solveCurrentLP();
    return true;
}

if (typeof window !== 'undefined') {
    window.loadTemplateModel = loadTemplateModel;
}

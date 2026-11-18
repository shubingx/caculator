export function navigateSidebar(target) {
            const isTransportScenario = guidedScenario === 'transport';
            const viewTargets = {
                formula: isTransportScenario ? ['transport', 'tp-math-model-box'] : ['general', 'formula-section'],
                analysis: isTransportScenario ? ['transport', 'tp-results-section'] : ['general', 'results-section'],
                graph: isTransportScenario ? ['transport', 'tp-results-section'] : ['general', 'graphical-analysis-card'],
                transport: ['transport', null],
                templates: ['templates', null]
            };

            if (target === 'onboarding') {
                showOnboardingPage();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            if (target === 'input') {
                showGuidedInputPage();
                const sectionId = guidedScenario ? 'guided-details' : 'guided-picker';
                requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                return;
            }

            const [tab, sectionId] = viewTargets[target] || viewTargets.formula;
            switchMainTab(tab);
            setSidebarActive(target);
            if (sectionId) {
                requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

export function switchMainTab(tab) {
            const tabs = ['general', 'transport', 'templates'];
            document.getElementById('view-onboarding').classList.add('hidden');
            document.getElementById('advanced-tools-menu').classList.add('hidden');
            document.getElementById('nav-btn-home').classList.remove('bg-cyan-600', 'text-white');
            setSidebarActive(tab === 'general' ? 'input' : tab);
            tabs.forEach(t => {
                const view = document.getElementById(`view-${t}`);
                const btn = document.getElementById(`tab-btn-${t}`);
                if (t === tab) {
                    view.classList.remove('hidden');
                } else {
                    view.classList.add('hidden');
                }
                if (btn) {
                    btn.className = t === tab
                        ? 'px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                        : 'px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 text-slate-400 hover:text-slate-200';
                }
            });

            if (tab === 'transport') {
                renderTransportInputTable();
                buildAndSolveTransport(true);
            } else if (tab === 'general') {
                if (lpState.numVars === 2 && lastSolution) {
                    setTimeout(() => draw2DGraph(), 50);
                }
            }
        }

        /*************************************************************************
         * 一般線性規劃 (General LP) UI 動態渲染與互動
         *************************************************************************/

if (typeof window !== 'undefined') {
    Object.assign(window, { navigateSidebar, switchMainTab });
}

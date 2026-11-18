import { appState } from './app/app-state.js';
import * as navigation from './app/navigation.js';
import * as routes from './app/routes.js';
import * as generalLPView from './features/general-lp/general-lp-view.js';
import * as generalLPController from './features/general-lp/general-lp-controller.js';
import * as resultsView from './features/analysis/results-view.js';
import * as graphView from './features/analysis/graph-view.js';
import * as transportController from './features/transport/transport-controller.js';
import * as parserView from './features/ai-parser/parser-view.js';
import * as templatesController from './features/templates/template-controller.js';
import * as onboardingController from './features/onboarding/onboarding-controller.js';
import * as modelMetadata from './features/onboarding/model-metadata.js';
import * as dom from './ui/dom.js';
import * as formatters from './ui/formatters.js';
import * as toast from './ui/toast.js';
import { solveFullLPModel } from './domain/integer-solver.js';

Object.assign(window, {
    ...navigation,
    ...routes,
    ...generalLPView,
    ...generalLPController,
    ...resultsView,
    ...graphView,
    ...transportController,
    ...parserView,
    ...templatesController,
    ...onboardingController,
    ...modelMetadata,
    ...dom,
    ...formatters,
    ...toast,
    solveFullLPModel
});

export function startApp() {
    if (document.documentElement.dataset.appReady === 'true') return;

    generalLPView.renderAllGeneralLPInputs();
    resultsView.solveCurrentLP();
    transportController.renderTransportInputTable();
    transportController.buildAndSolveTransport(true);
    navigation.showOnboardingPage();

    window.addEventListener('resize', () => {
        const generalView = document.getElementById('view-general');
        if (appState.lpState.numVars === 2 && !generalView.classList.contains('hidden')) {
            graphView.draw2DGraph();
        }
    });

    document.documentElement.dataset.appReady = 'true';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
    startApp();
}

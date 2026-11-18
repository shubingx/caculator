export function setWorkspaceNavigationVisible(visible) {
    document.getElementById('workspace-shell')?.classList.toggle('sidebar-hidden', !visible);
}

export function setSidebarActive(target) {
    document.querySelectorAll('[data-sidebar-target]').forEach(button => {
        const isActive = button.dataset.sidebarTarget === target;
        button.classList.toggle('active', isActive);
        if (isActive) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
        }
    });
}

export function showGuidedInputPage() {
    setWorkspaceNavigationVisible(true);
    document.getElementById('view-onboarding')?.classList.remove('hidden');
    document.getElementById('view-general')?.classList.add('hidden');
    document.getElementById('view-transport')?.classList.add('hidden');
    document.getElementById('view-templates')?.classList.add('hidden');
    document.getElementById('advanced-tools-menu')?.classList.add('hidden');
    document.getElementById('nav-btn-home')?.classList.add('bg-cyan-600', 'text-white');
    setSidebarActive('input');
}

export function toggleAdvancedTools() {
    document.getElementById('advanced-tools-menu')?.classList.toggle('hidden');
}

export function showOnboardingPage() {
    document.getElementById('view-onboarding')?.classList.remove('hidden');
    document.getElementById('view-general')?.classList.add('hidden');
    document.getElementById('view-transport')?.classList.add('hidden');
    document.getElementById('view-templates')?.classList.add('hidden');
    document.getElementById('advanced-tools-menu')?.classList.add('hidden');
    document.getElementById('nav-btn-home')?.classList.add('bg-cyan-600', 'text-white');
    setSidebarActive('onboarding');
    window.resetGuidedPicker?.();
}

export function openGuidedEditor() {
    window.switchMainTab?.('general');
}

export function syncSidebarToScroll() {
    const shell = document.getElementById('workspace-shell');
    if (!shell || shell.classList.contains('sidebar-hidden')) return;

    const isVisible = id => !document.getElementById(id)?.classList.contains('hidden');
    let sectionTargets;

    if (isVisible('view-transport')) {
        sectionTargets = [['formula', 'tp-math-model-box'], ['analysis', 'tp-results-section']];
    } else if (isVisible('view-general')) {
        sectionTargets = [
            ['input', 'input-section'], ['formula', 'formula-section'],
            ['analysis', 'results-section'], ['graph', 'graphical-analysis-card']
        ];
    } else {
        // 引導頁：結果卡片出現後，捲到它時高亮「結果與進一步分析」
        sectionTargets = [['input', 'guided-details'], ['analysis', 'guided-result']];
    }

    const threshold = 140;
    let activeTarget = sectionTargets[0][0];
    sectionTargets.forEach(([target, id]) => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden') && el.getBoundingClientRect().top <= threshold) {
            activeTarget = target;
        }
    });
    setSidebarActive(activeTarget);
}

let scrollSyncPending = false;
window.addEventListener('scroll', () => {
    if (scrollSyncPending) return;
    scrollSyncPending = true;
    window.requestAnimationFrame(() => {
        scrollSyncPending = false;
        syncSidebarToScroll();
    });
}, { passive: true });

window.addEventListener('resize', syncSidebarToScroll);

window.setWorkspaceNavigationVisible = setWorkspaceNavigationVisible;
window.setSidebarActive = setSidebarActive;
window.showGuidedInputPage = showGuidedInputPage;
window.toggleAdvancedTools = toggleAdvancedTools;
window.showOnboardingPage = showOnboardingPage;
window.openGuidedEditor = openGuidedEditor;
window.syncSidebarToScroll = syncSidebarToScroll;

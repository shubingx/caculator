const COLOR_MAP = Object.freeze({
    info: 'bg-slate-900 border-cyan-500/50 text-cyan-200',
    success: 'bg-slate-900 border-emerald-500/50 text-emerald-200',
    warn: 'bg-slate-900 border-amber-500/50 text-amber-200',
    error: 'bg-slate-900 border-rose-500/50 text-rose-200'
});

const ICON_MAP = Object.freeze({
    info: 'fa-circle-info text-cyan-400',
    success: 'fa-circle-check text-emerald-400',
    warn: 'fa-triangle-exclamation text-amber-400',
    error: 'fa-circle-xmark text-rose-400'
});

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs sm:text-sm transition-all duration-300 ${COLOR_MAP[type] || COLOR_MAP.info}`;
    toast.innerHTML = `
        <i class="fa-solid ${ICON_MAP[type] || ICON_MAP.info} text-base"></i>
        <span class="flex-1 font-medium">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// Keep legacy inline handlers working while controllers are migrated.
window.showToast = showToast;

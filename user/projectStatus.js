/**
 * GALAXY SMART SYSTEM – projectStatus.js
 * User-side section: Upcoming / Running / Completed projects
 * Powered by Firebase Firestore
 */

import { watchProjects, DEFAULT_CATEGORIES, CATEGORY_KEYS, CATEGORY_ICONS, TASK_STATUS_META, formatProjectStartDate } from '../firebase/firestore.js';

let statusProjects = [];
let statusObserver = null;

const statusMeta = {
    upcoming:  { label: 'Upcoming',     icon: '🔮', color: '#7A5FFF', glow: 'rgba(122,95,255,0.3)'  },
    running:   { label: 'In Progress',  icon: '⚡', color: '#00C2FF', glow: 'rgba(0,194,255,0.3)'   },
    completed: { label: 'Completed',    icon: '✅', color: '#00FFD1', glow: 'rgba(0,255,209,0.3)'   }
};

function renderProgressRing(pct, color) {
    const c = 2 * Math.PI * 20;
    const offset = c - (pct / 100) * c;
    return `
    <div class="pstatus-ring">
        <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4"/>
            <circle cx="26" cy="26" r="20" fill="none" stroke="${color}" stroke-width="4"
                stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
        </svg>
        <span class="pstatus-ring-val" data-count="${pct}">0%</span>
    </div>`;
}

function renderCategoryBars(progress, completedSections = {}) {
    const p = progress || {};
    return CATEGORY_KEYS.map((key, i) => {
        const cat = DEFAULT_CATEGORIES[key];
        const val = Math.min(100, Math.max(0, parseInt(p[key], 10) || 0));
        const icon = CATEGORY_ICONS[key] || '📊';
        const done = !!completedSections[key];
        return `
        <div class="category-bar-row ${done ? 'section-complete' : ''}" style="animation-delay:${0.1 + i * 0.08}s">
            <div class="category-bar-top">
                <div class="category-bar-left">
                    <span class="premium-cat-chip" style="background:${cat.color}33;border-color:${cat.color}66;box-shadow:0 0 8px ${cat.color}33;">${icon}</span>
                    <span class="category-bar-label">${cat.label}${done ? ' <span class="section-tick-badge">✅</span>' : ''}</span>
                </div>
                <span class="premium-pct-badge category-bar-val" data-count="${val}" style="color:${cat.color};border-color:${cat.color}66;background:${cat.color}18;">0/100</span>
            </div>
            <div class="category-bar-bg premium-bar-track">
                <div class="category-bar-fill premium-bar-fill" data-width="${val}" data-delay="${i * 80}" style="width:0%;background:${cat.gradient || cat.color};box-shadow:0 0 10px ${cat.color}55;"></div>
            </div>
        </div>`;
    }).join('');
}

function renderNextTasks(tasks) {
    if (!Array.isArray(tasks) || !tasks.length) return '';
    const sorted = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const active = sorted.filter(t => t.status === 'active');
    const upcoming = sorted.filter(t => t.status === 'locked').slice(0, 3);
    const done = sorted.filter(t => t.status === 'done');

    const activeHtml = active.length
        ? active.map((task) => {
            const catLabel = DEFAULT_CATEGORIES[task.category]?.label || task.category;
            return `<div class="pstatus-active-hero">
                <span class="pm-task-status-badge badge-active">${TASK_STATUS_META.active.badge}</span>
                <span class="task-cat">[${catLabel}]</span> <span class="task-title">${task.title}</span>
            </div>`;
        }).join('')
        : '<div class="pm-no-active">No active task</div>';

    const upcomingHtml = upcoming.length
        ? `<div class="pstatus-upcoming-label">🔜 Coming Updates</div>
           ${upcoming.map((task) => {
               const catLabel = DEFAULT_CATEGORIES[task.category]?.label || task.category;
               return `<div class="task-row task-locked">
                   <span class="task-icon">${TASK_STATUS_META.locked.icon}</span>
                   <span class="pm-task-status-badge badge-locked">${TASK_STATUS_META.locked.badge}</span>
                   <span class="task-cat">[${catLabel}]</span>
                   <span class="task-title">${task.title}</span>
               </div>`;
           }).join('')}`
        : '';

    const doneHtml = done.length ? `
        <button type="button" class="pstatus-tasks-done-toggle" onclick="this.nextElementSibling.classList.toggle('open');this.textContent=this.nextElementSibling.classList.contains('open')?'Hide completed (${done.length})':'Show completed (${done.length})'">
            ✅ Show completed (${done.length})
        </button>
        <div class="pstatus-tasks-done-list">${done.map((task) => {
            const catLabel = DEFAULT_CATEGORIES[task.category]?.label || task.category;
            return `<div class="task-row task-done">
                <span class="task-icon">${TASK_STATUS_META.done.icon}</span>
                <span class="task-cat">[${catLabel}]</span>
                <span class="task-title">${task.title}</span>
            </div>`;
        }).join('')}</div>` : '';

    return `
        <div class="pstatus-tasks-wrap premium-glass-panel">
            <div class="pstatus-tasks-title">⚡ Active & Upcoming</div>
            <div class="pstatus-tasks-list">${activeHtml}${upcomingHtml}</div>
            ${doneHtml}
        </div>`;
}

function renderHistoryPreview(project) {
    const startDate = project.startDate || formatProjectStartDate(project);
    const history = Array.isArray(project.history) ? project.history.slice(0, 2) : [];
    if (!startDate && !history.length) return '';
    const items = [];
    if (startDate) items.push(`<div class="pstatus-history-item is-start">🚀 Started ${startDate}</div>`);
    history.forEach((h) => {
        items.push(`<div class="pstatus-history-item">📈 ${h.date || ''} — ${h.title} (${h.overallProgress || 0}%)</div>`);
    });
    return `<div class="pstatus-history-wrap premium-glass-panel">
        <div class="pstatus-history-title">📜 Recent History</div>
        ${items.join('')}
    </div>`;
}

function renderStatusCard(p) {
    const meta = statusMeta[p.status] || statusMeta['upcoming'];
    const modalId = p.modalId || p.id || '';

    const progress = p.overallProgress !== undefined
        ? p.overallProgress
        : (p.status === 'completed' ? 100 : 0);

    const barColor = p.status === 'completed'
        ? 'linear-gradient(90deg,#00FFD1,#00C2FF)'
        : p.status === 'upcoming'
            ? 'linear-gradient(90deg,#7A5FFF,#A29BFE)'
            : 'linear-gradient(90deg,#00C2FF,#7A5FFF)';

    const progressBar = `
        <div class="pstatus-progress-wrap">
            <div class="pstatus-progress-label">
                <span>Overall Progress</span>
                <span class="pstatus-pct premium-pct-badge" data-count="${progress}">0%</span>
            </div>
            <div class="pstatus-progress-bar-bg">
                <div class="pstatus-progress-bar premium-bar-fill" data-width="${progress}" style="width:0%;background:${barColor}"></div>
            </div>
        </div>`;

    const categoryHtml = `
        <div class="pstatus-categories premium-glass-panel">
            <div class="pstatus-categories-title">📊 Development Breakdown</div>
            ${renderCategoryBars(p.progress, p.completedSections)}
        </div>`;

    const tasksHtml = renderNextTasks(p.tasks);
    const historyHtml = renderHistoryPreview(p);
    const startDate = p.startDate || formatProjectStartDate(p);

    const priorityColor = p.priority === 'high' ? '#FF6B6B' : (p.priority === 'medium' ? '#FF8C42' : '#00D084');
    const chips = p.status === 'completed'
        ? `<span class="pstatus-chip pstatus-chip-done">✔ ${p.completedDate || p.eta || 'Dec 2024'}</span>`
        : `${startDate ? `<span class="pstatus-chip pstatus-chip-start">🚀 Started: ${startDate}</span>` : ''}
           <span class="pstatus-chip pstatus-chip-eta">🗓 ETA: ${p.eta || 'TBD'}</span>
           <span class="pstatus-chip pstatus-chip-priority" style="color:${priorityColor};">${p.priority || 'medium'}</span>`;

    const viewMore = modalId ? `
        <button class="pstatus-viewmore" onclick="window.openProjectModal('${modalId}')">
            <span>📊 View Progress Dashboard</span>
            <span class="pstatus-viewmore-arrow">→</span>
        </button>` : '';

    return `
    <div class="pstatus-card reveal" data-status="${p.status}">
        <div class="pstatus-card-header">
            <div class="pstatus-badge" style="--badge-color:${meta.color};--badge-glow:${meta.glow};">
                ${meta.icon} ${meta.label}
            </div>
            <div class="pstatus-tech">🔧 ${(p.techStack || p.tech || []).join(', ')}</div>
        </div>
        <div class="pstatus-title-row">
            <h3 class="pstatus-title">${p.title}</h3>
            ${renderProgressRing(progress, meta.color)}
        </div>
        <p class="pstatus-desc">${p.description}</p>
        ${progressBar}
        ${categoryHtml}
        ${tasksHtml}
        ${historyHtml}
        <div class="pstatus-chips">${chips}</div>
        ${viewMore}
    </div>`;
}

function animateCountUp(el, target, suffix = '%', duration = 900) {
    if (!el) return;
    const start = performance.now();
    const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(target * eased);
        el.textContent = suffix === '/100' ? `${val}/100` : `${val}${suffix}`;
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function animateBars(container) {
    container.querySelectorAll('.pstatus-progress-bar, .category-bar-fill').forEach(bar => {
        const target = parseInt(bar.dataset.width, 10) || 0;
        const delay = parseInt(bar.dataset.delay, 10) || 0;
        bar.style.transitionDelay = `${delay}ms`;
        requestAnimationFrame(() => {
            bar.style.width = `${target}%`;
        });
    });

    container.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10) || 0;
        const isFraction = el.classList.contains('category-bar-val');
        animateCountUp(el, target, isFraction ? '/100' : '%');
    });

    container.querySelectorAll('.pstatus-ring-val').forEach(el => {
        animateCountUp(el, parseInt(el.dataset.count, 10) || 0, '%');
    });
}

function setupStatusObserver(section) {
    const grid = section.querySelector('#pstatus-grid');
    if (!grid || statusObserver) return;
    statusObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateBars(section);
            }
        });
    }, { threshold: 0.15 });
    statusObserver.observe(grid);
}

function updateGrid(section, projects) {
    const grid = section.querySelector('#pstatus-grid');
    if (!grid) return;

    grid.innerHTML = projects.map(p => renderStatusCard(p)).join('');

    const counts = {
        all: projects.length,
        upcoming: projects.filter(p => p.status === 'upcoming').length,
        running: projects.filter(p => p.status === 'running').length,
        completed: projects.filter(p => p.status === 'completed').length
    };

    section.querySelectorAll('.pstatus-summary-num').forEach((el, i) => {
        if (i === 0) el.textContent = counts.upcoming;
        if (i === 1) el.textContent = counts.running;
        if (i === 2) el.textContent = counts.completed;
        if (i === 3) el.textContent = counts.all;
    });

    section.querySelectorAll('.pstatus-tab-count').forEach((el, i) => {
        const tabs = ['all', 'upcoming', 'running', 'completed'];
        el.textContent = counts[tabs[i]];
    });

    setupStatusObserver(section);
    setTimeout(() => animateBars(section), 150);
}

export function initProjectStatus() {
    const section = document.getElementById('project-status');
    if (!section) return;

    section.innerHTML = `
    <div class="container">
        <div class="section-header reveal">
            <span class="section-label">Live Tracker</span>
            <h2 class="section-title">Project <span class="gradient-text">Status Board</span></h2>
            <p class="section-desc">Track our active, upcoming, and completed projects in real-time — complete transparency, always.</p>
        </div>

        <div class="pstatus-summary reveal">
            <div class="pstatus-summary-card" style="--sc:rgba(122,95,255,0.15);--sc-b:rgba(122,95,255,0.3);"><div class="pstatus-summary-icon">🔮</div><div class="pstatus-summary-num">0</div><div class="pstatus-summary-lbl">Upcoming</div></div>
            <div class="pstatus-summary-card" style="--sc:rgba(0,194,255,0.15);--sc-b:rgba(0,194,255,0.3);"><div class="pstatus-summary-icon">⚡</div><div class="pstatus-summary-num">0</div><div class="pstatus-summary-lbl">Running</div></div>
            <div class="pstatus-summary-card" style="--sc:rgba(0,255,209,0.15);--sc-b:rgba(0,255,209,0.3);"><div class="pstatus-summary-icon">✅</div><div class="pstatus-summary-num">0</div><div class="pstatus-summary-lbl">Completed</div></div>
            <div class="pstatus-summary-card" style="--sc:rgba(255,193,7,0.12);--sc-b:rgba(255,193,7,0.3);"><div class="pstatus-summary-icon">📁</div><div class="pstatus-summary-num">0</div><div class="pstatus-summary-lbl">Total Projects</div></div>
        </div>

        <div class="pstatus-tabs" id="pstatus-tabs">
            <button class="pstatus-tab active" data-tab="all">🌐 All <span class="pstatus-tab-count">0</span></button>
            <button class="pstatus-tab" data-tab="upcoming">🔮 Upcoming <span class="pstatus-tab-count">0</span></button>
            <button class="pstatus-tab" data-tab="running">⚡ Running <span class="pstatus-tab-count">0</span></button>
            <button class="pstatus-tab" data-tab="completed">✅ Completed <span class="pstatus-tab-count">0</span></button>
        </div>

        <div class="pstatus-grid" id="pstatus-grid">
            <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted);">Loading live board...</div>
        </div>
    </div>`;

    section.querySelectorAll('.pstatus-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            section.querySelectorAll('.pstatus-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.tab;
            section.querySelectorAll('.pstatus-card').forEach(card => {
                card.style.display = (filter === 'all' || card.dataset.status === filter) ? '' : 'none';
            });
            animateBars(section);
        });
    });

    watchProjects(
      (projects) => {
        statusProjects = Array.isArray(projects) ? projects : [];
        updateGrid(section, statusProjects);
      },
      (error) => {
        const grid = section.querySelector('#pstatus-grid');
        if (grid) {
          grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#ff8c8c;">Failed to load status board: ${error.message}</div>`;
        }
      }
    );
}

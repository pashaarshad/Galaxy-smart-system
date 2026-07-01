/**
 * GALAXY SMART SYSTEM – progressGraph.js
 * User-side section: Department Progress Graph (UI, Coding, Planning, etc.)
 */

const PROGRESS_KEY = 'gss_progress_data';

const DEFAULT_PROGRESS = [
    {
        id: 'p1',
        category: 'UI / UX Design',
        icon: '🎨',
        percentage: 85,
        description: 'User interface wireframes, design systems, and interactive prototypes.',
        color: '#7A5FFF',
        projects: 14
    },
    {
        id: 'p2',
        category: 'Frontend Coding',
        icon: '💻',
        percentage: 78,
        description: 'React, Vue, and Vanilla JS implementations across all client projects.',
        color: '#00C2FF',
        projects: 22
    },
    {
        id: 'p3',
        category: 'Backend Development',
        icon: '⚙️',
        percentage: 72,
        description: 'Node.js, Python APIs, microservices, and database architecture.',
        color: '#00FFD1',
        projects: 18
    },
    {
        id: 'p4',
        category: 'Planning & Strategy',
        icon: '📋',
        percentage: 92,
        description: 'Project roadmaps, sprint planning, and stakeholder alignment.',
        color: '#FFB800',
        projects: 30
    },
    {
        id: 'p5',
        category: 'Mobile Development',
        icon: '📱',
        percentage: 65,
        description: 'React Native and Flutter apps for iOS and Android platforms.',
        color: '#FF6B6B',
        projects: 10
    },
    {
        id: 'p6',
        category: 'DevOps & Cloud',
        icon: '☁️',
        percentage: 58,
        description: 'CI/CD pipelines, Docker, Kubernetes, and AWS infrastructure.',
        color: '#FF8C42',
        projects: 8
    },
    {
        id: 'p7',
        category: 'AI & ML Research',
        icon: '🤖',
        percentage: 45,
        description: 'Machine learning models, NLP pipelines, and AI integrations.',
        color: '#A29BFE',
        projects: 5
    },
    {
        id: 'p8',
        category: 'Quality Assurance',
        icon: '🔍',
        percentage: 80,
        description: 'Testing frameworks, automated QA, and code quality audits.',
        color: '#55EFC4',
        projects: 20
    }
];

function getProgressData() {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PROGRESS;
}

function getLevel(pct) {
    if (pct >= 80) return { label: 'Expert', stars: '★★★★★' };
    if (pct >= 60) return { label: 'Advanced', stars: '★★★★☆' };
    if (pct >= 40) return { label: 'Intermediate', stars: '★★★☆☆' };
    return { label: 'Growing', stars: '★★☆☆☆' };
}

function renderProgressBar(item) {
    const level = getLevel(item.percentage);
    return `
    <div class="pgraph-item reveal">
        <div class="pgraph-item-header">
            <div class="pgraph-item-left">
                <div class="pgraph-icon" style="background:${item.color}22;border-color:${item.color}44;">
                    ${item.icon}
                </div>
                <div>
                    <div class="pgraph-cat">${item.category}</div>
                    <div class="pgraph-desc">${item.description}</div>
                </div>
            </div>
            <div class="pgraph-item-right">
                <div class="pgraph-pct" style="color:${item.color};">${item.percentage}<span style="font-size:.8em;opacity:.7;">%</span></div>
                <div class="pgraph-level" style="color:${item.color}88;">${level.stars} ${level.label}</div>
            </div>
        </div>
        <div class="pgraph-bar-bg">
            <div class="pgraph-bar" data-width="${item.percentage}" 
                 style="background:linear-gradient(90deg,${item.color}aa,${item.color});width:0%;">
                <div class="pgraph-bar-shine"></div>
            </div>
        </div>
        <div class="pgraph-meta">
            <span>📁 ${item.projects} Projects</span>
            <span style="color:${item.color};">${item.percentage}% Complete</span>
        </div>
    </div>`;
}

function renderDonut(data) {
    const total = data.reduce((s, d) => s + d.percentage, 0);
    const avg = Math.round(total / data.length);
    let offset = 0;
    const r = 90, cx = 110, cy = 110;
    const circumference = 2 * Math.PI * r;

    const slices = data.map(item => {
        const pct = item.percentage / 100;
        const length = circumference * pct;
        const gap = circumference * (1 - pct);
        const dash = `${length} ${gap}`;
        const sl = `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${item.color}" stroke-width="18"
            stroke-dasharray="${dash}"
            stroke-dashoffset="${(-circumference * offset)}"
            style="transition:stroke-dashoffset 1s ease;opacity:.85;"
            class="donut-slice">
        </circle>`;
        offset += pct;
        return sl;
    }).join('');

    return `
    <div class="pgraph-donut-wrap">
        <div class="pgraph-donut-chart">
            <svg viewBox="0 0 220 220" width="220" height="220">
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="18"/>
                ${slices}
            </svg>
            <div class="pgraph-donut-center">
                <div class="pgraph-donut-avg">${avg}<span>%</span></div>
                <div class="pgraph-donut-lbl">Avg Progress</div>
            </div>
        </div>
        <div class="pgraph-donut-legend">
            ${data.map(d => `
            <div class="pgraph-legend-row">
                <span class="pgraph-legend-dot" style="background:${d.color};"></span>
                <span class="pgraph-legend-name">${d.icon} ${d.category}</span>
                <span class="pgraph-legend-val" style="color:${d.color};">${d.percentage}%</span>
            </div>`).join('')}
        </div>
    </div>`;
}

function animateBars(container) {
    container.querySelectorAll('.pgraph-bar').forEach(bar => {
        const target = parseInt(bar.dataset.width, 10);
        let current = 0;
        const animate = () => {
            if (current < target) {
                current = Math.min(current + 2, target);
                bar.style.width = current + '%';
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    });
}

export function initProgressGraph() {
    const section = document.getElementById('progress-graph');
    if (!section) return;

    const data = getProgressData();

    section.innerHTML = `
    <div class="container">
        <div class="section-header reveal">
            <span class="section-label">Transparency</span>
            <h2 class="section-title">Progress <span class="gradient-text">Dashboard</span></h2>
            <p class="section-desc">Real-time view of our team's progress across all departments — from design to deployment.</p>
        </div>

        <!-- Donut Chart + Bars layout -->
        <div class="pgraph-layout">
            <!-- Left: Donut -->
            <div class="pgraph-donut-side reveal">
                ${renderDonut(data)}
            </div>

            <!-- Right: Bars -->
            <div class="pgraph-bars-side">
                ${data.map(renderProgressBar).join('')}
            </div>
        </div>
    </div>`;

    // Animate bars when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => animateBars(section), 300);
                observer.disconnect();
            }
        });
    }, { threshold: 0.2 });

    observer.observe(section);
}

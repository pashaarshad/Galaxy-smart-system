/**
 * GALAXY SMART SYSTEM – techstack.js v2
 * Enhanced dual-row auto-scrolling tech slider
 */
import { getTech } from '../firebase/firestore.js';

const TECH_ROW1 = [
  { icon: '⚛️', name: 'React', desc: 'UI Component Library' },
  { icon: '🟩', name: 'Node.js', desc: 'Backend Runtime' },
  { icon: '🐍', name: 'Python', desc: 'Data & AI Language' },
  { icon: '🌊', name: 'Next.js', desc: 'Full-Stack Framework' },
  { icon: '🎯', name: 'TypeScript', desc: 'Type-Safe JavaScript' },
  { icon: '🍃', name: 'MongoDB', desc: 'NoSQL Database' },
  { icon: '🐘', name: 'PostgreSQL', desc: 'Relational Database' },
  { icon: '☁️', name: 'AWS', desc: 'Cloud Platform' },
  { icon: '🐳', name: 'Docker', desc: 'Containerization' },
  { icon: '⚙️', name: 'Kubernetes', desc: 'Container Orchestration' },
  { icon: '🔥', name: 'Firebase', desc: 'BaaS Platform' },
  { icon: '💜', name: 'Flutter', desc: 'Cross-Platform Mobile' },
];

const TECH_ROW2 = [
  { icon: '🤖', name: 'TensorFlow', desc: 'Machine Learning' },
  { icon: '🦀', name: 'Rust', desc: 'Systems Programming' },
  { icon: '🟦', name: 'Vue.js', desc: 'Progressive Framework' },
  { icon: '💛', name: 'JavaScript', desc: 'Core Web Language' },
  { icon: '🎨', name: 'Figma', desc: 'UI/UX Design Tool' },
  { icon: '🐙', name: 'GitHub', desc: 'Version Control' },
  { icon: '🔵', name: 'GraphQL', desc: 'API Query Language' },
  { icon: '⚡', name: 'Vite', desc: 'Build Tool' },
  { icon: '🟧', name: 'Redis', desc: 'In-Memory Cache' },
  { icon: '🌀', name: 'Tailwind', desc: 'Utility CSS Framework' },
  { icon: '🟣', name: 'Kafka', desc: 'Event Streaming' },
  { icon: '🔐', name: 'JWT', desc: 'Auth Standard' },
];

function buildCard(t) {
  return `
    <div class="tech-card" title="${t.desc}">
      <span class="tech-logo">${t.icon}</span>
      <span class="tech-name">${t.name}</span>
      <div class="tech-tooltip">${t.desc}</div>
    </div>
  `;
}

export function initTechStack() {
  const section = document.getElementById('tech');
  if (!section) return;

  const render = (row1, row2) => {
    const row1Cards = row1.map(buildCard).join('');
    const row2Cards = row2.map(buildCard).join('');

    section.innerHTML = `
    <div class="container">
      <div class="section-header reveal">
        <span class="section-label">Technology Ecosystem</span>
        <h2 class="section-title">Tools We Master</h2>
        <p class="section-desc">A curated arsenal of battle-tested modern technologies we wield to build world-class solutions.</p>
      </div>
    </div>

    <div class="tech-slider-wrap" style="margin-bottom:16px;">
      <div class="tech-slider">${row1Cards + row1Cards}</div>
    </div>

    <div class="tech-slider-wrap">
      <div class="tech-slider reverse">${row2Cards + row2Cards}</div>
    </div>
  `;
  };

  getTech()
    .then((tech) => {
      const list = Array.isArray(tech) ? tech : [];
      const mapped = list.map((item) => ({
        icon: item.icon || item.logo || '💡',
        name: item.name || 'Tech',
        desc: item.desc || item.description || ''
      }));
      const finalList = mapped.length ? mapped : [];
      if (!finalList.length) {
        render(TECH_ROW1, TECH_ROW2);
        return;
      }
      const half = Math.ceil(finalList.length / 2);
      render(finalList.slice(0, half), finalList.slice(half));
    })
    .catch(() => render(TECH_ROW1, TECH_ROW2));
}

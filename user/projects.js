/**
 * GALAXY SMART SYSTEM – projects.js
 * User-side portfolio: Fetches and renders featured projects from API
 */

import { openModal } from '../assets/js/animations.js';
import { watchProjects } from '../firebase/firestore.js';

let projectsList = [];

const FALLBACK_PROJECT_IMAGES = [
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', // Analytics Dashboard
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80', // Mobile Banking App
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', // Web Development Platform
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', // Cybersecurity Dashboard
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', // Cloud Infrastructure Network
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'  // General SaaS Web App
];

function getProjectImage(p, idx) {
  if (p.image && (p.image.startsWith('http') || p.image.startsWith('.') || p.image.startsWith('/'))) {
    return p.image;
  }
  
  const titleLower = (p.title || '').toLowerCase();
  if (titleLower.includes('dashboard') || titleLower.includes('analytics') || titleLower.includes('data')) {
    return FALLBACK_PROJECT_IMAGES[0];
  } else if (titleLower.includes('mobile') || titleLower.includes('app') || titleLower.includes('bank')) {
    return FALLBACK_PROJECT_IMAGES[1];
  } else if (titleLower.includes('web') || titleLower.includes('platform') || titleLower.includes('site')) {
    return FALLBACK_PROJECT_IMAGES[2];
  } else if (titleLower.includes('cyber') || titleLower.includes('security') || titleLower.includes('auth')) {
    return FALLBACK_PROJECT_IMAGES[3];
  } else if (titleLower.includes('cloud') || titleLower.includes('aws') || titleLower.includes('devops')) {
    return FALLBACK_PROJECT_IMAGES[4];
  }
  
  return FALLBACK_PROJECT_IMAGES[idx % FALLBACK_PROJECT_IMAGES.length];
}

function buildCard(p, idx) {
  const tags = (p.techStack || p.tech || []).map(t => `<span class="project-tag">${t}</span>`).join('');
  const imgUrl = getProjectImage(p, idx);
  return `
    <div class="project-card reveal" style="--delay:${(idx % 3) * 0.15}s">
      <div class="project-img">
        <div class="project-img-inner"><img src="${imgUrl}" alt="${p.title}" loading="lazy"></div>
        <div class="project-overlay">
          <div class="project-overlay-text">View Details →</div>
        </div>
      </div>
      <div class="project-body">
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.description}</p>
        <div class="project-tags">${tags}</div>
        <div class="project-footer">
          <button class="btn btn-outline btn-sm" data-proj-id="${p.id}">View Details</button>
          ${p.link ? `<a href="${p.link}" target="_blank" style="font-size:.78rem;color:var(--accent-blue);">↗ Live</a>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderProjects(section, projects) {
    const grid = section.querySelector('.projects-grid');
    if (!grid) return;

    if (projects.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted);">No projects found in the portfolio.</div>`;
        return;
    }

    grid.innerHTML = projects.map((p, i) => buildCard(p, i)).join('');

    // Re-attach modal listeners
    section.querySelectorAll('[data-proj-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = projects.find(x => x.id === btn.dataset.projId) || {};
            const techTags = (p.techStack || p.tech || []).map(t => `<span class="project-tag">${t}</span>`).join('');
            openModal(
                `${p.emoji || '🚀'} ${p.title}`,
                `
                <p style="color:var(--text-secondary);line-height:1.95;margin-bottom:24px;">${p.fullDesc || p.description}</p>
                <div style="margin-bottom:20px;">
                    <div style="font-size:.72rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;">Tech Stack</div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;">${techTags}</div>
                </div>
                ${p.link ? `<a href="${p.link}" target="_blank" class="btn btn-primary btn-sm">Visit Live Project ↗</a>` : `<a href="#contact" class="btn btn-outline btn-sm">Build Something Similar →</a>`}
                `
            );
        });
    });
}

export function initProjects() {
  const section = document.getElementById('projects');
  if (!section) return;

  // Set up the static shell once
  section.innerHTML = `
    <div class="container">
      <div class="section-header">
        <span class="section-label">Our Work</span>
        <h2 class="section-title reveal">Featured Projects</h2>
        <p class="section-desc reveal delay-1">Real solutions. Measurable impact. Explore some of our most impactful digital products built for clients worldwide.</p>
      </div>
      <div class="projects-grid">
         <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted);">Loading portfolio...</div>
      </div>
    </div>
  `;

  watchProjects(
    (projects) => {
      projectsList = projects || [];
      renderProjects(section, projectsList);
    },
    (error) => {
      const grid = section.querySelector('.projects-grid');
      if (grid) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#ff8c8c;">Failed to load projects: ${error.message}</div>`;
      }
    }
  );
}

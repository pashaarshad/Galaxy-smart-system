/**
 * GALAXY SMART SYSTEM – projects.js
 * User-side portfolio: Fetches and renders featured projects from API
 */

import { openModal } from '../assets/js/animations.js';
import { watchProjects } from '../firebase/firestore.js';

let projectsList = [];

function buildCard(p, idx) {
  const tags = (p.techStack || p.tech || []).map(t => `<span class="project-tag">${t}</span>`).join('');
  return `
    <div class="project-card reveal" style="--delay:${(idx % 3) * 0.15}s">
      <div class="project-img">
        <div class="project-img-inner">${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy">` : (p.emoji || '🚀')}</div>
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

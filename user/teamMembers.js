/**
 * GALAXY SMART SYSTEM – teamMembers.js
 * Public Team section — Firebase live cards
 */

import { watchTeamMembers } from '../firebase/firestore.js';
import { observeRevealElements } from '../assets/js/animations.js';

export function renderTeamMemberCard(member, options = {}) {
  const m = member || {};
  const theme = m.cardTheme || {};
  const layout = theme.layout || 'tech';
  const skills = (m.skills || []).slice(0, 5);
  const stats = (m.stats || []).slice(0, 3);
  const previewClass = options.preview ? ' team-card-preview' : '';
  const delay = options.delay != null ? ` style="animation-delay:${options.delay}s;--team-accent:${theme.accentColor};--team-secondary:${theme.secondaryColor};--team-gradient:${theme.gradient};--team-border:${theme.borderColor};--team-glow:${theme.glowColor};"` : ` style="--team-accent:${theme.accentColor};--team-secondary:${theme.secondaryColor};--team-gradient:${theme.gradient};--team-border:${theme.borderColor};--team-glow:${theme.glowColor};"`;

  const skillsHtml = skills.length
    ? `<div class="team-card-skills">${skills.map((s) => `<span class="team-skill-chip">${s}</span>`).join('')}</div>`
    : '';

  const statsHtml = stats.length
    ? `<div class="team-card-stats">${stats.map((s) => `
        <div class="team-stat">
          <span class="team-stat-val">${s.value}</span>
          <span class="team-stat-lbl">${s.label}</span>
        </div>`).join('')}</div>`
    : '';

  const contactHtml = (m.email || m.phone || m.linkedin)
    ? `<div class="team-card-contact">
        ${m.email ? `<span>✉ ${m.email}</span>` : ''}
        ${m.phone ? `<span>📞 ${m.phone}</span>` : ''}
        ${m.linkedin ? `<span>🔗 ${m.linkedin}</span>` : ''}
      </div>`
    : '';

  return `
    <article class="team-card team-layout-${layout} reveal${previewClass}"${delay}>
      <div class="team-card-accent"></div>
      <div class="team-card-header">
        <div class="team-avatar">${m.avatar || '👤'}</div>
        <div class="team-card-meta">
          <span class="team-role-badge">${m.roleLabel || 'Team'}</span>
          <h3 class="team-card-name">${m.name || 'Team Member'}</h3>
          <p class="team-card-title">${m.title || ''}</p>
        </div>
      </div>
      ${m.tagline ? `<p class="team-card-tagline">"${m.tagline}"</p>` : ''}
      ${m.highlight ? `<div class="team-card-highlight">${m.highlight}</div>` : ''}
      ${m.bio ? `<p class="team-card-bio">${m.bio}</p>` : ''}
      ${statsHtml}
      ${skillsHtml}
      ${contactHtml}
    </article>`;
}

export function initTeamMembers() {
  const section = document.getElementById('team');
  if (!section) return;

  section.innerHTML = `
    <div class="container">
      <div class="team-section-head reveal">
        <span class="section-label">Our Team</span>
        <h2 class="section-title">Meet The Galaxy Crew</h2>
        <p class="section-desc">The people behind every product — leaders, builders, and creators working together.</p>
      </div>
      <div id="team-grid" class="team-grid">
        <div class="team-loading">Loading team...</div>
      </div>
    </div>
  `;

  const grid = document.getElementById('team-grid');

  watchTeamMembers(
    (members) => {
      const active = members.filter((m) => m.active !== false).sort((a, b) => a.order - b.order);
      if (!active.length) {
        grid.innerHTML = `<div class="team-empty">Team profiles coming soon.</div>`;
        return;
      }
      grid.innerHTML = active.map((m, i) => renderTeamMemberCard(m, { delay: i * 0.08 })).join('');
      observeRevealElements(grid);
      requestAnimationFrame(() => {
        grid.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
      });
    },
    (err) => {
      console.error('Team members load failed:', err);
      grid.innerHTML = `<div class="team-empty">Unable to load team members. Please refresh.</div>`;
    }
  );
}

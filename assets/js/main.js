/**
 * GALAXY SMART SYSTEM – main.js v2
 * Entry point with all enhancements
 */

import {
    initCursor,
    initPreloader,
    initScrollProgress,
    initNavbar,
    initThemeToggle,
    initParticles,
    initTyping,
    initScrollReveal,
    initCounters,
    initTilt
} from './animations.js';

import { initAbout } from '../../user/about.js';
import { initTeamMembers } from '../../user/teamMembers.js';
import { initServices } from '../../user/services.js';
import { initTechStack } from '../../user/techstack.js';
import { initProjects } from '../../user/projects.js';
import { initProjectStatus } from '../../user/projectStatus.js';
// progressGraph section is now inside the modal — no longer rendered as a standalone section
// import { initProgressGraph } from '../../user/progressGraph.js';
import { initContact } from '../../user/contact.js';
import { initMobileNative } from './mobile-native.js';

async function bootstrap() {
    // Cursor & preloader (immediate)
    try { initCursor(); } catch (e) { console.error('Cursor init failed:', e); }
    try { initThemeToggle(); } catch (e) { console.error('ThemeToggle init failed:', e); }
    try { initPreloader(); } catch (e) { console.error('Preloader init failed:', e); }
    try { initScrollProgress(); } catch (e) { console.error('ScrollProgress init failed:', e); }
    try { initNavbar(); } catch (e) { console.error('Navbar init failed:', e); }
    try { initParticles(); } catch (e) { console.error('Particles init failed:', e); }
    try { initTyping(); } catch (e) { console.error('Typing init failed:', e); }

    // Section renderers
    try { initAbout(); } catch (e) { console.error('About init failed:', e); }
    try { initTeamMembers(); } catch (e) { console.error('Team init failed:', e); }
    try { initServices(); } catch (e) { console.error('Services init failed:', e); }
    try { initTechStack(); } catch (e) { console.error('TechStack init failed:', e); }
    
    try {
        await initProjects();
    } catch (e) {
        console.error('Projects init failed:', e);
    }
    
    try { initProjectStatus(); } catch (e) { console.error('ProjectStatus init failed:', e); }
    try { initContact(); } catch (e) { console.error('Contact init failed:', e); }
    try { initMobileNative(); } catch (e) { console.error('MobileNative init failed:', e); }

    // After DOM is settled
    requestAnimationFrame(() => {
        try { initScrollReveal(); } catch (e) { console.error('ScrollReveal init failed:', e); }
        try { initCounters(); } catch (e) { console.error('Counters init failed:', e); }
        try { initTilt(); } catch (e) { console.error('Tilt init failed:', e); }
    });
}

bootstrap();

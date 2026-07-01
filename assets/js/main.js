/**
 * GALAXY SMART SYSTEM – main.js v2
 * Entry point with all enhancements
 */

import {
    initCursor,
    initPreloader,
    initScrollProgress,
    initNavbar,
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
    initCursor();
    initPreloader();
    initScrollProgress();
    initNavbar();
    initParticles();
    initTyping();

    // Section renderers
    initAbout();
    initTeamMembers();
    initServices();
    initTechStack();
    await initProjects();
    initProjectStatus();
    // initProgressGraph();  // content moved to modal
    initContact();
    initMobileNative();

    // After DOM is settled
    requestAnimationFrame(() => {
        initScrollReveal();
        initCounters();
        initTilt();
    });
}

bootstrap();

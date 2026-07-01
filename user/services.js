/**
 * GALAXY SMART SYSTEM – services.js v2
 * Enhanced with numbered cards, gradient border, rich modals
 */

import { openModal } from '../assets/js/animations.js';

const SERVICES = [
  {
    icon: `<svg class="svc-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    title: 'Web Development',
    short: 'Custom, scalable web applications built with modern frameworks and cutting-edge technologies.',
    details: `We craft high-performance, fully responsive web applications tailored to your unique business needs. Our stack includes React, Next.js, Vue.js, and more — combined with rock-solid backend architectures using Node.js, Python, and cloud-native solutions. From MVPs to enterprise platforms, we deliver world-class digital products that scale.`
  },
  {
    icon: `<svg class="svc-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    title: 'Mobile Applications',
    short: 'Native and cross-platform mobile apps that deliver seamless user experiences across all devices.',
    details: `From iOS to Android and cross-platform solutions using React Native and Flutter, we build mobile-first experiences that users love. Our mobile apps are performance-optimized, beautifully designed, and deeply integrated with backend systems and third-party APIs.`
  },
  {
    icon: `<svg class="svc-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v12"/><path d="M8 10h8"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/></svg>`,
    title: 'AI & Automation',
    short: 'Intelligent automation solutions, machine learning models, and AI-powered business tools.',
    details: `We integrate artificial intelligence into your workflows — from NLP chatbots to computer vision, recommendation engines, and predictive analytics. Our automation solutions eliminate repetitive processes and unlock new levels of operational efficiency.`
  },
  {
    icon: `<svg class="svc-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
    title: 'Cloud Solutions',
    short: 'Robust cloud infrastructure, DevOps pipelines, and scalable deployment architectures.',
    details: `Whether migrating to the cloud or building cloud-native, we architect AWS, Azure, and GCP environments that are secure, scalable, and cost-efficient. Our DevOps expertise covers CI/CD pipelines, containerization with Docker/Kubernetes, and infrastructure-as-code.`
  },
  {
    icon: `<svg class="svc-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    title: 'Cybersecurity',
    short: 'End-to-end security solutions to protect your digital assets, data, and systems at scale.',
    details: `Security is embedded into everything we build. Our practice covers penetration testing, security audits, OWASP compliance, data encryption, identity management, and real-time threat monitoring. We ensure your systems are battle-hardened against modern threats.`
  },
  {
    icon: `<svg class="svc-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    title: 'Data & Analytics',
    short: 'Transform raw data into actionable insights with custom dashboards and analytics platforms.',
    details: `We build end-to-end data pipelines, warehouses, and visualization dashboards that turn raw business data into strategic insight. Using Apache Kafka, Spark, Tableau, and custom BI solutions, we help you make data-driven decisions with unprecedented confidence.`
  }
];

export function initServices() {
  const section = document.getElementById('services');
  if (!section) return;

  const cards = SERVICES.map((s, i) => `
    <div class="service-card reveal delay-${(i % 3) + 1}">
      <div class="service-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="service-icon">${s.icon}</div>
      <h3 class="service-title">${s.title}</h3>
      <p class="service-desc">${s.short}</p>
      <button
        class="btn btn-outline btn-sm"
        data-service-idx="${i}"
        id="svc-btn-${i}"
        style="margin-top:auto;"
      >Learn More →</button>
    </div>
  `).join('');

  section.innerHTML = `
    <div class="orb" style="width:500px;height:500px;background:rgba(122,95,255,0.06);bottom:-150px;left:-100px;filter:blur(90px);pointer-events:none;" aria-hidden="true"></div>
    <div class="container" style="position:relative;z-index:1;">
      <div class="section-header">
        <span class="section-label">What We Do</span>
        <h2 class="section-title reveal">Our Core Services</h2>
        <p class="section-desc reveal delay-1">Comprehensive technology solutions engineered to deliver measurable, real-world results for modern businesses.</p>
      </div>
      <div class="services-grid">${cards}</div>
    </div>
  `;

  section.querySelectorAll('[data-service-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const svc = SERVICES[+btn.dataset.serviceIdx];
      openModal(
        `${svc.icon} ${svc.title}`,
        `
          <p style="color:var(--text-secondary);line-height:1.9;margin-bottom:20px;">${svc.details}</p>
          <a href="#contact" class="btn btn-primary btn-sm">Get a Free Consultation →</a>
        `
      );
    });
  });
}

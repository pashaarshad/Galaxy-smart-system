/**
 * GALAXY SMART SYSTEM – services.js v2
 * Enhanced with numbered cards, gradient border, rich modals
 */

import { openModal } from '../assets/js/animations.js';

const SERVICES = [
  {
    icon: '🌐',
    title: 'Web Development',
    short: 'Custom, scalable web applications built with modern frameworks and cutting-edge technologies.',
    details: `We craft high-performance, fully responsive web applications tailored to your unique business needs. Our stack includes React, Next.js, Vue.js, and more — combined with rock-solid backend architectures using Node.js, Python, and cloud-native solutions. From MVPs to enterprise platforms, we deliver world-class digital products that scale.`
  },
  {
    icon: '📱',
    title: 'Mobile Applications',
    short: 'Native and cross-platform mobile apps that deliver seamless user experiences across all devices.',
    details: `From iOS to Android and cross-platform solutions using React Native and Flutter, we build mobile-first experiences that users love. Our mobile apps are performance-optimized, beautifully designed, and deeply integrated with backend systems and third-party APIs.`
  },
  {
    icon: '🤖',
    title: 'AI & Automation',
    short: 'Intelligent automation solutions, machine learning models, and AI-powered business tools.',
    details: `We integrate artificial intelligence into your workflows — from NLP chatbots to computer vision, recommendation engines, and predictive analytics. Our automation solutions eliminate repetitive processes and unlock new levels of operational efficiency.`
  },
  {
    icon: '☁️',
    title: 'Cloud Solutions',
    short: 'Robust cloud infrastructure, DevOps pipelines, and scalable deployment architectures.',
    details: `Whether migrating to the cloud or building cloud-native, we architect AWS, Azure, and GCP environments that are secure, scalable, and cost-efficient. Our DevOps expertise covers CI/CD pipelines, containerization with Docker/Kubernetes, and infrastructure-as-code.`
  },
  {
    icon: '🔐',
    title: 'Cybersecurity',
    short: 'End-to-end security solutions to protect your digital assets, data, and systems at scale.',
    details: `Security is embedded into everything we build. Our practice covers penetration testing, security audits, OWASP compliance, data encryption, identity management, and real-time threat monitoring. We ensure your systems are battle-hardened against modern threats.`
  },
  {
    icon: '📊',
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

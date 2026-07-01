/**
 * GALAXY SMART SYSTEM – about.js v2
 * Enhanced About section with orbit animation
 */

const ABOUT_DATA = {
  heading: 'Crafting Tomorrow\'s Technology, Today.',
  description: `Galaxy Smart System is a forward-thinking technology company dedicated to delivering world-class digital solutions. We architect intelligent systems that empower businesses, elevate user experiences, and define the digital frontier.`,
  detail: `Founded on the principles of innovation and excellence, our team of expert engineers, designers, and strategists collaborate to craft premium digital products — from scalable web platforms to intelligent AI-powered applications.`,
  mission: 'To engineer intelligent, future-ready digital products that transform the way businesses operate and grow in the modern world.',
  vision: 'To be the most trusted technology partner for forward-thinking organizations across the globe — setting the benchmark for quality, innovation, and impact.',
  yearsActive: '5+',
  yearsLabel: 'Years of Excellence'
};

export function initAbout() {
  const section = document.getElementById('about');
  if (!section) return;

  section.innerHTML = `
    <div class="orb" style="width:400px;height:400px;background:rgba(0,194,255,0.06);top:-100px;right:-150px;filter:blur(80px);pointer-events:none;" aria-hidden="true"></div>
    <div class="container" style="position:relative;z-index:1;">
      <div class="about-grid">

        <div class="about-visual reveal-left">
          <div class="about-img-box">
            <div class="about-img-orbit"><div class="orbit-dot"></div></div>
            <div class="float-anim" style="font-size:5.5rem;z-index:1;position:relative;">🌌</div>
          </div>
          <div class="about-float-badge glow-animated">
            <div class="number">${ABOUT_DATA.yearsActive}</div>
            <div class="label">${ABOUT_DATA.yearsLabel}</div>
          </div>
        </div>

        <div class="about-text reveal-right">
          <span class="section-label">Who We Are</span>
          <h2 class="section-title">${ABOUT_DATA.heading}</h2>
          <p class="section-desc">${ABOUT_DATA.description}</p>
          <p class="section-desc" style="margin-top:14px;opacity:0.85;">${ABOUT_DATA.detail}</p>

          <div class="about-mvp">
            <div class="mvp-card reveal delay-1">
              <h4>🎯 Mission</h4>
              <p>${ABOUT_DATA.mission}</p>
            </div>
            <div class="mvp-card reveal delay-2">
              <h4>🚀 Vision</h4>
              <p>${ABOUT_DATA.vision}</p>
            </div>
          </div>

          <div style="margin-top:30px;">
            <a href="#contact" class="btn btn-primary">Work With Us →</a>
          </div>
        </div>

      </div>
    </div>
  `;
}

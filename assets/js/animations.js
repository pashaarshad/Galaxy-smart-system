/**
 * GALAXY SMART SYSTEM – animations.js v2
 * Custom Cursor · Preloader · Particle Canvas · Typing
 * Counters · Scroll Reveal · Navbar · Toast · Modal · Tilt
 */

// ─── Custom Cursor ────────────────────────────
export function initCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  // Lag ring
  (function animateRing() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animateRing);
  })();

  // Hover effect on interactive elements
  const hoverTargets = 'a, button, [data-service-idx], [data-proj-id], [data-edit], [data-delete], .tech-card';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverTargets)) ring.classList.add('hovered');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverTargets)) ring.classList.remove('hovered');
  });
}

// ─── Preloader ────────────────────────────────
export function initPreloader() {
  const preloader = document.getElementById('preloader');
  const bar = document.getElementById('preloader-bar');
  const text = document.getElementById('preloader-text');
  if (!preloader) return;

  const steps = ['Initializing...', 'Loading assets...', 'Rendering universe...', 'Almost there...', 'Ready 🚀'];
  let progress = 0;
  let stepIdx = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 18 + 5;
    progress = Math.min(progress, 100);
    if (bar) bar.style.width = progress + '%';

    const sIdx = Math.floor((progress / 100) * (steps.length - 1));
    if (sIdx !== stepIdx && text) {
      stepIdx = sIdx;
      text.textContent = steps[stepIdx];
    }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.style.overflow = '';
      }, 400);
    }
  }, 80);

  document.body.style.overflow = 'hidden';
}

// ─── Scroll Progress Bar ─────────────────────
export function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const st = window.scrollY;
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (dh > 0 ? (st / dh) * 100 : 0) + '%';
  }, { passive: true });
}

// ─── Navbar ───────────────────────────────────
export function initNavbar() {
  const nav = document.getElementById('navbar');
  const btt = document.getElementById('back-to-top');
  const ham = document.getElementById('hamburger');
  const mob = document.getElementById('mobile-nav');

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 50;
    nav?.classList.toggle('scrolled', scrolled);
    btt?.classList.toggle('visible', scrolled);
  }, { passive: true });

  ham?.addEventListener('click', () => {
    ham.classList.toggle('active');
    mob?.classList.toggle('open');
    ham.setAttribute('aria-expanded', ham.classList.contains('active'));
  });

  mob?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      ham?.classList.remove('active');
      mob?.classList.remove('open');
    });
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Active section
  const sections = document.querySelectorAll('section[id]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.nav-links a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));

  btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ─── Theme Toggle ──────────────────────────────
export function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    console.error('Theme toggle button not found in DOM');
    return;
  }

  const sunIcon = toggle.querySelector('.theme-icon-sun');
  const moonIcon = toggle.querySelector('.theme-icon-moon');

  function updateIcons(isDark) {
    if (sunIcon && moonIcon) {
      sunIcon.style.setProperty('display', isDark ? 'block' : 'none', 'important');
      moonIcon.style.setProperty('display', isDark ? 'none' : 'block', 'important');
    }
  }

  // Load saved theme or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

  console.log('Initializing theme toggle. Saved:', savedTheme, 'System prefers dark:', systemPrefersDark, 'Applying dark theme:', isDark);

  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  updateIcons(isDark);

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Theme toggle button clicked');
    document.body.classList.toggle('dark-theme');
    const currentlyDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', currentlyDark ? 'dark' : 'light');
    updateIcons(currentlyDark);
    window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: currentlyDark ? 'dark' : 'light' } }));
    console.log('Theme toggled. New state is dark:', currentlyDark);
  });
}

// ─── Scroll Reveal ────────────────────────────
let revealObserver = null;

export function observeRevealElements(root = document) {
  const scope = root?.querySelectorAll ? root : document;
  const targets = scope.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  if (!window.IntersectionObserver) {
    targets.forEach((el) => el.classList.add('visible'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.02, rootMargin: '0px 0px -20px 0px' });
  }

  targets.forEach((el) => {
    if (!el.classList.contains('visible')) revealObserver.observe(el);
  });
}

export function initScrollReveal() {
  observeRevealElements(document);

  // Global safety fallback: force reveal everything after 2.5 seconds in case scroll / observer fails
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
        .forEach((el) => el.classList.add('visible'));
    }, 2500);
  });
}

// ─── Typing Animation ─────────────────────────
export function initTyping() {
  const el = document.getElementById('hero-typing');
  if (!el) return;

  const phrases = [
    'Building Future Technology.',
    'Premium Digital Solutions.',
    'Smart Systems. Global Standards.',
    'Innovation × Performance × Trust.',
    'Engineered for Excellence.'
  ];

  let pIdx = 0, cIdx = 0, isDeleting = false;

  function tick() {
    const current = phrases[pIdx];
    el.textContent = isDeleting
      ? current.substring(0, cIdx - 1)
      : current.substring(0, cIdx + 1);

    isDeleting ? cIdx-- : cIdx++;

    let delay = isDeleting ? 42 : 78;

    if (!isDeleting && cIdx === current.length) {
      delay = 2200;
      isDeleting = true;
    } else if (isDeleting && cIdx === 0) {
      isDeleting = false;
      pIdx = (pIdx + 1) % phrases.length;
      delay = 350;
    }

    setTimeout(tick, delay);
  }
  tick();
}

// ─── Animated Counters ────────────────────────
export function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el = e.target;
      const target = +el.getAttribute('data-count');
      const suffix = el.getAttribute('data-suffix') || '';
      const dur = 2200;
      const inc = target / (dur / 16);
      let current = 0;

      const step = () => {
        current = Math.min(current + inc, target);
        el.textContent = Math.floor(current) + suffix;
        if (current < target) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });

  counters.forEach(c => obs.observe(c));
}

// ─── Particle Canvas ──────────────────────────
export function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function createParticle(y = null) {
    return {
      x: Math.random() * W,
      y: y !== null ? y : Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: -(Math.random() * 0.45 + 0.15),
      opacity: Math.random() * 0.45 + 0.25, // increased opacity for light theme contrast
      color: Math.random() > 0.6 ? '37,99,235' : Math.random() > 0.3 ? '124,58,237' : '13,148,136' // Blue, Violet, Teal (slate-matching palette)
    };
  }

  for (let i = 0; i < 90; i++) particles.push(createParticle());

  // Mouse parallax
  let mouseX = W / 2, mouseY = H / 2;
  canvas.addEventListener('mousemove', e => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
  }, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      // Subtle parallax
      const px = p.x + (mouseX - W / 2) * 0.008;
      const py = p.y + (mouseY - H / 2) * 0.008;

      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.y < -5 || p.x < -5 || p.x > W + 5) {
        Object.assign(p, createParticle(H + 5));
      }
    });

    // Connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 95) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(37,99,235,${0.12 * (1 - d / 95)})`; // Increased opacity connection line for light mode
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
}

// ─── Toast ───────────────────────────────────
export function showToast(message, type = 'success', duration = 4500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icon = type === 'success' ? '✅' : '❌';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-out 0.35s ease forwards';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ─── Modal ───────────────────────────────────
export function openModal(title, bodyHTML) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" id="modal-close-btn" aria-label="Close">✕</button>
      <h3 class="modal-title">${title}</h3>
      <div class="modal-body">${bodyHTML}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 250);
  };

  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  // ESC key
  const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);
}

// ─── Card Tilt Effect ─────────────────────────
export function initTilt() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -6;
      const rotY = ((x - cx) / cx) * 6;
      card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-10px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, border-color 0.35s, box-shadow 0.35s';
    });
  });
}

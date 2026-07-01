/**
 * GALAXY SMART SYSTEM – mobile-native.js
 * Public site · Admin panel · User dashboard — mobile app UI
 */

const MOBILE_MQ = window.matchMedia('(max-width: 768px)');

/* ─── PUBLIC SITE ───────────────────────────── */
export function initMobileNative() {
  if (!document.getElementById('mob-tabbar')) return;

  const boot = () => {
    document.body.classList.toggle('mob-app-mode', MOBILE_MQ.matches);
    if (!MOBILE_MQ.matches) return;

    syncPublicAccountLinks();
    document.querySelectorAll('#team .reveal, #projects .reveal, #services .reveal').forEach((el) => {
      el.classList.add('visible');
    });
  };

  boot();
  MOBILE_MQ.addEventListener('change', boot);

  const tabs = document.querySelectorAll('#mob-tabbar .mob-tab[data-section]');

  syncPublicAccountLinks();

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const section = tab.dataset.section;
      if (section === 'account') return;
      const target = document.getElementById(section);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setPublicActiveTab(section);
      }
    });
  });

  ['hero', 'services', 'projects', 'project-status'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setPublicActiveTab(entry.target.id);
        });
      },
      { threshold: 0.35, rootMargin: '-80px 0px -120px 0px' }
    ).observe(el);
  });
}

function setPublicActiveTab(sectionId) {
  document.querySelectorAll('#mob-tabbar .mob-tab[data-section]').forEach((t) => {
    if (t.dataset.section === 'account') return;
    t.classList.toggle('active', t.dataset.section === sectionId);
  });
}

function syncPublicAccountLinks() {
  try {
    const s = JSON.parse(sessionStorage.getItem('gss_session') || '{}');
    const dashUrl = './user-dashboard/dashboard.html';
    const authUrl = './user-dashboard/auth.html';
    const headerBtn = document.getElementById('mob-header-account');
    const tabAccount = document.getElementById('mob-tab-account');
    if (s.loggedIn) {
      if (headerBtn) { headerBtn.href = dashUrl; headerBtn.title = s.name?.split(' ')[0] || 'Dashboard'; }
      if (tabAccount) {
        tabAccount.href = dashUrl;
        tabAccount.querySelector('.mob-tab-label').textContent = 'Dashboard';
        tabAccount.querySelector('.mob-tab-icon').textContent = '🏠';
      }
    } else {
      if (headerBtn) headerBtn.href = authUrl;
      if (tabAccount) tabAccount.href = authUrl;
    }
  } catch { /* ignore */ }
}

/* ─── ADMIN PANEL ───────────────────────────── */
export function mountAdminMobileTabbar(active = 'dashboard') {
  const setup = () => {
    if (!MOBILE_MQ.matches) {
      document.getElementById('mob-admin-tabbar')?.remove();
      document.body.classList.remove('mob-admin-app');
      return;
    }

    document.body.classList.add('mob-admin-app');
    let bar = document.getElementById('mob-admin-tabbar');

    if (!bar) {
      bar = document.createElement('nav');
      bar.id = 'mob-admin-tabbar';
      bar.className = 'mob-tabbar mob-admin-tabbar';
      bar.setAttribute('aria-label', 'Admin navigation');
      bar.innerHTML = `
        <a href="./dashboard.html" class="mob-tab" data-admin="dashboard">
          <span class="mob-tab-icon">📊</span><span class="mob-tab-label">Home</span>
        </a>
        <a href="./users.html" class="mob-tab" data-admin="users">
          <span class="mob-tab-icon">👥</span><span class="mob-tab-label">Users</span>
        </a>
        <a href="./projects.html" class="mob-tab" data-admin="projects">
          <span class="mob-tab-icon">📁</span><span class="mob-tab-label">Projects</span>
        </a>
        <a href="./orders.html" class="mob-tab" data-admin="orders">
          <span class="mob-tab-icon">🧾</span><span class="mob-tab-label">Orders</span>
        </a>
        <button type="button" class="mob-tab mob-tab-btn" id="mob-admin-more" aria-label="More menu">
          <span class="mob-tab-icon">☰</span><span class="mob-tab-label">More</span>
        </button>
      `;
      document.body.appendChild(bar);

      bar.querySelector('#mob-admin-more')?.addEventListener('click', () => {
        const sidebar = document.getElementById('admin-shell-sidebar');
        sidebar?.classList.toggle('open');
        document.getElementById('mob-admin-overlay')?.classList.toggle('show', sidebar?.classList.contains('open'));
      });

      if (!document.getElementById('mob-admin-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'mob-admin-overlay';
        overlay.className = 'mob-sidebar-overlay';
        overlay.addEventListener('click', () => {
          document.getElementById('admin-shell-sidebar')?.classList.remove('open');
          overlay.classList.remove('show');
        });
        document.body.appendChild(overlay);
      }
    }

    bar.querySelectorAll('[data-admin]').forEach((t) => {
      t.classList.toggle('active', t.dataset.admin === active);
    });
    bar.querySelector('#mob-admin-more')?.classList.remove('active');
  };

  setup();
  MOBILE_MQ.addEventListener('change', setup);
}

export function initAdminLoginMobile() {
  const apply = () => document.body.classList.toggle('mob-admin-login-app', MOBILE_MQ.matches);
  apply();
  MOBILE_MQ.addEventListener('change', apply);
}

/* ─── USER DASHBOARD ────────────────────────── */
export function initDashboardMobile() {
  const bar = document.getElementById('mob-dash-tabbar');
  if (!bar) return;

  const setup = () => {
    document.body.classList.toggle('mob-dash-app', MOBILE_MQ.matches);
    bar.style.display = MOBILE_MQ.matches ? 'flex' : 'none';
  };

  setup();

  bar.querySelectorAll('[data-panel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      if (panel === 'more') {
        document.getElementById('mob-dash-sheet')?.classList.add('open');
        return;
      }
      if (window.switchPanel) window.switchPanel(panel);
      setDashActiveTab(panel);
      document.getElementById('dashboard-sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('show');
      document.getElementById('mob-dash-sheet')?.classList.remove('open');
    });
  });

  document.getElementById('mob-dash-sheet-close')?.addEventListener('click', () => {
    document.getElementById('mob-dash-sheet')?.classList.remove('open');
  });

  document.getElementById('mob-dash-logout')?.addEventListener('click', () => {
    document.getElementById('logout-btn')?.click();
  });

  document.querySelectorAll('#mob-dash-sheet [data-panel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      if (window.switchPanel) window.switchPanel(panel);
      setDashActiveTab(panel);
      document.getElementById('mob-dash-sheet')?.classList.remove('open');
    });
  });

  const orig = window.switchPanel;
  if (typeof orig === 'function' && !orig._mobWrapped) {
    const wrapped = function (name) {
      orig(name);
      setDashActiveTab(name);
    };
    wrapped._mobWrapped = true;
    window.switchPanel = wrapped;
  }

  MOBILE_MQ.addEventListener('change', setup);
}

function setDashActiveTab(panel) {
  const mainTabs = ['home', 'place-order', 'orders', 'tracking'];
  const key = mainTabs.includes(panel) ? panel : 'more';
  document.querySelectorAll('#mob-dash-tabbar [data-panel]').forEach((t) => {
    t.classList.toggle('active', t.dataset.panel === key);
  });
}

/* ─── AUTH PAGE ─────────────────────────────── */
export function initAuthMobile() {
  const apply = () => document.body.classList.toggle('mob-auth-app', MOBILE_MQ.matches);
  apply();
  MOBILE_MQ.addEventListener('change', apply);
}

/* ─── AUTO INIT ─────────────────────────────── */
export function initMobileApp() {
  initMobileNative();
  initAdminLoginMobile();
  initAuthMobile();
  initDashboardMobile();
}

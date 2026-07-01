/**
 * GALAXY SMART SYSTEM – dashboard.js
 * Full user-side dashboard: Home, Place Order, Orders,
 * Tracking, Payments, Invoices, Profile, Support
 */

import { 
    auth, 
    db, 
    onAuthStateChanged,
    signOut,
    updateDoc,
    updateProfile,
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    orderBy,
    onSnapshot,
    getDoc,
    doc
} from '../assets/js/firebase-config.js';
import { addOrder, sendMessage, watchOrders, watchProjects, DEFAULT_CATEGORIES, CATEGORY_KEYS, CATEGORY_ICONS, TASK_STATUS_META, formatProjectStartDate } from '../firebase/firestore.js';
import { initDashboardMobile } from '../assets/js/mobile-native.js';

const SESSION_KEY = 'gss_session';
const DEBUG_BYPASS_ORDER_FILTER = false;

/* ─── Auth Guard & State ──────────────────────────── */
let currentUser = null;
let userOrders = [];
let statusProjects = [];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = './auth.html';
        return;
    }

    try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : null;
        if (profile?.status === 'blocked') {
            await signOut(auth);
            sessionStorage.removeItem(SESSION_KEY);
            localStorage.removeItem('user');
            window.location.href = './auth.html?blocked=1';
            return;
        }
    } catch (e) {
        console.error('Block guard failed:', e);
    }

    currentUser = user;
    setSession(user);
    const loggedInUser = getLoggedInUser();
    initDashboard();
    listenToOrders(loggedInUser?.email || user.email);
});

function setSession(user) {
    const normalizedEmail = String(user?.email || '').trim().toLowerCase();
    const session = { 
        uid: user.uid, 
        name: user.displayName || 'User', 
        email: normalizedEmail, 
        loggedIn: true 
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('user', JSON.stringify(session));
}

function getSession() {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
}

function getLoggedInUser() {
    try {
        const fromLocal = JSON.parse(localStorage.getItem('user') || '{}');
        if (fromLocal?.email) {
            return {
                ...fromLocal,
                email: String(fromLocal.email || '').trim().toLowerCase()
            };
        }
    } catch (e) {}
    try {
        const fromSession = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
        if (fromSession?.email) {
            return {
                ...fromSession,
                email: String(fromSession.email || '').trim().toLowerCase()
            };
        }
    } catch (e) {}
    return { email: String(currentUser?.email || '').trim().toLowerCase() };
}

/* ─── Data Fetching (Firestore) ───────────────────────────── */
function listenToOrders(email) {
    const normalizedUserEmail = String(email || '').trim().toLowerCase();
    console.log('User email:', normalizedUserEmail);
    watchOrders((orders) => {
        const filteredOrders = orders.filter(
            (order) => String(order.userEmail || '').trim().toLowerCase() === normalizedUserEmail
        );

        console.log('All orders:', orders);
        console.log('Filtered orders:', filteredOrders);
        userOrders = DEBUG_BYPASS_ORDER_FILTER ? orders : filteredOrders;
        console.log('Orders fetched for user:', normalizedUserEmail);
        console.log('Orders fetched:', userOrders);
        console.log('Orders count:', userOrders.length);
        // Refresh active panel if needed
        const activePanel = document.querySelector('.d-panel.active')?.id.replace('panel-', '');
        if (activePanel) renderers[activePanel]?.();
    }, (error) => {
        console.error('Failed to fetch orders:', error);
    });
}

async function saveOrderToFirestore(orderData) {
    try {
        const loggedInUser = getLoggedInUser();
        console.log("Saving order for:", loggedInUser?.email || "");
        await addOrder({
            ...orderData,
            loggedInUser,
            userEmail: loggedInUser.email
        });
        return true;
    } catch (error) {
        console.error('Error saving order:', error);
        return false;
    }
}

async function updateUserInfo(firstName, lastName, phone) {
    try {
        const fullName = `${firstName} ${lastName}`.trim() || 'User';
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const uid = String(localUser?.uid || currentUser?.uid || '').trim();
        if (!uid) {
            throw new Error('Missing user uid');
        }

        await updateDoc(doc(db, "users", uid), {
            fullName
        });
        await updateProfile(currentUser, {
            displayName: fullName
        });
        localStorage.setItem('user', JSON.stringify({
            uid,
            email: String(currentUser?.email || '').trim().toLowerCase()
        }));
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        return false;
    }
}

/* ─── Dashboard Management ────────────────────────── */
function initDashboard() {
    initSidebar();
    
    watchProjects((projects) => {
        statusProjects = Array.isArray(projects) ? projects : [];
        if (document.querySelector('.d-panel.active')?.id === 'panel-home') renderers.home();
    });

    const activePanel = document.querySelector('.d-panel.active')?.id.replace('panel-', '') || 'home';
    switchPanel(activePanel);
}

/* ─── Toast ───────────────────────────────── */
function showToast(msg, type = 'success') {
    const c = document.getElementById('d-toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = `d-toast ${type}`;
    el.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${msg}</span>`;
    c.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
}

/* ─── Format ──────────────────────────────── */
function formatDate(d) {
    if (!d) return 'TBD';
    try { 
        // Handle Firestore timestamp
        const date = d.seconds ? new Date(d.seconds * 1000) : new Date(d);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); 
    }
    catch { return d; }
}

/* ─── Panel Switch ────────────────────────── */
const panelTitles = {
    home: 'Dashboard',
    'place-order': 'Place New Order',
    orders: 'My Orders',
    tracking: 'Order Tracking',
    payments: 'Payment History',
    invoices: 'Invoices',
    profile: 'My Profile',
    support: 'Support'
};

function switchPanel(name) {
    document.querySelectorAll('.d-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const panel = document.getElementById(`panel-${name}`);
    if (panel) panel.classList.add('active');

    document.querySelectorAll(`[data-panel="${name}"]`).forEach(el => el.classList.add('active'));
    document.getElementById('topbar-title').textContent = panelTitles[name] || name;

    // Render on demand
    renderers[name]?.();

    // Close mobile sidebar
    const sidebar = document.getElementById('dashboard-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
}

/* ══════════════════════════════════════════════
   PANEL RENDERERS
══════════════════════════════════════════════ */
const renderers = {};

/* ─── HOME ────────────────────────────────── */
renderers.home = function () {
    const orders = userOrders;
    const paid = orders.flatMap(o => o.payments || []).filter(p => p.status === 'Paid');
    const totalPaid = paid.reduce((sum, p) => {
        const n = parseInt((p.amount || '').replace(/[^\d]/g, ''), 10) || 0;
        return sum + n;
    }, 0);
    const activeOrders = orders.filter(o => o.status === 'in-progress').length;

    const recentOrders = [...orders].reverse().slice(0, 4);
    const panel = document.getElementById('panel-home');

    panel.innerHTML = `
    <!-- Greeting -->
    <div style="margin-bottom:28px;">
      <h2 style="font-family:'Space Grotesk',sans-serif;font-size:1.7rem;font-weight:900;margin-bottom:5px;">
        Welcome back, ${currentUser.displayName?.split(' ')[0] || 'User'} 👋
      </h2>
      <p style="color:var(--muted);font-size:0.9rem;">Here's what's happening with your projects today.</p>
    </div>

    <!-- Summary cards -->
    <div class="summary-grid">
      <div class="summary-card" data-emoji="📦">
        <div class="summary-icon">📦</div>
        <div class="summary-info">
          <div class="label">Total Orders</div>
          <div class="value">${orders.length}</div>
          <div class="sub">↗ All time</div>
        </div>
      </div>
      <div class="summary-card" data-emoji="⚙️">
        <div class="summary-icon">⚙️</div>
        <div class="summary-info">
          <div class="label">Active Orders</div>
          <div class="value">${activeOrders}</div>
          <div class="sub">In progress</div>
        </div>
      </div>
      <div class="summary-card" data-emoji="💳">
        <div class="summary-icon">💳</div>
        <div class="summary-info">
          <div class="label">Amount Paid</div>
          <div class="value">₹${(totalPaid / 1000).toFixed(0)}K</div>
          <div class="sub">Confirmed payments</div>
        </div>
      </div>
      <div class="summary-card" data-emoji="✅">
        <div class="summary-icon">✅</div>
        <div class="summary-info">
          <div class="label">Completed</div>
          <div class="value">${orders.filter(o => o.status === 'completed').length}</div>
          <div class="sub">Delivered</div>
        </div>
      </div>
    </div>

    <!-- Project Status Board (Now Dynamic from Firestore) -->
    <div class="d-section">
      <div class="d-section-header">
        <div class="d-section-title">🚀 Project Status Board</div>
        <div style="font-size:0.8rem;color:var(--muted);">Global live tracking</div>
      </div>
      <div class="d-section-body" style="padding:0;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:20px;padding:20px;">
            ${statusProjects.length ? statusProjects.map(p => {
              const pct = p.overallProgress ?? 0;
              const tech = (p.techStack || p.tech || []).join(', ');
              const activeTask = (p.tasks || []).find(t => t.status === 'active');
              const upcomingTask = (p.tasks || []).find(t => t.status === 'locked');
              const startDate = p.startDate || formatProjectStartDate(p);
              const lastHistory = (p.history || [])[0];
              const statusAccent = p.status === 'running' ? '#00C2FF' : p.status === 'completed' ? '#00FFD1' : '#7A5FFF';
              const completedSections = p.completedSections || {};
              const categoryBars = CATEGORY_KEYS.map((key, i) => {
                const cat = DEFAULT_CATEGORIES[key];
                const icon = CATEGORY_ICONS[key] || '📊';
                const val = Math.min(100, Math.max(0, parseInt((p.progress || {})[key], 10) || 0));
                const done = !!completedSections[key];
                return `<div class="dash-cat-row ${done ? 'section-complete' : ''}" style="animation-delay:${i * 0.06}s">
                  <span class="dash-cat-chip" style="background:${cat.color}33;border:1px solid ${cat.color}55;">${icon}</span>
                  <span class="dash-cat-label">${cat.label}${done ? ' ✅' : ''}</span>
                  <div class="dash-cat-bar-bg premium-bar-track"><div class="dash-cat-bar-fill premium-bar-fill" data-width="${val}" style="width:0%;background:${cat.gradient || cat.color};box-shadow:0 0 8px ${cat.color}55;"></div></div>
                  <span class="dash-cat-val" style="color:${cat.color};">${val}%</span>
                </div>`;
              }).join('');
              return `
              <div class="project-board-card dash-premium-card" data-status="${p.status}">
                <div class="dash-card-top">
                  <span class="dash-card-icon">${p.status === 'running' ? '⚡' : p.status === 'completed' ? '✅' : '🔮'}</span>
                  <span class="dash-overall-ring">${pct}%</span>
                  <span class="badge ${p.status === 'running' ? 'badge-blue' : p.status === 'completed' ? 'badge-green' : 'badge-purple'}" style="text-transform:capitalize;">${p.status}</span>
                </div>
                <div class="dash-card-title">${p.title}</div>
                <div class="dash-card-desc">${p.description || ''}</div>
                <div class="dash-card-tech">🔧 ${tech}</div>
                <div class="dash-overall-wrap">
                  <div class="dash-overall-label">
                    <span>OVERALL</span>
                    <span class="dash-overall-pct">${pct}%</span>
                  </div>
                  <div class="dash-overall-bar premium-bar-track">
                    <div class="dash-overall-fill premium-bar-fill" data-width="${pct}" style="width:0%;background:linear-gradient(90deg,${statusAccent},#7A5FFF);"></div>
                  </div>
                </div>
                <div class="dash-categories premium-glass-panel">${categoryBars}</div>
                ${activeTask ? `<div class="dash-active-task">⚡ <strong>${TASK_STATUS_META.active.badge}:</strong> [${DEFAULT_CATEGORIES[activeTask.category]?.label || activeTask.category}] ${activeTask.title}</div>` : ''}
                ${upcomingTask ? `<div class="dash-upcoming-task">🔜 <strong>${TASK_STATUS_META.locked.badge}:</strong> [${DEFAULT_CATEGORIES[upcomingTask.category]?.label || upcomingTask.category}] ${upcomingTask.title}</div>` : ''}
                ${startDate || lastHistory ? `<div class="dash-history-mini">
                  ${startDate ? `<span>🚀 ${startDate}</span>` : ''}
                  ${lastHistory ? `<span>📈 ${lastHistory.title}</span>` : ''}
                </div>` : ''}
                <div class="dash-card-footer">
                   ${p.status === 'completed' ? `✔ ${p.completedDate || p.eta || ''}` : `🗓 ETA: ${p.eta || 'TBD'}`}
                   ${p.priority ? `· <span class="dash-priority">${p.priority}</span>` : ''}
                </div>
              </div>`;
            }).join('') : '<div style="padding:40px;text-align:center;color:var(--muted);grid-column:1/-1;">No projects in the status board yet.</div>'}
          </div>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="d-section">
      <div class="d-section-header">
        <div class="d-section-title">📦 Recent Orders</div>
        <button class="d-btn d-btn-outline d-btn-sm" onclick="switchPanel('orders')">View All</button>
      </div>
      <div class="d-section-body" style="padding:0;">
        ${recentOrders.length ? `
          <table class="d-table">
            <thead><tr>
              <th>Order ID</th><th>Project</th><th>Type</th><th>Status</th><th>Budget</th><th>Action</th>
            </tr></thead>
            <tbody>
              ${recentOrders.map(o => `
                <tr>
                  <td class="fw-700 text-blue">${o.id}</td>
                  <td>${o.title}</td>
                  <td><span class="badge badge-purple">${o.type}</span></td>
                  <td>${statusBadge(o.status)}</td>
                  <td class="fw-700">${o.budget}</td>
                  <td>
                    <button class="d-btn d-btn-outline d-btn-sm" onclick="trackOrder('${o.id}')">Track</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<div class="empty-state"><div class="icon">📭</div><h4>No orders yet</h4><p>Place your first order and start building something amazing.</p><button class="d-btn d-btn-primary" style="margin-top:16px;" onclick="switchPanel('place-order')">➕ Place Order</button></div>`}
      </div>
    </div>
  `;
  animateDashboardBars(panel);
};

function animateDashboardBars(panel) {
  if (!panel) return;
  requestAnimationFrame(() => {
    panel.querySelectorAll('.dash-cat-bar-fill, .dash-overall-fill').forEach((el) => {
      const w = el.dataset.width || '0';
      el.style.width = `${w}%`;
    });
  });
}

function statusBadge(s) {
    const m = {
        'in-progress': 'badge-blue',
        'completed': 'badge-green',
        'pending': 'badge-yellow',
    };
    const icons = { 'in-progress': '⚙️', 'completed': '✅', 'pending': '⏳' };
    return `<span class="badge ${m[s] || 'badge-blue'}">${icons[s] || '•'} ${s || 'pending'}</span>`;
}

/* ─── PLACE ORDER ─────────────────────────── */
renderers['place-order'] = function () {
    const panel = document.getElementById('panel-place-order');
    panel.innerHTML = `
    <div class="d-section">
      <div class="d-section-header">
        <div class="d-section-title">🚀 What would you like to build?</div>
      </div>
      <div class="d-section-body">

        <!-- Type selector -->
        <div class="order-type-grid" id="order-type-grid">
          <div class="order-type-card selected" data-type="Website">
            <div class="order-type-icon">🌐</div>
            <div class="order-type-name">Website</div>
            <div class="order-type-desc">Business, portfolio, e-commerce, or any custom web platform</div>
          </div>
          <div class="order-type-card" data-type="Android App">
            <div class="order-type-icon">📱</div>
            <div class="order-type-name">Android App</div>
            <div class="order-type-desc">Native or cross-platform Android application</div>
          </div>
          <div class="order-type-card" data-type="iOS App">
            <div class="order-type-icon">🍎</div>
            <div class="order-type-name">iOS App</div>
            <div class="order-type-desc">iPhone & iPad applications for the App Store</div>
          </div>
          <div class="order-type-card" data-type="UI/UX Design">
            <div class="order-type-icon">🎨</div>
            <div class="order-type-name">UI/UX Design</div>
            <div class="order-type-desc">Wireframes, prototypes, and full design systems</div>
          </div>
          <div class="order-type-card" data-type="AI Integration">
            <div class="order-type-icon">🤖</div>
            <div class="order-type-name">AI Integration</div>
            <div class="order-type-desc">ChatGPT, ML models, automation, NLP integrations</div>
          </div>
          <div class="order-type-card" data-type="Other">
            <div class="order-type-icon">💡</div>
            <div class="order-type-name">Other / Custom</div>
            <div class="order-type-desc">Tell us your idea and we'll make it happen</div>
          </div>
        </div>

        <hr style="border:none;border-top:1px solid var(--border2);margin:28px 0;">

        <!-- Order Details Form -->
        <form id="order-form">
          <div class="d-form-grid" style="margin-bottom:18px;">
            <div class="d-form-group">
              <label>Project Title *</label>
              <input type="text" id="o-title" placeholder="e.g. My Online Store" required>
            </div>
            <div class="d-form-group">
              <label>Budget Range *</label>
              <select id="o-budget" required>
                <option value="">Select budget</option>
                <option>Under ₹10,000</option>
                <option>₹10,000 – ₹25,000</option>
                <option>₹25,000 – ₹50,000</option>
                <option>₹50,000 – ₹1,00,000</option>
                <option>₹1,00,000 – ₹5,00,000</option>
                <option>₹5,00,000+</option>
              </select>
            </div>
            <div class="d-form-group">
              <label>Deadline</label>
              <input type="date" id="o-deadline">
            </div>
            <div class="d-form-group">
              <label>Priority</label>
              <select id="o-priority">
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
            <div class="d-form-group" style="grid-column:1/-1;">
              <label>Project Description *</label>
              <textarea id="o-desc" rows="5" placeholder="Describe your project in detail — features, target audience, reference sites, etc." required></textarea>
            </div>
            <div class="d-form-group" style="grid-column:1/-1;">
              <label>Reference Links / Inspiration (optional)</label>
              <input type="text" id="o-refs" placeholder="https://example.com, https://another.com">
            </div>
          </div>

          <div style="display:flex;gap:14px;flex-wrap:wrap;">
            <button type="submit" class="d-btn d-btn-primary" id="submit-order-btn" style="padding:14px 32px;">
              🚀 Submit Order
            </button>
            <button type="button" class="d-btn d-btn-outline" onclick="document.getElementById('order-form').reset();">
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

    // Type card selection
    let selectedType = 'Website';
    panel.querySelectorAll('.order-type-card').forEach(card => {
        card.addEventListener('click', () => {
            panel.querySelectorAll('.order-type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedType = card.dataset.type;
        });
    });

    // Submit
    panel.querySelector('#order-form').addEventListener('submit', async e => {
        e.preventDefault();
        const title = document.getElementById('o-title').value.trim();
        const budget = document.getElementById('o-budget').value;
        const deadline = document.getElementById('o-deadline').value;
        const priority = document.getElementById('o-priority').value;
        const desc = document.getElementById('o-desc').value.trim();
        const refs = document.getElementById('o-refs').value.trim();

        const success = await saveOrderToFirestore({
            type: selectedType,
            title,
            budget,
            deadline,
            priority: String(priority).toLowerCase() === 'urgent' ? 'high' : (String(priority).toLowerCase() === 'normal' ? 'low' : 'medium'),
            description: desc,
            refs,
            status: 'pending',
            tracking: [
                { step: 'Order Placed', done: true, active: false, time: formatDate(new Date()) },
                { step: 'Requirements Review', done: false, active: true, time: 'Under review' },
                { step: 'Design Phase', done: false, active: false, time: 'Upcoming' },
                { step: 'Development', done: false, active: false, time: 'Upcoming' },
                { step: 'Testing & QA', done: false, active: false, time: 'Upcoming' },
                { step: 'Delivery', done: false, active: false, time: deadline || 'TBD' },
            ],
            payments: [
                { label: 'Advance Payment', amount: 'TBD', date: formatDate(new Date()), status: 'Pending' }
            ]
        });

        if (success) {
            showToast(`Order placed successfully`);
            panel.querySelector('#order-form').reset();
            switchPanel('orders');
        } else {
            showToast('❌ Error submitting order.', 'error');
        }
    });
};

/* ─── ORDERS ──────────────────────────────── */
renderers.orders = function () {
    const orders = userOrders;
    const loggedInUser = getLoggedInUser();
    console.log("User email:", loggedInUser?.email || "");
    console.log("Orders fetched:", orders);
    console.log("Orders count:", orders.length);
    const panel = document.getElementById('panel-orders');

    panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:14px;">
      <div>
        <h2 style="font-family:'Space Grotesk',sans-serif;font-size:1.3rem;font-weight:800">All Orders</h2>
        <p style="font-size:0.82rem;color:var(--muted);margin-top:3px;">${orders.length} orders total</p>
      </div>
      <button class="d-btn d-btn-primary" onclick="switchPanel('place-order')">➕ New Order</button>
    </div>

    <div class="d-section">
      <div class="d-section-body" style="padding:0;">
        ${orders.length ? `
          <table class="d-table">
            <thead><tr>
              <th>Order ID</th><th>Project</th><th>Type</th><th>Budget</th>
              <th>Placed</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td class="fw-700 text-blue">${o.id}</td>
                  <td>
                    <div class="fw-700" style="font-size:.9rem;">${o.title}</div>
                    <div style="font-size:.74rem;color:var(--muted);margin-top:2px;">${o.priority || 'Normal'} priority</div>
                  </td>
                  <td><span class="badge badge-purple">${o.type}</span></td>
                  <td class="fw-700">${o.budget}</td>
                  <td style="color:var(--muted)">${formatDate(o.createdAt)}</td>
                  <td>${statusBadge(o.status)}</td>
                  <td>
                    <div style="display:flex;gap:8px;">
                      <button class="d-btn d-btn-outline d-btn-sm" onclick="trackOrder('${o.id}')">🛰 Track</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="empty-state">
            <div class="icon">📭</div>
            <h4>No orders yet</h4>
            <p>Start your first project with Galaxy Smart System!</p>
            <button class="d-btn d-btn-primary" style="margin-top:16px;" onclick="switchPanel('place-order')">➕ Place First Order</button>
          </div>
        `}
      </div>
    </div>
  `;
};

/* ─── TRACKING ────────────────────────────── */
renderers.tracking = function (orderId = null) {
    const orders = userOrders;
    const panel = document.getElementById('panel-tracking');

    if (!orders.length) {
        panel.innerHTML = `
      <div class="empty-state" style="margin-top:60px;">
        <div class="icon">🛰</div><h4>No orders to track</h4>
        <p>Place an order first!</p>
        <button class="d-btn d-btn-primary" style="margin-top:16px;" onclick="switchPanel('place-order')">➕ Place Order</button>
      </div>`;
        return;
    }

    const selected = orderId ? orders.find(o => o.id === orderId) : orders[orders.length - 1];

    const optionsList = orders.map(o => `<option value="${o.id}" ${o.id === selected?.id ? 'selected' : ''}>${o.id} — ${o.title}</option>`).join('');

    panel.innerHTML = `
    <div style="margin-bottom:22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <label style="font-size:.8rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Select Order:</label>
      <select id="tracking-select" style="background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:10px 16px;color:var(--text);font-family:'Inter',sans-serif;font-size:.9rem;outline:none;min-width:280px;">
        ${optionsList}
      </select>
    </div>

    <div id="tracking-content"></div>
  `;

    function renderTracking(order) {
        if (!order) return;
        const status = order.status || 'pending';
        const timelineSteps = [
          { step: 'Order Placed', done: true, active: false, time: formatDate(order.createdAt || new Date()) },
          { step: 'In Progress', done: status === 'completed' || status === 'in-progress', active: status === 'in-progress', time: status === 'pending' ? 'Waiting' : 'In progress' },
          { step: 'Completed', done: status === 'completed', active: false, time: status === 'completed' ? 'Done' : 'Pending' }
        ];
        const pct = status === 'completed' ? 100 : (status === 'in-progress' ? 65 : 20);

        document.getElementById('tracking-content').innerHTML = `
      <!-- Header -->
      <div class="d-section">
        <div class="tracking-status-header">
          <div style="font-size:2.2rem">${order.type === 'Android App' ? '📱' : '🌐'}</div>
          <div>
            <div style="font-family:'Space Grotesk',sans-serif;font-size:1.1rem;font-weight:800;">${order.title}</div>
            <div class="tracking-id">Order ID: ${order.id} &nbsp;·&nbsp; Type: ${order.type} &nbsp;·&nbsp; Budget: ${order.budget}</div>
          </div>
          <div style="margin-left:auto;">${statusBadge(order.status)}</div>
        </div>

        <!-- Progress bar -->
        <div style="padding:20px 26px;border-bottom:1px solid var(--border2);">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:.8rem;">
            <span style="color:var(--muted);font-weight:600;">Overall Progress</span>
            <span style="font-weight:800;color:var(--blue)">${pct}%</span>
          </div>
          <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:var(--grad);border-radius:6px;box-shadow:0 0 12px rgba(0,194,255,0.4);transition:width 0.8s ease;"></div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline">
          ${timelineSteps.map(step => `
            <div class="timeline-step ${step.done ? 'done' : step.active ? 'active' : ''}">
              <div class="tl-dot">${step.done ? '✓' : step.active ? '⚡' : '○'}</div>
              <div class="tl-content">
                <div class="tl-title">${step.step}</div>
                <div class="tl-desc">${step.active ? 'Currently in progress...' : step.done ? 'Completed successfully.' : 'Waiting to start.'}</div>
                <div class="tl-time">🕐 ${step.time}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Payment Summary -->
      <div class="d-section">
        <div class="d-section-header"><div class="d-section-title">💳 Payment Installments</div></div>
        <div class="d-section-body" style="padding:0;">
          <table class="d-table">
            <thead><tr><th>Description</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              ${(order.payments || [{ label: 'Advance Payment', amount: order.budget || 'TBD', date: formatDate(order.createdAt), status: 'Pending' }]).map(p => `
                <tr>
                  <td class="fw-700">${p.label}</td>
                  <td class="fw-700 text-blue">${p.amount}</td>
                  <td style="color:var(--muted)">${p.date}</td>
                  <td>${p.status === 'Paid' ? '<span class="badge badge-green">✅ Paid</span>' : '<span class="badge badge-yellow">⏳ Pending</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    }

    renderTracking(selected);

    document.getElementById('tracking-select').addEventListener('change', function () {
        const ord = orders.find(o => o.id === this.value);
        renderTracking(ord);
    });
};

/* Global helper called from other panels */
function trackOrder(id) {
    switchPanel('tracking');
    renderers.tracking(id);
    // Update select
    setTimeout(() => {
        const sel = document.getElementById('tracking-select');
        if (sel) { sel.value = id; sel.dispatchEvent(new Event('change')); }
    }, 100);
}
window.trackOrder = trackOrder;

/* ─── PAYMENTS ────────────────────────────── */
renderers.payments = function () {
    const orders = userOrders;
    const allPayments = orders.flatMap(o =>
        (o.payments || []).map(p => ({ ...p, orderId: o.id, orderTitle: o.title }))
    );

    const totalPaid = allPayments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + (parseInt((p.amount || '').replace(/[^\d]/g, ''), 10) || 0), 0);

    const panel = document.getElementById('panel-payments');

    panel.innerHTML = `
    <!-- Balance Card -->
    <div class="payment-card">
      <div>
        <div style="font-size:.74rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Total Amount Paid</div>
        <div class="amount">₹${totalPaid.toLocaleString('en-IN')}</div>
        <div class="sub">Across ${allPayments.filter(p => p.status === 'Paid').length} transactions</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:.74rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Pending Payments</div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:1.6rem;font-weight:900;color:var(--yellow);">
          ${allPayments.filter(p => p.status !== 'Paid').length}
        </div>
        <div style="font-size:.72rem;color:var(--yellow);">awaiting payment</div>
      </div>
    </div>

    <!-- Transaction table -->
    <div class="d-section">
      <div class="d-section-header">
        <div class="d-section-title">📋 Transaction History</div>
      </div>
      <div class="d-section-body" style="padding:0;">
        ${allPayments.length ? `
          <table class="d-table">
            <thead><tr>
              <th>Description</th><th>Order</th><th>Amount</th><th>Date</th><th>Status</th>
            </tr></thead>
            <tbody>
              ${allPayments.map(p => `
                <tr>
                  <td class="fw-700">${p.label}</td>
                  <td>
                    <span class="badge badge-purple">${p.orderId}</span>
                    <div style="font-size:.72rem;color:var(--muted);margin-top:3px;">${p.orderTitle}</div>
                  </td>
                  <td class="fw-700 text-blue">${p.amount}</td>
                  <td style="color:var(--muted)">${p.date}</td>
                  <td>${p.status === 'Paid' ? '<span class="badge badge-green">✅ Paid</span>' : '<span class="badge badge-yellow">⏳ Pending</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="empty-state">
            <div class="icon">💳</div>
            <h4>No payment records</h4>
            <p>Payment history will appear here once you place an order.</p>
          </div>
        `}
      </div>
    </div>
  `;
};

/* ─── INVOICES ────────────────────────────── */
renderers.invoices = function () {
    const orders = userOrders.filter(o => o.status === 'completed');
    const panel = document.getElementById('panel-invoices');

    panel.innerHTML = `
    <div class="d-section">
      <div class="d-section-header">
        <div class="d-section-title">🧾 Invoices</div>
      </div>
      <div class="d-section-body" style="padding:0;">
        ${orders.length ? `
          <table class="d-table">
            <thead><tr><th>Invoice #</th><th>Project</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${orders.map((o, i) => `
                <tr>
                  <td class="fw-700 text-blue">INV-${String(i + 1).padStart(3, '0')}</td>
                  <td>${o.title}</td>
                  <td class="fw-700">${o.budget}</td>
                  <td style="color:var(--muted)">${formatDate(o.createdAt)}</td>
                  <td><span class="badge badge-green">✅ Paid</span></td>
                  <td><button class="d-btn d-btn-outline d-btn-sm" onclick="showToast('Invoice download coming soon!','error')">⬇ Download</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<div class="empty-state"><div class="icon">🧾</div><h4>No invoices</h4><p>Invoices are generated for completed projects.</p></div>`}
      </div>
    </div>
  `;
};

/* ─── PROFILE ─────────────────────────────── */
renderers.profile = function () {
    const user = currentUser;
    const panel = document.getElementById('panel-profile');
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    const uid = String(localUser?.uid || user?.uid || '').trim();
    console.log("User UID:", uid);

    const render = (profileData = {}) => {
    const fullName = String(profileData.fullName || user.displayName || 'User').trim();
    const email = String(profileData.email || user.email || '').trim().toLowerCase();
    const initial = (fullName[0] || 'U').toUpperCase();
    const verifiedBadge = email ? '<span class="badge badge-green">✅ Verified Account</span>' : '<span class="badge badge-yellow">⚠️ Unverified</span>';

    panel.innerHTML = `
    <div class="d-section" style="max-width:700px;">
      <div class="profile-avatar-wrap">
        <div class="profile-avatar-big">${initial}</div>
        <div class="profile-name">${fullName}</div>
        <div class="profile-email">${email || 'No email'}</div>
        <div style="margin-top:10px;">${verifiedBadge}</div>
      </div>

      <div class="d-section-body">
        <form id="profile-form">
          <div class="d-form-grid" style="margin-bottom:18px;">
            <div class="d-form-group">
              <label>Full Name</label>
              <input type="text" id="pf-name" value="${fullName}">
            </div>
            <div class="d-form-group">
              <label>Email</label>
              <input type="email" id="email" value="${email}" readonly disabled style="opacity:.5;">
            </div>
            <div class="d-form-group">
              <label>Phone (Read-only)</label>
              <input type="tel" value="Update in Phase 2" disabled style="opacity:.5;">
            </div>
          </div>
          <button type="submit" class="d-btn d-btn-primary">💾 Save Changes</button>
        </form>
      </div>
    </div>

    <div class="d-section" style="max-width:700px;margin-top:20px;">
      <div class="d-section-header"><div class="d-section-title">🔐 Security</div></div>
      <div class="d-section-body">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;">
          <div>
            <div class="fw-700">Password</div>
            <div style="font-size:.8rem;color:var(--muted);">Last changed: never</div>
          </div>
          <button class="d-btn d-btn-outline" onclick="showToast('Password change coming in Phase 2!','error')">Change Password</button>
        </div>
        <hr style="border:none;border-top:1px solid var(--border2);margin:18px 0;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;">
          <div>
            <div class="fw-700" style="color:var(--red);">Danger Zone</div>
            <div style="font-size:.8rem;color:var(--muted);">Member since: ${formatDate(user.joined)}</div>
          </div>
          <button class="d-btn" style="background:rgba(255,75,75,0.1);color:var(--red);border:1px solid rgba(255,75,75,0.2);" onclick="confirmLogout()">🚪 Sign Out</button>
        </div>
      </div>
    </div>
  `;

    panel.querySelector('#profile-form').addEventListener('submit', async e => {
        e.preventDefault();
        const newName = document.getElementById('pf-name').value.trim();
        const success = await updateUserInfo(newName.split(' ')[0], newName.split(' ').slice(1).join(' '), '');
        if (success) {
            showToast('Profile updated successfully!');
            initSidebar();
        } else {
            showToast('❌ Error updating profile.', 'error');
        }
    });
  };

  if (!uid) {
    render();
    return;
  }

  getDoc(doc(db, "users", uid))
    .then((docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Firestore data:", data);
            render(data);
            return;
        }
        render();
    })
    .catch((error) => {
        console.error("Profile fetch failed:", error);
        render();
    });
};

/* ─── SUPPORT ─────────────────────────────── */
renderers.support = function () {
    const panel = document.getElementById('panel-support');
    panel.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:26px;">
      ${[
            { icon: '💬', title: 'Live Chat', sub: 'Typically replies in < 5 minutes', btn: 'Start Chat' },
            { icon: '📧', title: 'Email Support', sub: 'support@galaxysmart.in', btn: 'Send Email' },
            { icon: '📞', title: 'Call Us', sub: '+91 98765 43210', btn: 'Call Now' },
            { icon: '📚', title: 'Knowledge Base', sub: 'Guides, FAQs & Tutorials', btn: 'Browse Docs' },
        ].map(item => `
        <div class="d-section" style="margin:0;">
          <div class="d-section-body" style="display:flex;align-items:center;gap:18px;">
            <div style="font-size:2rem;width:52px;height:52px;background:var(--grad45);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${item.icon}</div>
            <div style="flex:1;">
              <div class="fw-700" style="margin-bottom:3px;">${item.title}</div>
              <div style="font-size:.78rem;color:var(--muted)">${item.sub}</div>
            </div>
            <button class="d-btn d-btn-outline d-btn-sm" onclick="showToast('${item.btn} coming soon!')"> ${item.btn}</button>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Support Ticket Form -->
    <div class="d-section">
      <div class="d-section-header"><div class="d-section-title">🎫 Submit a Support Ticket</div></div>
      <div class="d-section-body">
        <form id="support-form">
          <div class="d-form-grid" style="margin-bottom:18px;">
            <div class="d-form-group">
              <label>Subject</label>
              <input type="text" id="sup-subject" placeholder="Brief description of your issue">
            </div>
            <div class="d-form-group">
              <label>Priority</label>
              <select id="sup-priority"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
            </div>
            <div class="d-form-group" style="grid-column:1/-1;">
              <label>Description</label>
              <textarea id="sup-desc" rows="5" placeholder="Describe your issue in detail..."></textarea>
            </div>
          </div>
          <button type="submit" class="d-btn d-btn-primary">🚀 Submit Ticket</button>
        </form>
      </div>
    </div>
  `;

    panel.querySelector('#support-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subject = panel.querySelector('#sup-subject')?.value?.trim() || '';
        const priority = panel.querySelector('#sup-priority')?.value || 'Medium';
        const desc = panel.querySelector('#sup-desc')?.value?.trim() || '';
        if (!subject || !desc) {
            showToast('⚠️ Please fill subject and description.');
            return;
        }
        const btn = panel.querySelector('#support-form button[type="submit"]');
        if (btn) btn.disabled = true;
        try {
            await sendMessage({
                type: 'support',
                name: currentUser?.displayName || 'User',
                email: currentUser?.email || '',
                subject,
                priority,
                message: `[${priority}] ${subject}\n\n${desc}`
            });
            showToast('✅ Support ticket submitted! We\'ll reply within 24 hours.');
            panel.querySelector('#support-form').reset();
        } catch (err) {
            console.error('Support ticket failed:', err);
            showToast('⚠️ Could not submit ticket. Please try again.');
        } finally {
            if (btn) btn.disabled = false;
        }
    });
};

/* ══════════════════════════════════════════════
   INITIALIZATION
   ══════════════════════════════════════════════ */
function initSidebar() {
    if (!currentUser) return;
    const name = currentUser.displayName || 'User';
    const initial = (name[0] || 'U').toUpperCase();

    const avatarEl = document.getElementById('sb-avatar');
    const nameEl = document.getElementById('sb-name');
    const emailEl = document.getElementById('sb-email');

    if (avatarEl) avatarEl.textContent = initial;
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = currentUser.email;
}

function initNavLinks() {
    document.querySelectorAll('[data-panel]').forEach(btn => {
        btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });
}

function initMobileMenu() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('dashboard-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    toggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    });

    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });
}

function confirmLogout() {
    if (confirm('Are you sure you want to sign out?')) logout();
}

async function logout() {
    try {
        await signOut(auth);
    } catch (e) {
        console.error('Sign out failed:', e);
    }
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('user');
    window.location.href = './auth.html';
}

document.getElementById('logout-btn').addEventListener('click', confirmLogout);

// Initial, render
initSidebar();
initNavLinks();
initMobileMenu();
// switchPanel is called by initDashboard when auth state is ready

window.switchPanel = switchPanel;
window.showToast = showToast;
initDashboardMobile();

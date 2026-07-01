import { mountAdminMobileTabbar } from "../assets/js/mobile-native.js";

export function getAdminSession() {
  const raw = localStorage.getItem("adminAuth");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function guardAdmin() {
  const session = getAdminSession();
  if (!session || session.role !== "admin") {
    window.location.href = "./admin.html";
    return null;
  }
  return session;
}

export function mountAdminLayout({
  rootId = "admin-page-root",
  active = "dashboard",
  title = "Dashboard",
  subtitle = "Manage your Galaxy workspace."
} = {}) {
  const root = document.getElementById(rootId);
  if (!root) return null;

  root.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-shell-sidebar" id="admin-shell-sidebar">
        <div class="admin-shell-logo">🌌 <span>Galaxy Admin</span></div>
        <nav class="admin-shell-nav">
          <a class="admin-shell-link ${active === "dashboard" ? "active" : ""}" href="./dashboard.html">📊 Dashboard</a>
          <a class="admin-shell-link ${active === "users" ? "active" : ""}" href="./users.html">👥 Users</a>
          <a class="admin-shell-link ${active === "team" ? "active" : ""}" href="./team.html">🧑‍🚀 Team</a>
          <a class="admin-shell-link ${active === "projects" ? "active" : ""}" href="./projects.html">📁 Projects</a>
          <a class="admin-shell-link ${active === "orders" ? "active" : ""}" href="./orders.html">🧾 Orders</a>
          <a class="admin-shell-link ${active === "tech" ? "active" : ""}" href="./tech.html">🧩 Technologies</a>
          <a class="admin-shell-link ${active === "messages" ? "active" : ""}" href="./messages.html">📩 Messages</a>
          <a class="admin-shell-link ${active === "settings" ? "active" : ""}" href="./settings.html">⚙️ Settings</a>
        </nav>
      </aside>

      <div class="admin-shell-main">
        <header class="admin-shell-topbar">
          <div class="admin-shell-topbar-left">
            <button class="admin-shell-hamburger" id="admin-shell-hamburger" aria-label="Toggle sidebar">☰</button>
            <div>
              <h1>${title}</h1>
              <p>${subtitle}</p>
            </div>
          </div>
          <div class="admin-shell-topbar-right">
            <div class="admin-shell-profile">A</div>
            <button class="saas-btn saas-btn-ghost" id="admin-shell-logout">Logout</button>
          </div>
        </header>
        <main class="admin-shell-content" id="admin-shell-content"></main>
      </div>
    </div>
  `;

  const sidebar = document.getElementById("admin-shell-sidebar");
  const burger = document.getElementById("admin-shell-hamburger");
  const logout = document.getElementById("admin-shell-logout");
  burger?.addEventListener("click", () => sidebar?.classList.toggle("open"));
  logout?.addEventListener("click", () => {
    localStorage.removeItem("adminAuth");
    window.location.href = "./admin.html";
  });

  mountAdminMobileTabbar(active);

  return {
    content: document.getElementById("admin-shell-content")
  };
}

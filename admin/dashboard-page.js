import { getMessages, getProjects, getTech, getUsers } from "../firebase/firestore.js";
import { guardAdmin, mountAdminLayout } from "./layout.js";

if (!guardAdmin()) throw new Error("Unauthorized");
const layout = mountAdminLayout({
  active: "dashboard",
  title: "Dashboard",
  subtitle: "Manage Users, Team, Projects, Orders, Technologies, and Messages from one place."
});

if (layout?.content) {
  layout.content.innerHTML = `
    <section class="users-stats">
      <article class="users-stat card"><span>Total Users</span><strong id="dash-users">0</strong></article>
      <article class="users-stat card"><span>Projects</span><strong id="dash-projects">0</strong></article>
      <article class="users-stat card"><span>Technologies</span><strong id="dash-tech">0</strong></article>
    </section>
    <section class="card mt-16">
      <h3 class="section-title">Quick Overview</h3>
      <p class="section-subtitle">Use the sidebar to manage Users, Team, Projects, Orders, Technologies, Messages, and Settings.</p>
      <div class="badge badge-success">Live Firebase Connected</div>
      <div class="badge badge-info mt-10" id="dash-messages-pill">Messages: 0</div>
    </section>
  `;
}

Promise.all([getUsers(), getProjects(), getTech(), getMessages()]).then(([users, projects, tech, messages]) => {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
  set("dash-users", users.length);
  set("dash-projects", projects.length);
  set("dash-tech", tech.length);
  const pill = document.getElementById("dash-messages-pill");
  if (pill) pill.textContent = `Messages: ${messages.length}`;
}).catch((err) => {
  console.error("Dashboard stats failed:", err);
  const pill = document.getElementById("dash-messages-pill");
  if (pill) {
    pill.textContent = "Messages: unavailable";
    pill.classList.remove("badge-info");
    pill.classList.add("badge-danger");
  }
});

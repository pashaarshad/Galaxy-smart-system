import { guardAdmin, mountAdminLayout } from "./layout.js";

if (!guardAdmin()) throw new Error("Unauthorized");

const SETTINGS_KEY = "galaxy_admin_settings";

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSettings(data) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

const layout = mountAdminLayout({
  active: "settings",
  title: "Settings",
  subtitle: "Configure admin profile and dashboard preferences."
});

if (layout?.content) {
  layout.content.innerHTML = `
    <section class="grid-two">
      <article class="card">
        <h3 class="section-title">Admin Profile</h3>
        <p class="section-subtitle">Update display details used across admin pages.</p>
        <div class="form-group">
          <label class="label" for="set-name">Display Name</label>
          <input class="input" id="set-name" type="text" placeholder="Galaxy Admin">
        </div>
        <div class="form-group">
          <label class="label" for="set-email">Contact Email</label>
          <input class="input" id="set-email" type="email" placeholder="admin@galaxy.com">
        </div>
        <button class="btn btn-primary" id="save-profile-btn">Save Profile</button>
      </article>
      <article class="card">
        <h3 class="section-title">Theme Preferences</h3>
        <p class="section-subtitle">Control lightweight dashboard options.</p>
        <div class="form-group">
          <label class="label" for="set-density">Layout Density</label>
          <select class="input" id="set-density">
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label" for="set-anim">Animation Mode</label>
          <select class="input" id="set-anim">
            <option value="smooth">Smooth</option>
            <option value="reduced">Reduced</option>
          </select>
        </div>
        <button class="btn btn-secondary" id="save-pref-btn">Save Preferences</button>
      </article>
    </section>
    <div class="toast-host" id="settings-toast-host"></div>
  `;
}

const saved = loadSettings();
document.getElementById("set-name").value = saved.displayName || "";
document.getElementById("set-email").value = saved.contactEmail || "";
document.getElementById("set-density").value = saved.density || "comfortable";
document.getElementById("set-anim").value = saved.animation || "smooth";

function toast(message) {
  const host = document.getElementById("settings-toast-host");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

document.getElementById("save-profile-btn")?.addEventListener("click", () => {
  const data = { ...loadSettings() };
  data.displayName = document.getElementById("set-name").value.trim();
  data.contactEmail = document.getElementById("set-email").value.trim();
  saveSettings(data);
  toast("Profile settings saved");
});

document.getElementById("save-pref-btn")?.addEventListener("click", () => {
  const data = { ...loadSettings() };
  data.density = document.getElementById("set-density").value;
  data.animation = document.getElementById("set-anim").value;
  saveSettings(data);
  toast("Preferences saved");
});

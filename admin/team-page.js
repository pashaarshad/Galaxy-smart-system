import {
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamMembers,
  watchTeamMembers,
  TEAM_ROLE_KEYS,
  TEAM_ROLE_PRESETS,
  applyRolePreset,
  normalizeTeamMember
} from "../firebase/firestore.js";
import { renderTeamMemberCard } from "../user/teamMembers.js";
import { guardAdmin, mountAdminLayout } from "./layout.js";

if (!guardAdmin()) throw new Error("Unauthorized");

const layout = mountAdminLayout({
  active: "team",
  title: "Team Members",
  subtitle: "Manage team profiles and role-based cards for the public site."
});

if (layout?.content) {
  layout.content.innerHTML = `
    <section class="card">
      <div class="admin-panel-header">
        <h2 class="section-title">Team Management</h2>
        <button class="btn btn-primary" id="add-team-btn" type="button">+ Add Member</button>
      </div>
      <div class="users-table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Avatar</th><th>Name</th><th>Role</th><th>Layout</th><th>Order</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="team-list-body"></tbody>
        </table>
      </div>
      <div id="team-empty" class="users-empty-state">
        <div class="empty-icon">👥</div>
        <h4>No team members yet</h4>
        <p>Add your first team member to show on the public website.</p>
      </div>
    </section>

    <div class="modal" id="team-modal">
      <div class="card team-editor-card premium-glass-panel">
        <h3 class="section-title" id="team-modal-title">Add Team Member</h3>
        <div class="team-editor-grid">
          <div class="team-editor-form">
            <h4 class="team-editor-label">Basic Info</h4>
            <div class="form-group">
              <label class="label" for="tm-name">Name</label>
              <input class="input" id="tm-name" type="text" placeholder="Full name">
            </div>
            <div class="grid-two">
              <div class="form-group">
                <label class="label" for="tm-role">Role</label>
                <select class="input" id="tm-role">
                  ${TEAM_ROLE_KEYS.map((k) => `<option value="${k}">${TEAM_ROLE_PRESETS[k].roleLabel}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label class="label" for="tm-avatar">Avatar Emoji</label>
                <input class="input" id="tm-avatar" type="text" placeholder="👤">
              </div>
            </div>
            <div class="form-group">
              <label class="label" for="tm-title">Title</label>
              <input class="input" id="tm-title" type="text" placeholder="Job title">
            </div>
            <div class="form-group">
              <label class="label" for="tm-tagline">Tagline</label>
              <input class="input" id="tm-tagline" type="text" placeholder="Short tagline">
            </div>
            <div class="form-group">
              <label class="label" for="tm-highlight">Highlight</label>
              <input class="input" id="tm-highlight" type="text" placeholder="e.g. 10+ years experience">
            </div>
            <div class="form-group">
              <label class="label" for="tm-bio">Bio</label>
              <textarea class="input" id="tm-bio" rows="3" placeholder="Member bio"></textarea>
            </div>
            <div class="grid-two">
              <div class="form-group">
                <label class="label" for="tm-email">Email</label>
                <input class="input" id="tm-email" type="email">
              </div>
              <div class="form-group">
                <label class="label" for="tm-phone">Phone</label>
                <input class="input" id="tm-phone" type="text">
              </div>
            </div>
            <div class="form-group">
              <label class="label" for="tm-linkedin">LinkedIn</label>
              <input class="input" id="tm-linkedin" type="text" placeholder="linkedin.com/in/...">
            </div>
            <div class="form-group">
              <label class="label" for="tm-skills">Skills (comma separated)</label>
              <input class="input" id="tm-skills" type="text" placeholder="React, Firebase, UI">
            </div>
            <div class="grid-two">
              <div class="form-group">
                <label class="label" for="tm-stat1">Stat 1 (label:value)</label>
                <input class="input" id="tm-stat1" type="text" placeholder="Projects:24">
              </div>
              <div class="form-group">
                <label class="label" for="tm-stat2">Stat 2</label>
                <input class="input" id="tm-stat2" type="text" placeholder="Clients:12">
              </div>
            </div>
            <div class="grid-two">
              <div class="form-group">
                <label class="label" for="tm-order">Sort Order</label>
                <input class="input" id="tm-order" type="number" min="0" value="1">
              </div>
              <div class="form-group">
                <label class="label" for="tm-active">Status</label>
                <select class="input" id="tm-active">
                  <option value="true">Active (visible)</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>

            <h4 class="team-editor-label">Card Theme</h4>
            <div class="grid-two">
              <div class="form-group">
                <label class="label" for="tm-accent">Accent Color</label>
                <input class="input team-color-input" id="tm-accent" type="color">
              </div>
              <div class="form-group">
                <label class="label" for="tm-secondary">Secondary Color</label>
                <input class="input team-color-input" id="tm-secondary" type="color">
              </div>
            </div>
            <div class="form-group">
              <label class="label" for="tm-layout">Card Layout</label>
              <select class="input" id="tm-layout">
                <option value="executive">Executive (CEO)</option>
                <option value="leader">Leader (PM)</option>
                <option value="tech">Tech (Developer)</option>
                <option value="creative">Creative (Marketing)</option>
              </select>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="tm-apply-preset">Apply Role Preset Colors</button>
          </div>

          <div class="team-editor-preview-wrap">
            <h4 class="team-editor-label">Live Preview</h4>
            <div id="team-live-preview" class="team-preview-stage"></div>
          </div>
        </div>
        <div class="admin-project-actions">
          <button class="btn btn-secondary" id="cancel-team-btn" type="button">Cancel</button>
          <button class="btn btn-primary" id="save-team-btn" type="button">Save Member</button>
        </div>
      </div>
    </div>

    <div class="modal" id="team-delete-modal">
      <div class="card" style="max-width:420px;width:100%;">
        <h3 class="section-title">Delete Member?</h3>
        <p>This will remove the member from the public site.</p>
        <div class="admin-project-actions">
          <button class="btn btn-secondary" id="cancel-delete-team" type="button">Cancel</button>
          <button class="btn btn-danger" id="confirm-delete-team" type="button">Delete</button>
        </div>
      </div>
    </div>
  `;
}

const tbody = document.getElementById("team-list-body");
const empty = document.getElementById("team-empty");
const modal = document.getElementById("team-modal");
const deleteModal = document.getElementById("team-delete-modal");
const toastStack = document.getElementById("team-toast-stack");

let editingId = null;
let pendingDelete = null;
let allMembers = [];

const fields = {
  name: document.getElementById("tm-name"),
  role: document.getElementById("tm-role"),
  avatar: document.getElementById("tm-avatar"),
  title: document.getElementById("tm-title"),
  tagline: document.getElementById("tm-tagline"),
  highlight: document.getElementById("tm-highlight"),
  bio: document.getElementById("tm-bio"),
  email: document.getElementById("tm-email"),
  phone: document.getElementById("tm-phone"),
  linkedin: document.getElementById("tm-linkedin"),
  skills: document.getElementById("tm-skills"),
  stat1: document.getElementById("tm-stat1"),
  stat2: document.getElementById("tm-stat2"),
  order: document.getElementById("tm-order"),
  active: document.getElementById("tm-active"),
  accent: document.getElementById("tm-accent"),
  secondary: document.getElementById("tm-secondary"),
  layout: document.getElementById("tm-layout")
};

function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `users-toast users-toast-${type}`;
  t.textContent = msg;
  toastStack?.appendChild(t);
  setTimeout(() => t.remove(), 2300);
}

function parseStat(raw) {
  const parts = String(raw || "").split(":");
  if (parts.length < 2) return null;
  return { label: parts[0].trim(), value: parts.slice(1).join(":").trim() };
}

function readFormState() {
  const roleKey = fields.role.value;
  const preset = TEAM_ROLE_PRESETS[roleKey];
  const stats = [parseStat(fields.stat1.value), parseStat(fields.stat2.value)].filter(Boolean);
  const accent = fields.accent.value;
  const secondary = fields.secondary.value;
  return normalizeTeamMember({
    name: fields.name.value,
    roleKey,
    roleLabel: preset?.roleLabel,
    title: fields.title.value,
    tagline: fields.tagline.value,
    highlight: fields.highlight.value,
    bio: fields.bio.value,
    avatar: fields.avatar.value,
    email: fields.email.value,
    phone: fields.phone.value,
    linkedin: fields.linkedin.value,
    skills: fields.skills.value.split(",").map((s) => s.trim()).filter(Boolean),
    stats,
    order: parseInt(fields.order.value, 10) || 1,
    active: fields.active.value === "true",
    cardTheme: {
      accentColor: accent,
      secondaryColor: secondary,
      gradient: `linear-gradient(135deg, ${accent} 0%, ${secondary} 100%)`,
      borderColor: `${accent}66`,
      glowColor: `${accent}40`,
      layout: fields.layout.value
    }
  });
}

function updatePreview() {
  const preview = document.getElementById("team-live-preview");
  if (!preview) return;
  preview.innerHTML = renderTeamMemberCard(readFormState(), { preview: true });
}

function applyPresetToForm(roleKey) {
  const preset = applyRolePreset(roleKey);
  fields.title.value = preset.title || "";
  fields.tagline.value = preset.tagline || "";
  fields.avatar.value = preset.avatar || "👤";
  fields.accent.value = preset.cardTheme.accentColor;
  fields.secondary.value = preset.cardTheme.secondaryColor;
  fields.layout.value = preset.cardTheme.layout;
  updatePreview();
}

function fillForm(member) {
  const m = member || {};
  const theme = m.cardTheme || {};
  fields.name.value = m.name || "";
  fields.role.value = m.roleKey || "developer";
  fields.avatar.value = m.avatar || "👤";
  fields.title.value = m.title || "";
  fields.tagline.value = m.tagline || "";
  fields.highlight.value = m.highlight || "";
  fields.bio.value = m.bio || "";
  fields.email.value = m.email || "";
  fields.phone.value = m.phone || "";
  fields.linkedin.value = m.linkedin || "";
  fields.skills.value = (m.skills || []).join(", ");
  fields.stat1.value = m.stats?.[0] ? `${m.stats[0].label}:${m.stats[0].value}` : "";
  fields.stat2.value = m.stats?.[1] ? `${m.stats[1].label}:${m.stats[1].value}` : "";
  fields.order.value = m.order || 1;
  fields.active.value = m.active !== false ? "true" : "false";
  fields.accent.value = theme.accentColor || "#00C2FF";
  fields.secondary.value = theme.secondaryColor || "#7A5FFF";
  fields.layout.value = theme.layout || "tech";
  updatePreview();
}

function openModal(mode, member = null) {
  editingId = member?.id || null;
  document.getElementById("team-modal-title").textContent = mode === "edit" ? "Edit Team Member" : "Add Team Member";
  if (member) {
    fillForm(member);
  } else {
    applyPresetToForm("developer");
    fields.name.value = "";
    fields.bio.value = "";
    fields.highlight.value = "";
    fields.email.value = "";
    fields.phone.value = "";
    fields.linkedin.value = "";
    fields.skills.value = "";
    fields.stat1.value = "";
    fields.stat2.value = "";
    fields.order.value = allMembers.length + 1;
    fields.active.value = "true";
    updatePreview();
  }
  modal.classList.add("open");
}

function renderTable(members) {
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!members.length) {
    empty?.classList.add("show");
    return;
  }
  empty?.classList.remove("show");

  members.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.avatar || "👤"}</td>
      <td><strong>${m.name}</strong></td>
      <td><span class="users-badge badge-user">${m.roleLabel}</span></td>
      <td>${m.cardTheme?.layout || "—"}</td>
      <td>${m.order}</td>
      <td><span class="users-badge ${m.active ? "badge-active" : "badge-blocked"}">${m.active ? "Active" : "Hidden"}</span></td>
      <td>
        <div class="users-actions">
          <button class="users-action-btn action-edit" data-edit>Edit</button>
          <button class="users-action-btn" data-up>↑</button>
          <button class="users-action-btn" data-down>↓</button>
          <button class="users-action-btn action-delete" data-del>Delete</button>
        </div>
      </td>
    `;
    tr.querySelector("[data-edit]").addEventListener("click", () => openModal("edit", m));
    tr.querySelector("[data-del]").addEventListener("click", () => {
      pendingDelete = m;
      deleteModal.classList.add("open");
    });
    tr.querySelector("[data-up]").addEventListener("click", async () => {
      const prev = members.filter((x) => x.order < m.order).sort((a, b) => b.order - a.order)[0];
      if (!prev) return;
      await updateTeamMember(m.id, { ...m, order: prev.order });
      await updateTeamMember(prev.id, { ...prev, order: m.order });
    });
    tr.querySelector("[data-down]").addEventListener("click", async () => {
      const next = members.filter((x) => x.order > m.order).sort((a, b) => a.order - b.order)[0];
      if (!next) return;
      await updateTeamMember(m.id, { ...m, order: next.order });
      await updateTeamMember(next.id, { ...next, order: m.order });
    });
    tbody.appendChild(tr);
  });
}

Object.values(fields).forEach((el) => {
  el?.addEventListener("input", updatePreview);
  el?.addEventListener("change", updatePreview);
});

fields.role?.addEventListener("change", () => applyPresetToForm(fields.role.value));

document.getElementById("tm-apply-preset")?.addEventListener("click", () => applyPresetToForm(fields.role.value));
document.getElementById("add-team-btn")?.addEventListener("click", () => openModal("add"));
document.getElementById("cancel-team-btn")?.addEventListener("click", () => modal.classList.remove("open"));
document.getElementById("cancel-delete-team")?.addEventListener("click", () => {
  pendingDelete = null;
  deleteModal.classList.remove("open");
});
modal?.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });
deleteModal?.addEventListener("click", (e) => { if (e.target === deleteModal) deleteModal.classList.remove("open"); });

document.getElementById("confirm-delete-team")?.addEventListener("click", async () => {
  if (!pendingDelete) return;
  try {
    await deleteTeamMember(pendingDelete.id);
    showToast("Member deleted");
  } catch (e) {
    showToast("Delete failed", "error");
  }
  pendingDelete = null;
  deleteModal.classList.remove("open");
});

document.getElementById("save-team-btn")?.addEventListener("click", async () => {
  const data = readFormState();
  if (!data.name) {
    showToast("Name is required", "error");
    return;
  }
  const btn = document.getElementById("save-team-btn");
  btn.disabled = true;
  btn.textContent = "Saving...";
  try {
    if (editingId) {
      await updateTeamMember(editingId, data);
      showToast("Member updated");
    } else {
      await addTeamMember(data);
      showToast("Member added");
    }
    modal.classList.remove("open");
  } catch (e) {
    showToast("Save failed", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Member";
  }
});

getTeamMembers()
  .then((members) => {
    allMembers = members;
    renderTable(members);
  })
  .catch((err) => {
    console.error("Team initial load failed:", err);
    showToast("Failed to load team", "error");
  });

watchTeamMembers(
  (members) => {
    allMembers = members;
    renderTable(members);
  },
  (err) => {
    console.error("Team live sync failed:", err);
    showToast("Failed to load team", "error");
  }
);

import { getTech, addTech, updateTech, deleteTech } from "../firebase/firestore.js";
import { guardAdmin, mountAdminLayout } from "./layout.js";

if (!guardAdmin()) throw new Error("Unauthorized");

const layout = mountAdminLayout({
  active: "tech",
  title: "Technologies",
  subtitle: "Manage technology stack entries shown on the public site."
});

if (layout?.content) {
  layout.content.innerHTML = `
    <section class="card">
      <div class="admin-panel-header">
        <h2 class="section-title">Technology Stack</h2>
        <button class="btn btn-primary" id="add-tech-btn" type="button">+ Add Technology</button>
      </div>
      <div class="users-table-wrap">
        <table class="table">
          <thead><tr><th>Icon</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody id="tech-list-body"></tbody>
        </table>
      </div>
      <div id="tech-empty" class="users-empty-state">
        <div class="empty-icon">🧩</div>
        <h4>No technologies yet</h4>
        <p>Add your first technology to show on the public website.</p>
      </div>
    </section>

    <div class="modal" id="tech-modal">
      <div class="card">
        <h3 class="section-title" id="tech-modal-title">Add Technology</h3>
        <div class="form-group">
          <label class="label" for="tech-icon">Icon</label>
          <input class="input" id="tech-icon" type="text" placeholder="💡">
        </div>
        <div class="form-group">
          <label class="label" for="tech-name">Name</label>
          <input class="input" id="tech-name" type="text" placeholder="React">
        </div>
        <div class="form-group">
          <label class="label" for="tech-desc">Description</label>
          <textarea class="input" id="tech-desc" rows="3" placeholder="Short description"></textarea>
        </div>
        <div class="admin-project-actions">
          <button class="btn btn-secondary" id="cancel-tech-btn" type="button">Cancel</button>
          <button class="btn btn-primary" id="save-tech-btn" type="button">Save</button>
        </div>
      </div>
    </div>

    <div class="modal" id="tech-delete-modal">
      <div class="card">
        <h3 class="section-title">Delete Technology?</h3>
        <p class="section-subtitle" id="tech-delete-name">This entry will be removed from the public site.</p>
        <div class="admin-project-actions">
          <button class="btn btn-secondary" id="cancel-delete-tech" type="button">Cancel</button>
          <button class="btn btn-danger" id="confirm-delete-tech" type="button">Delete</button>
        </div>
      </div>
    </div>
  `;
}

const tbody = document.getElementById("tech-list-body");
const empty = document.getElementById("tech-empty");
const modal = document.getElementById("tech-modal");
const deleteModal = document.getElementById("tech-delete-modal");
const iconInput = document.getElementById("tech-icon");
const nameInput = document.getElementById("tech-name");
const descInput = document.getElementById("tech-desc");

let editingId = null;
let pendingDelete = null;
let allTech = [];

function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `users-toast users-toast-${type}`;
  t.textContent = msg;
  t.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:10px;background:#1a2340;color:#fff;";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2300);
}

function renderTable(list) {
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!list.length) {
    empty?.classList.add("show");
    return;
  }
  empty?.classList.remove("show");
  list.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.icon || "💡"}</td>
      <td><strong>${t.name || "-"}</strong></td>
      <td>${t.desc || "-"}</td>
      <td>
        <div class="users-actions">
          <button class="users-action-btn action-edit" data-edit>Edit</button>
          <button class="users-action-btn action-delete" data-del>Delete</button>
        </div>
      </td>
    `;
    tr.querySelector("[data-edit]").addEventListener("click", () => openModal("edit", t));
    tr.querySelector("[data-del]").addEventListener("click", () => {
      pendingDelete = t;
      document.getElementById("tech-delete-name").textContent = `Delete "${t.name}"?`;
      deleteModal.classList.add("open");
    });
    tbody.appendChild(tr);
  });
}

function openModal(mode, item = null) {
  editingId = item?.id || null;
  document.getElementById("tech-modal-title").textContent = mode === "edit" ? "Edit Technology" : "Add Technology";
  iconInput.value = item?.icon || "💡";
  nameInput.value = item?.name || "";
  descInput.value = item?.desc || "";
  modal.classList.add("open");
}

async function loadTech() {
  try {
    allTech = await getTech();
    renderTable(allTech);
  } catch (err) {
    console.error("Tech load failed:", err);
    showToast("Failed to load technologies", "error");
  }
}

document.getElementById("add-tech-btn")?.addEventListener("click", () => openModal("add"));
document.getElementById("cancel-tech-btn")?.addEventListener("click", () => modal.classList.remove("open"));
document.getElementById("cancel-delete-tech")?.addEventListener("click", () => {
  pendingDelete = null;
  deleteModal.classList.remove("open");
});
modal?.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });
deleteModal?.addEventListener("click", (e) => { if (e.target === deleteModal) deleteModal.classList.remove("open"); });

document.getElementById("save-tech-btn")?.addEventListener("click", async () => {
  const data = {
    icon: iconInput.value.trim() || "💡",
    name: nameInput.value.trim(),
    desc: descInput.value.trim()
  };
  if (!data.name) {
    showToast("Name is required", "error");
    return;
  }
  const btn = document.getElementById("save-tech-btn");
  btn.disabled = true;
  try {
    if (editingId) {
      await updateTech(editingId, data);
      showToast("Technology updated");
    } else {
      await addTech(data);
      showToast("Technology added");
    }
    modal.classList.remove("open");
    await loadTech();
  } catch (err) {
    console.error("Tech save failed:", err);
    showToast("Save failed", "error");
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("confirm-delete-tech")?.addEventListener("click", async () => {
  if (!pendingDelete) return;
  try {
    await deleteTech(pendingDelete.id);
    showToast("Technology deleted");
    await loadTech();
  } catch (err) {
    console.error("Tech delete failed:", err);
    showToast("Delete failed", "error");
  }
  pendingDelete = null;
  deleteModal.classList.remove("open");
});

loadTech();

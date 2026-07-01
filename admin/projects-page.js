import {
  addProject,
  deleteProject,
  updateProject,
  updateProjectProgress,
  watchProjects,
  DEFAULT_CATEGORIES,
  CATEGORY_KEYS,
  CATEGORY_ICONS,
  computeOverallProgress,
  normalizeProgress,
  normalizeTasks,
  normalizeCompletedSections,
  normalizeHistory,
  appendProgressHistory,
  slugify
} from "../firebase/firestore.js";
import { guardAdmin, mountAdminLayout } from "./layout.js";

if (!guardAdmin()) throw new Error("Unauthorized");
const layout = mountAdminLayout({
  active: "projects",
  title: "Projects",
  subtitle: "Track and review all portfolio projects."
});

if (layout?.content) {
  layout.content.innerHTML = `
    <section class="card">
      <div class="admin-panel-header">
        <h2 class="section-title">Project Management</h2>
        <button class="btn btn-primary" id="add-project-btn">+ Add Project</button>
      </div>
      <div class="users-table-wrap">
        <table class="table">
          <thead>
            <tr><th>Title</th><th>Tech</th><th>Status</th><th>Priority</th><th>Progress</th><th>Actions</th></tr>
          </thead>
          <tbody id="projects-list-body"></tbody>
        </table>
      </div>
      <div id="projects-empty" class="users-empty-state">
        <div class="empty-icon">📁</div>
        <h4>No data available</h4>
        <p>No projects available</p>
      </div>
    </section>

    <div class="modal" id="project-modal">
      <div class="card" style="max-width:560px;width:100%;">
        <h3 class="section-title" id="project-modal-title">Add Project</h3>
        <div class="form-group">
          <label class="label" for="pf-title">Title</label>
          <input class="input" id="pf-title" type="text" placeholder="Project title">
        </div>
        <div class="form-group">
          <label class="label" for="pf-desc">Description</label>
          <input class="input" id="pf-desc" type="text" placeholder="Project description">
        </div>
        <div class="form-group">
          <label class="label" for="pf-tech">Tech Stack (comma separated)</label>
          <input class="input" id="pf-tech" type="text" placeholder="React, Firebase">
        </div>
        <div class="grid-two">
          <div class="form-group">
            <label class="label" for="pf-status">Status</label>
            <select class="input" id="pf-status">
              <option value="upcoming">upcoming</option>
              <option value="running">running</option>
              <option value="completed">completed</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label" for="pf-priority">Priority</label>
            <select class="input" id="pf-priority">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
        </div>
        <div class="grid-two">
          <div class="form-group">
            <label class="label" for="pf-eta">ETA</label>
            <input class="input" id="pf-eta" type="text" placeholder="Jun 2026">
          </div>
          <div class="form-group">
            <label class="label" for="pf-modal-id">Modal ID (slug)</label>
            <input class="input" id="pf-modal-id" type="text" placeholder="fleet-tracking-suite">
          </div>
        </div>
        <div class="admin-project-actions">
          <button class="btn btn-secondary" id="cancel-project-btn">Cancel</button>
          <button class="btn btn-primary" id="save-project-btn">Save</button>
        </div>
      </div>
    </div>

    <div class="modal" id="project-delete-modal">
      <div class="card" style="max-width:420px;width:100%;">
        <h3 class="section-title">Delete Project?</h3>
        <p class="section-subtitle">This action cannot be undone.</p>
        <div class="admin-project-actions">
          <button class="btn btn-secondary" id="cancel-delete-btn">Cancel</button>
          <button class="btn btn-danger" id="confirm-delete-btn">Delete</button>
        </div>
      </div>
    </div>

    <div class="modal" id="progress-modal">
      <div class="card progress-editor-card premium-glass-panel">
        <div class="progress-editor-header">
          <div>
            <div class="progress-editor-label">Project Progress Tracker</div>
            <h3 class="section-title" id="progress-modal-title">Project</h3>
          </div>
          <div class="progress-editor-overall-ring" id="progress-overall-ring">0%</div>
          <button class="progress-editor-close" id="close-progress-modal" type="button">✕</button>
        </div>
        <div class="progress-editor-grid">
          <div class="progress-editor-panel premium-glass-panel">
            <div class="progress-editor-summary">
              <span id="progress-overall-label">Overall — 0%</span>
              <span id="progress-task-count" class="premium-pct-badge">0 Tasks</span>
            </div>
            <div id="progress-sliders"></div>
          </div>
          <div class="progress-editor-panel premium-glass-panel">
            <div class="progress-tasks-header">
              <span>Next Tasks</span>
              <button class="btn btn-secondary btn-sm progress-add-task-btn" id="add-task-btn" type="button">+ Add Task</button>
            </div>
            <div id="progress-tasks-list"></div>
          </div>
        </div>
        <div class="grid-two" style="margin-top:16px;">
          <div class="form-group">
            <label class="label" for="progress-start-date">🚀 Project Start Date</label>
            <input class="input" id="progress-start-date" type="text" placeholder="Jan 2025">
          </div>
          <div class="form-group">
            <label class="label" for="progress-eta">🗓 ETA</label>
            <input class="input" id="progress-eta" type="text" placeholder="Jun 2026">
          </div>
          <div class="form-group">
            <label class="label" for="progress-modal-id">Modal ID</label>
            <input class="input" id="progress-modal-id" type="text" placeholder="project-slug">
          </div>
        </div>
        <div class="progress-editor-panel premium-glass-panel progress-history-panel">
          <div class="progress-tasks-header">
            <span>📜 Progress History</span>
            <button class="btn btn-secondary btn-sm" id="add-history-note-btn" type="button">+ Add Note</button>
          </div>
          <div id="progress-history-list" class="progress-history-list"></div>
        </div>
        <div class="admin-project-actions">
          <button class="btn btn-secondary" id="cancel-progress-btn" type="button">Cancel</button>
          <button class="btn btn-primary" id="save-progress-btn" type="button">Save Progress</button>
        </div>
      </div>
    </div>
  `;
}

const body = document.getElementById("projects-list-body");
const empty = document.getElementById("projects-empty");
const modal = document.getElementById("project-modal");
const deleteModal = document.getElementById("project-delete-modal");
const progressModal = document.getElementById("progress-modal");
const titleEl = document.getElementById("pf-title");
const descEl = document.getElementById("pf-desc");
const techEl = document.getElementById("pf-tech");
const statusEl = document.getElementById("pf-status");
const priorityEl = document.getElementById("pf-priority");
const etaEl = document.getElementById("pf-eta");
const modalIdEl = document.getElementById("pf-modal-id");
const saveBtn = document.getElementById("save-project-btn");
const modalTitle = document.getElementById("project-modal-title");

let editingId = null;
let pendingDeleteId = null;
let progressProjectId = null;
let progressBaseline = { overall: 0 };
let progressState = {
  progress: normalizeProgress(),
  tasks: [],
  completedSections: normalizeCompletedSections(),
  startDate: "",
  history: []
};
let cachedProjects = [];

function resetForm() {
  editingId = null;
  modalTitle.textContent = "Add Project";
  titleEl.value = "";
  descEl.value = "";
  techEl.value = "";
  statusEl.value = "upcoming";
  priorityEl.value = "medium";
  etaEl.value = "";
  modalIdEl.value = "";
}

function openEdit(project) {
  editingId = project.id;
  modalTitle.textContent = "Edit Project";
  titleEl.value = project.title || "";
  descEl.value = project.description || "";
  techEl.value = (project.techStack || []).join(", ");
  statusEl.value = project.status || "upcoming";
  priorityEl.value = project.priority || "medium";
  etaEl.value = project.eta || "";
  modalIdEl.value = project.modalId || slugify(project.title);
  modal.classList.add("open");
}

titleEl?.addEventListener("input", () => {
  if (!modalIdEl.value || !editingId) {
    modalIdEl.value = slugify(titleEl.value);
  }
});

function buildSliderRow(key) {
  const cat = DEFAULT_CATEGORIES[key];
  const icon = CATEGORY_ICONS[key] || "📊";
  const val = progressState.progress[key] || 0;
  const done = !!progressState.completedSections[key];
  return `
    <div class="progress-cat-card premium-glass-panel ${done ? "section-complete" : ""}" data-cat="${key}">
      <div class="progress-cat-top">
        <div class="progress-cat-left">
          <span class="premium-cat-chip" style="background:${cat.color}33;border-color:${cat.color}66;">${icon}</span>
          <span class="progress-cat-name">${cat.label}</span>
          ${done ? '<span class="section-tick-badge">✅</span>' : ""}
        </div>
        <span class="progress-cat-val premium-pct-badge" style="color:${cat.color};border-color:${cat.color}66;background:${cat.color}18;">[${val}/100] ${val}%</span>
      </div>
      <input type="range" class="progress-cat-range" data-cat="${key}" min="0" max="100" value="${val}">
      <div class="progress-cat-bar-bg premium-bar-track">
        <div class="progress-cat-bar-fill premium-bar-fill" data-cat-fill="${key}" style="width:${val}%;background:${cat.gradient || cat.color};box-shadow:0 0 10px ${cat.color}55;"></div>
      </div>
      <button type="button" class="progress-section-tick ${done ? "is-done" : ""}" data-complete-cat="${key}">
        ${done ? "✅ Section Complete" : "○ Mark Section Complete"}
      </button>
    </div>
  `;
}

function renderProgressSliders() {
  const container = document.getElementById("progress-sliders");
  if (!container) return;
  container.innerHTML = CATEGORY_KEYS.map(buildSliderRow).join("");
  const overall = computeOverallProgress(progressState.progress);
  const overallLabel = document.getElementById("progress-overall-label");
  const taskCount = document.getElementById("progress-task-count");
  if (overallLabel) overallLabel.textContent = `Overall — ${overall}%`;
  const ring = document.getElementById("progress-overall-ring");
  if (ring) ring.textContent = `${overall}%`;
  if (taskCount) taskCount.textContent = `${progressState.tasks.length} Tasks`;

  container.querySelectorAll(".progress-cat-range").forEach((range) => {
    range.addEventListener("input", (e) => {
      const key = e.target.dataset.cat;
      const val = parseInt(e.target.value, 10) || 0;
      progressState.progress[key] = val;
      const row = container.querySelector(`[data-cat="${key}"]`);
      const valEl = row?.querySelector(".progress-cat-val");
      const fill = row?.querySelector(`[data-cat-fill="${key}"]`);
      if (valEl) {
        valEl.textContent = `[${val}/100] ${val}%`;
        valEl.style.color = DEFAULT_CATEGORIES[key].color;
      }
      if (fill) {
        fill.style.width = `${val}%`;
        fill.style.background = DEFAULT_CATEGORIES[key].gradient || DEFAULT_CATEGORIES[key].color;
        fill.style.boxShadow = `0 0 10px ${DEFAULT_CATEGORIES[key].color}55`;
      }
      const newOverall = computeOverallProgress(progressState.progress);
      if (overallLabel) overallLabel.textContent = `Overall — ${newOverall}%`;
      const ring = document.getElementById("progress-overall-ring");
      if (ring) ring.textContent = `${newOverall}%`;
    });
  });

  container.querySelectorAll("[data-complete-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.completeCat;
      progressState.completedSections[key] = !progressState.completedSections[key];
      renderProgressSliders();
    });
  });
}

function renderHistoryList() {
  const list = document.getElementById("progress-history-list");
  if (!list) return;
  const startDate = document.getElementById("progress-start-date")?.value.trim();
  const items = [];
  if (startDate) {
    items.push({
      id: "start",
      date: startDate,
      title: "Project Started",
      overallProgress: 0,
      note: "Development kickoff",
      isStart: true
    });
  }
  items.push(...progressState.history);

  if (!items.length) {
    list.innerHTML = `<div class="progress-history-empty">No history yet. Save progress or add a note.</div>`;
    return;
  }

  list.innerHTML = items
    .map((h) => `
      <div class="progress-history-item ${h.isStart ? "is-start" : ""}" data-history-id="${h.id}">
        <div class="progress-history-dot">${h.isStart ? "🚀" : "📈"}</div>
        <div class="progress-history-body">
          <div class="progress-history-top">
            <span class="progress-history-date">${h.date || "—"}</span>
            <span class="progress-history-pct">${h.overallProgress}%</span>
          </div>
          <div class="progress-history-title">${h.title}</div>
          ${h.note ? `<div class="progress-history-note">${h.note}</div>` : ""}
        </div>
        ${!h.isStart ? `<button type="button" class="progress-history-del" data-del-history="${h.id}" title="Delete">✕</button>` : ""}
      </div>
    `)
    .join("");

  list.querySelectorAll("[data-del-history]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delHistory;
      progressState.history = progressState.history.filter((h) => h.id !== id);
      renderHistoryList();
    });
  });
}

function renderTasksList() {
  const list = document.getElementById("progress-tasks-list");
  if (!list) return;
  if (!progressState.tasks.length) {
    list.innerHTML = `<div class="progress-tasks-empty">
      <div class="progress-tasks-empty-icon">📋</div>
      <p>No tasks yet</p>
      <span>Add the next work item to track progress</span>
    </div>`;
    return;
  }

  list.innerHTML = progressState.tasks
    .map((task, idx) => {
      const icon = task.status === "active" ? "⚡" : task.status === "done" ? "✅" : "🔜";
      const statusClass = `task-row-${task.status}`;
      return `
        <div class="progress-task-card ${statusClass}" data-task-idx="${idx}">
          <div class="progress-task-status-strip progress-task-strip-${task.status}"></div>
          <span class="progress-task-icon">${icon}</span>
          <input class="input progress-task-title" data-task-idx="${idx}" value="${task.title}" placeholder="Task title">
          <select class="input progress-task-cat" data-task-idx="${idx}">
            ${CATEGORY_KEYS.map((k) => `<option value="${k}" ${task.category === k ? "selected" : ""}>${DEFAULT_CATEGORIES[k].label}</option>`).join("")}
          </select>
          <select class="input progress-task-status" data-task-idx="${idx}">
            <option value="locked" ${task.status === "locked" ? "selected" : ""}>Coming Update</option>
            <option value="active" ${task.status === "active" ? "selected" : ""}>In Progress</option>
            <option value="done" ${task.status === "done" ? "selected" : ""}>Completed</option>
          </select>
          <div class="progress-task-actions">
            <button type="button" class="users-action-btn" data-move-up="${idx}" title="Move up">↑</button>
            <button type="button" class="users-action-btn" data-move-down="${idx}" title="Move down">↓</button>
            <button type="button" class="users-action-btn action-delete" data-del-task="${idx}" title="Delete">🗑</button>
          </div>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll(".progress-task-title").forEach((el) => {
    el.addEventListener("input", (e) => {
      const idx = parseInt(e.target.dataset.taskIdx, 10);
      progressState.tasks[idx].title = e.target.value;
    });
  });
  list.querySelectorAll(".progress-task-cat").forEach((el) => {
    el.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.taskIdx, 10);
      progressState.tasks[idx].category = e.target.value;
      renderTasksList();
    });
  });
  list.querySelectorAll(".progress-task-status").forEach((el) => {
    el.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.taskIdx, 10);
      progressState.tasks[idx].status = e.target.value;
      renderTasksList();
    });
  });
  list.querySelectorAll("[data-move-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.moveUp, 10);
      if (idx <= 0) return;
      const tmp = progressState.tasks[idx - 1];
      progressState.tasks[idx - 1] = progressState.tasks[idx];
      progressState.tasks[idx] = tmp;
      progressState.tasks = normalizeTasks(progressState.tasks);
      renderTasksList();
    });
  });
  list.querySelectorAll("[data-move-down]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.moveDown, 10);
      if (idx >= progressState.tasks.length - 1) return;
      const tmp = progressState.tasks[idx + 1];
      progressState.tasks[idx + 1] = progressState.tasks[idx];
      progressState.tasks[idx] = tmp;
      progressState.tasks = normalizeTasks(progressState.tasks);
      renderTasksList();
    });
  });
  list.querySelectorAll("[data-del-task]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.delTask, 10);
      progressState.tasks.splice(idx, 1);
      progressState.tasks = normalizeTasks(progressState.tasks);
      renderTasksList();
      const taskCount = document.getElementById("progress-task-count");
      if (taskCount) taskCount.textContent = `${progressState.tasks.length} Tasks`;
    });
  });
}

function openProgressEditor(project) {
  progressProjectId = project.id;
  progressBaseline = {
    overall: project.overallProgress ?? computeOverallProgress(project.progress)
  };
  progressState = {
    progress: normalizeProgress(project.progress),
    tasks: normalizeTasks(project.tasks || []),
    completedSections: normalizeCompletedSections(project.completedSections),
    startDate: project.startDate || "",
    history: normalizeHistory(project.history || [])
  };
  document.getElementById("progress-modal-title").textContent = project.title || "Project";
  document.getElementById("progress-start-date").value = project.startDate || "";
  document.getElementById("progress-eta").value = project.eta || "";
  document.getElementById("progress-modal-id").value = project.modalId || slugify(project.title);
  renderProgressSliders();
  renderTasksList();
  renderHistoryList();
  progressModal.classList.add("open");
}

document.getElementById("add-project-btn")?.addEventListener("click", () => {
  resetForm();
  modal.classList.add("open");
});
document.getElementById("cancel-project-btn")?.addEventListener("click", () => modal.classList.remove("open"));
modal?.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("open");
});

document.getElementById("cancel-delete-btn")?.addEventListener("click", () => {
  pendingDeleteId = null;
  deleteModal.classList.remove("open");
});
document.getElementById("confirm-delete-btn")?.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  await deleteProject(pendingDeleteId);
  pendingDeleteId = null;
  deleteModal.classList.remove("open");
});
deleteModal?.addEventListener("click", (e) => {
  if (e.target === deleteModal) deleteModal.classList.remove("open");
});

document.getElementById("close-progress-modal")?.addEventListener("click", () => progressModal.classList.remove("open"));
document.getElementById("cancel-progress-btn")?.addEventListener("click", () => progressModal.classList.remove("open"));
progressModal?.addEventListener("click", (e) => {
  if (e.target === progressModal) progressModal.classList.remove("open");
});

document.getElementById("progress-start-date")?.addEventListener("input", () => {
  progressState.startDate = document.getElementById("progress-start-date").value.trim();
  renderHistoryList();
});

document.getElementById("add-history-note-btn")?.addEventListener("click", () => {
  const note = prompt("Add history note (what was completed?):");
  if (!note || !note.trim()) return;
  const overall = computeOverallProgress(progressState.progress);
  progressState.history = appendProgressHistory(
    progressState.history,
    overall,
    overall,
    progressState.progress,
    note.trim()
  );
  renderHistoryList();
});

document.getElementById("add-task-btn")?.addEventListener("click", () => {
  progressState.tasks.push({
    id: `t${Date.now()}`,
    title: "",
    category: "ui",
    status: "locked",
    order: progressState.tasks.length + 1
  });
  progressState.tasks = normalizeTasks(progressState.tasks);
  renderTasksList();
  const taskCount = document.getElementById("progress-task-count");
  if (taskCount) taskCount.textContent = `${progressState.tasks.length} Tasks`;
});

document.getElementById("save-progress-btn")?.addEventListener("click", async () => {
  if (!progressProjectId) return;
  const saveProgressBtn = document.getElementById("save-progress-btn");
  const originalText = saveProgressBtn.textContent;
  saveProgressBtn.disabled = true;
  saveProgressBtn.textContent = "Saving...";
  try {
    const newOverall = computeOverallProgress(progressState.progress);
    const history = appendProgressHistory(
      progressState.history,
      progressBaseline.overall,
      newOverall,
      progressState.progress
    );
    await updateProjectProgress(progressProjectId, {
      progress: progressState.progress,
      tasks: normalizeTasks(progressState.tasks.filter((t) => t.title.trim())),
      completedSections: progressState.completedSections,
      startDate: document.getElementById("progress-start-date").value.trim(),
      history,
      eta: document.getElementById("progress-eta").value.trim(),
      modalId: document.getElementById("progress-modal-id").value.trim()
    });
    progressState.history = history;
    progressBaseline.overall = newOverall;
    saveProgressBtn.textContent = "Saved!";
    saveProgressBtn.classList.add("btn-success-flash");
    setTimeout(() => {
      progressModal.classList.remove("open");
      saveProgressBtn.textContent = originalText;
      saveProgressBtn.classList.remove("btn-success-flash");
      saveProgressBtn.disabled = false;
    }, 600);
  } catch (e) {
    saveProgressBtn.textContent = "Error — Retry";
    saveProgressBtn.disabled = false;
    setTimeout(() => { saveProgressBtn.textContent = originalText; }, 1500);
  }
});

saveBtn?.addEventListener("click", async () => {
  const payload = {
    title: titleEl.value.trim(),
    description: descEl.value.trim(),
    techStack: techEl.value,
    status: statusEl.value,
    priority: priorityEl.value,
    eta: etaEl.value.trim(),
    modalId: modalIdEl.value.trim() || slugify(titleEl.value.trim())
  };
  if (!payload.title || !payload.description) return;
  saveBtn.disabled = true;
  if (editingId) {
    await updateProject(editingId, payload);
  } else {
    await addProject(payload);
  }
  saveBtn.disabled = false;
  modal.classList.remove("open");
});

watchProjects((projects) => {
  cachedProjects = projects;
  if (!body) return;
  if (!projects.length) {
    body.innerHTML = "";
    empty?.classList.add("show");
    return;
  }
  empty?.classList.remove("show");
  body.innerHTML = projects.map((p) => {
    const statusClass = p.status === "running" ? "badge-info" : p.status === "completed" ? "badge-success" : "badge-warning";
    const priorityClass = p.priority === "high" ? "badge-danger" : p.priority === "medium" ? "badge-warning" : "badge-success";
    const pct = p.overallProgress ?? computeOverallProgress(p.progress);
    return `
      <tr>
        <td>${p.title || "-"}</td>
        <td>${(p.techStack || []).join(", ") || "-"}</td>
        <td><span class="badge ${statusClass}">${p.status || "upcoming"}</span></td>
        <td><span class="badge ${priorityClass}">${p.priority || "medium"}</span></td>
        <td>
          <div class="table-progress-cell">
            <div class="table-progress-bar"><div class="table-progress-fill" style="width:${pct}%;"></div></div>
            <span class="table-progress-pct">${pct}%</span>
          </div>
        </td>
        <td>
          <div class="users-actions">
            <button class="users-action-btn action-edit" data-edit="${p.id}">✏ Edit</button>
            <button class="users-action-btn action-progress progress-btn-gradient" data-progress="${p.id}">📊 Progress</button>
            <button class="users-action-btn action-delete" data-delete="${p.id}">🗑 Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  projects.forEach((project) => {
    body.querySelector(`[data-edit="${project.id}"]`)?.addEventListener("click", () => openEdit(project));
    body.querySelector(`[data-progress="${project.id}"]`)?.addEventListener("click", () => openProgressEditor(project));
    body.querySelector(`[data-delete="${project.id}"]`)?.addEventListener("click", () => {
      pendingDeleteId = project.id;
      deleteModal.classList.add("open");
    });
  });
}, () => {});

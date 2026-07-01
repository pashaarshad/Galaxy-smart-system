import {
  addUser,
  deleteUser,
  updateUser,
  watchUsers,
  getOrdersByUser,
  formatUserDate
} from "../firebase/firestore.js";
import { guardAdmin, mountAdminLayout } from "./layout.js";

if (!guardAdmin()) {
  throw new Error("Unauthorized");
}

const layout = mountAdminLayout({
  active: "users",
  title: "User Management",
  subtitle: "Manage user access, roles, and account status."
});
const usersTemplate = document.getElementById("users-page-template");
if (layout?.content && usersTemplate) {
  layout.content.innerHTML = usersTemplate.innerHTML;
}

const tbody = document.getElementById("users-tbody");
const mobileList = document.getElementById("users-mobile-list");
const errorBox = document.getElementById("users-error");
const emptyBox = document.getElementById("users-empty");
const skeleton = document.getElementById("users-skeleton");
const addBtn = document.getElementById("add-user-btn");
const modal = document.getElementById("user-modal");
const modalTitle = document.getElementById("user-modal-title");
const saveBtn = document.getElementById("save-user-btn");
const cancelBtn = document.getElementById("cancel-user-btn");
const toastStack = document.getElementById("users-toast-stack");
const statTotal = document.getElementById("stat-total-users");
const statActive = document.getElementById("stat-active-users");
const statBlocked = document.getElementById("stat-blocked-users");
const statAdmin = document.getElementById("stat-admin-users");
const confirmModal = document.getElementById("confirm-modal");
const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const searchInput = document.getElementById("users-search");
const filterRole = document.getElementById("users-filter-role");
const filterStatus = document.getElementById("users-filter-status");
const exportBtn = document.getElementById("users-export-btn");
const detailModal = document.getElementById("user-detail-modal");
const detailBody = document.getElementById("user-detail-body");
const closeDetailBtn = document.getElementById("close-detail-btn");
const detailEditBtn = document.getElementById("detail-edit-btn");
const detailToggleBtn = document.getElementById("detail-toggle-btn");
const passwordWrap = document.getElementById("um-password-wrap");
const confirmWrap = document.getElementById("um-confirm-wrap");

const nameInput = document.getElementById("um-name");
const emailInput = document.getElementById("um-email");
const phoneInput = document.getElementById("um-phone");
const roleInput = document.getElementById("um-role");
const statusInput = document.getElementById("um-status");
const passwordInput = document.getElementById("um-password");
const confirmInput = document.getElementById("um-confirm");

let editingId = null;
let pendingDeleteUser = null;
let allUsers = [];
let detailUser = null;

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `users-toast users-toast-${type}`;
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
    setTimeout(() => toast.remove(), 250);
  }, 2300);
}

function showError(message) {
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.classList.add("show");
}

function clearError() {
  if (!errorBox) return;
  errorBox.classList.remove("show");
  errorBox.textContent = "";
}

function initials(name) {
  const parts = String(name || "").trim().split(" ").filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getFilteredUsers() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  const role = filterRole?.value || "all";
  const status = filterStatus?.value || "all";

  return allUsers.filter((user) => {
    const matchSearch = !q
      || (user.name || "").toLowerCase().includes(q)
      || (user.email || "").toLowerCase().includes(q);
    const matchRole = role === "all" || user.role === role;
    const matchStatus = status === "all" || user.status === status;
    return matchSearch && matchRole && matchStatus;
  });
}

function openModal(mode, user = null) {
  editingId = user?.id || null;
  modalTitle.textContent = mode === "edit" ? "Edit User" : "Add New User";
  nameInput.value = user?.name || "";
  emailInput.value = user?.email || "";
  phoneInput.value = user?.phone || "";
  roleInput.value = user?.role || "user";
  statusInput.value = user?.status || "active";
  passwordInput.value = "";
  confirmInput.value = "";

  const isAdd = mode === "add";
  passwordWrap.style.display = isAdd ? "" : "none";
  confirmWrap.style.display = isAdd ? "" : "none";
  modal.classList.add("open");
}

function closeModal() {
  modal.classList.remove("open");
  editingId = null;
}

function openDeleteConfirm(user) {
  pendingDeleteUser = user;
  confirmModal.classList.add("open");
}

function closeDeleteConfirm() {
  pendingDeleteUser = null;
  confirmModal.classList.remove("open");
}

function closeDetailModal() {
  detailModal.classList.remove("open");
  detailUser = null;
}

async function openDetailModal(user) {
  detailUser = user;
  detailModal.classList.add("open");
  detailBody.innerHTML = `<div class="users-detail-loading">Loading profile...</div>`;

  let orders = [];
  try {
    orders = await getOrdersByUser(user.email);
  } catch (e) {
    orders = [];
  }

  const recentOrders = orders.slice(0, 3).map((o) => `
    <div class="users-detail-order">
      <span>${o.title || "Order"}</span>
      <span class="users-badge badge-user">${o.status || "pending"}</span>
    </div>
  `).join("") || `<div class="users-detail-empty">No orders yet</div>`;

  detailBody.innerHTML = `
    <div class="users-detail-profile">
      <div class="users-avatar users-avatar-lg">${initials(user.name)}</div>
      <div>
        <h4>${user.name || "User"}</h4>
        <p>${user.email || "—"}</p>
      </div>
    </div>
    <div class="users-detail-grid">
      <div><span>Role</span><strong>${user.role || "user"}</strong></div>
      <div><span>Status</span><strong>${user.status || "active"}</strong></div>
      <div><span>Phone</span><strong>${user.phone || "—"}</strong></div>
      <div><span>Source</span><strong>${user.source || "—"}</strong></div>
      <div><span>Joined</span><strong>${formatUserDate(user.createdAt)}</strong></div>
      <div><span>Last Login</span><strong>${formatUserDate(user.lastLoginAt)}</strong></div>
    </div>
    <div class="users-detail-orders">
      <h5>Orders (${orders.length})</h5>
      ${recentOrders}
    </div>
  `;

  detailToggleBtn.textContent = user.status === "blocked" ? "✅ Activate" : "⛔ Block";
}

async function toggleUserStatus(user) {
  clearError();
  try {
    await updateUser(user.id, {
      ...user,
      status: user.status === "blocked" ? "active" : "blocked"
    });
    showToast("Status updated");
    if (detailUser?.id === user.id) {
      detailUser = { ...user, status: user.status === "blocked" ? "active" : "blocked" };
      openDetailModal(detailUser);
    }
  } catch (error) {
    showError("Failed to update status.");
  }
}

function updateStats(users) {
  statTotal.textContent = users.length;
  statActive.textContent = users.filter((u) => u.status === "active").length;
  statBlocked.textContent = users.filter((u) => u.status === "blocked").length;
  statAdmin.textContent = users.filter((u) => u.role === "admin").length;
}

function exportCsv(users) {
  const rows = [
    ["Name", "Email", "Role", "Status", "Phone", "Source", "Joined"],
    ...users.map((u) => [
      u.name || "",
      u.email || "",
      u.role || "",
      u.status || "",
      u.phone || "",
      u.source || "",
      formatUserDate(u.createdAt)
    ])
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `galaxy-users-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV exported");
}

function renderRows(users) {
  tbody.innerHTML = "";
  mobileList.innerHTML = "";
  updateStats(allUsers);

  if (!users.length) {
    emptyBox.classList.add("show");
    return;
  }
  emptyBox.classList.remove("show");

  users.forEach((user, index) => {
    const joined = formatUserDate(user.createdAt);
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${index * 70}ms`;
    tr.classList.add("users-row-in");
    tr.innerHTML = `
      <td>
        <div class="users-user-cell">
          <div class="users-avatar">${initials(user.name)}</div>
          <span>${user.name || "-"}</span>
        </div>
      </td>
      <td>${user.email || "-"}</td>
      <td><span class="users-badge ${user.role === "admin" ? "badge-admin" : "badge-user"}">${user.role || "user"}</span></td>
      <td><span class="users-badge ${user.status === "blocked" ? "badge-blocked" : "badge-active"}">${user.status || "active"}</span></td>
      <td class="users-joined">${joined}</td>
      <td>
        <div class="users-actions">
          <button class="users-action-btn action-view" title="View user" data-action="view" data-id="${user.id}">👁 View</button>
          <button class="users-action-btn action-edit" title="Edit user" data-action="edit" data-id="${user.id}">✏ Edit</button>
          <button class="users-action-btn action-delete" title="Delete user" data-action="delete" data-id="${user.id}">🗑 Delete</button>
          <button class="users-action-btn action-toggle" title="Toggle status" data-action="toggle" data-id="${user.id}">
            ${user.status === "blocked" ? "✅ Activate" : "⛔ Block"}
          </button>
        </div>
      </td>
    `;

    tr.querySelector('[data-action="view"]').addEventListener("click", () => openDetailModal(user));
    tr.querySelector('[data-action="edit"]').addEventListener("click", () => openModal("edit", user));
    tr.querySelector('[data-action="delete"]').addEventListener("click", () => openDeleteConfirm(user));
    tr.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleUserStatus(user));
    tbody.appendChild(tr);

    const card = document.createElement("article");
    card.className = "users-mobile-card glass-card";
    card.style.animationDelay = `${index * 80}ms`;
    card.innerHTML = `
      <div class="users-mobile-top">
        <div class="users-user-cell">
          <div class="users-avatar">${initials(user.name)}</div>
          <div>
            <strong>${user.name || "-"}</strong>
            <p>${user.email || "-"}</p>
            <small class="users-joined">Joined ${joined}</small>
          </div>
        </div>
      </div>
      <div class="users-mobile-meta">
        <span class="users-badge ${user.role === "admin" ? "badge-admin" : "badge-user"}">${user.role || "user"}</span>
        <span class="users-badge ${user.status === "blocked" ? "badge-blocked" : "badge-active"}">${user.status || "active"}</span>
      </div>
      <div class="users-actions">
        <button class="users-action-btn action-view" data-action="view">👁 View</button>
        <button class="users-action-btn action-edit" data-action="edit">✏ Edit</button>
        <button class="users-action-btn action-delete" data-action="delete">🗑 Delete</button>
        <button class="users-action-btn action-toggle" data-action="toggle">${user.status === "blocked" ? "✅ Activate" : "⛔ Block"}</button>
      </div>
    `;
    card.querySelector('[data-action="view"]').addEventListener("click", () => openDetailModal(user));
    card.querySelector('[data-action="edit"]').addEventListener("click", () => openModal("edit", user));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => openDeleteConfirm(user));
    card.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleUserStatus(user));
    mobileList.appendChild(card);
  });
}

function refreshView() {
  renderRows(getFilteredUsers());
}

addBtn.addEventListener("click", () => openModal("add"));
cancelBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) closeDeleteConfirm();
});
detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal) closeDetailModal();
});
confirmCancelBtn.addEventListener("click", closeDeleteConfirm);
closeDetailBtn.addEventListener("click", closeDetailModal);
detailEditBtn.addEventListener("click", () => {
  if (!detailUser) return;
  closeDetailModal();
  openModal("edit", detailUser);
});
detailToggleBtn.addEventListener("click", () => {
  if (!detailUser) return;
  toggleUserStatus(detailUser);
});

searchInput?.addEventListener("input", refreshView);
filterRole?.addEventListener("change", refreshView);
filterStatus?.addEventListener("change", refreshView);
exportBtn?.addEventListener("click", () => exportCsv(getFilteredUsers()));

confirmDeleteBtn.addEventListener("click", async () => {
  if (!pendingDeleteUser) return;
  try {
    await deleteUser(pendingDeleteUser.id);
    showToast("User deleted");
  } catch (error) {
    showError("Failed to delete user.");
  } finally {
    closeDeleteConfirm();
  }
});

saveBtn.addEventListener("click", async () => {
  clearError();
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    role: roleInput.value,
    status: statusInput.value
  };

  if (!payload.name || !payload.email) {
    showError("Name and email are required.");
    return;
  }

  if (!editingId) {
    const pass = passwordInput.value;
    const confirm = confirmInput.value;
    if (pass.length < 8) {
      showError("Password must be at least 8 characters.");
      return;
    }
    if (pass !== confirm) {
      showError("Passwords do not match.");
      return;
    }
    payload.password = pass;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="btn-spinner"></span>Saving...';
  try {
    if (editingId) {
      await updateUser(editingId, payload);
      showToast("User updated");
    } else {
      await addUser(payload);
      showToast("User created with login access");
    }
    closeModal();
  } catch (error) {
    if (error.message === "EMAIL_EXISTS") {
      showError("This email is already registered.");
    } else if (error.code === "auth/email-already-in-use") {
      showError("This email already has a Firebase Auth account.");
    } else if (error.code === "auth/weak-password") {
      showError("Password is too weak.");
    } else {
      showError("Failed to save user.");
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

watchUsers(
  (users) => {
    clearError();
    skeleton.classList.remove("show");
    allUsers = users;
    refreshView();
  },
  () => {
    skeleton.classList.remove("show");
    showError("Unable to fetch users from Firestore.");
    showToast("Failed to fetch users", "error");
  }
);

skeleton.classList.add("show");

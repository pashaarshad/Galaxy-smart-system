import { deleteOrder, updateOrderStatus, watchOrders } from "../firebase/firestore.js";
import { guardAdmin, mountAdminLayout } from "./layout.js";

if (!guardAdmin()) throw new Error("Unauthorized");
const layout = mountAdminLayout({
  active: "orders",
  title: "Order Management",
  subtitle: "View and manage incoming client orders in real-time."
});

if (layout?.content) {
  layout.content.innerHTML = `
    <section class="users-stats">
      <article class="users-stat card"><span>Total Orders</span><strong id="ord-total">0</strong></article>
      <article class="users-stat card"><span>Pending</span><strong id="ord-pending">0</strong></article>
      <article class="users-stat card"><span>In Progress</span><strong id="ord-progress">0</strong></article>
      <article class="users-stat card"><span>Completed</span><strong id="ord-completed">0</strong></article>
    </section>
    <section class="card mt-16">
      <div class="users-table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>User Email</th><th>Type</th><th>Title</th><th>Budget</th><th>Deadline</th><th>Priority</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="orders-body"></tbody>
        </table>
      </div>
      <div id="orders-empty" class="users-empty-state">
        <div class="empty-icon">🧾</div>
        <h4>No data available</h4>
        <p>No orders found</p>
      </div>
    </section>
    <div class="modal" id="order-details-modal">
      <div class="card" style="max-width:620px;width:100%;">
        <h3 class="section-title">Order Details</h3>
        <div id="order-details-content"></div>
        <div class="admin-project-actions mt-16">
          <button class="btn btn-secondary" id="order-details-close">Close</button>
        </div>
      </div>
    </div>
  `;
}

const body = document.getElementById("orders-body");
const empty = document.getElementById("orders-empty");
const modal = document.getElementById("order-details-modal");
const content = document.getElementById("order-details-content");
document.getElementById("order-details-close")?.addEventListener("click", () => modal.classList.remove("open"));
modal?.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });

function badgeStatus(status) {
  if (status === "completed") return "badge-success";
  if (status === "in-progress") return "badge-info";
  return "badge-warning";
}
function badgePriority(priority) {
  if (priority === "high") return "badge-danger";
  if (priority === "medium") return "badge-warning";
  return "badge-success";
}

watchOrders((orders) => {
  const total = orders.length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const inProgress = orders.filter((o) => o.status === "in-progress").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
  set("ord-total", total);
  set("ord-pending", pending);
  set("ord-progress", inProgress);
  set("ord-completed", completed);

  if (!body) return;
  if (!orders.length) {
    body.innerHTML = "";
    empty?.classList.add("show");
    return;
  }
  empty?.classList.remove("show");

  body.innerHTML = orders.map((o) => `
    <tr>
      <td>${o.userEmail || "-"}</td>
      <td>${o.type || "-"}</td>
      <td>${o.title || "-"}</td>
      <td>${o.budget || "-"}</td>
      <td>${o.deadline || "-"}</td>
      <td><span class="badge ${badgePriority(o.priority)}">${o.priority || "medium"}</span></td>
      <td>
        <select class="input" data-status="${o.id}" style="min-width:120px;">
          <option value="pending" ${o.status === "pending" ? "selected" : ""}>pending</option>
          <option value="in-progress" ${o.status === "in-progress" ? "selected" : ""}>in-progress</option>
          <option value="completed" ${o.status === "completed" ? "selected" : ""}>completed</option>
        </select>
      </td>
      <td>
        <div class="users-actions">
          <button class="users-action-btn action-edit" data-view="${o.id}">View</button>
          <button class="users-action-btn action-delete" data-del="${o.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  orders.forEach((o) => {
    body.querySelector(`[data-status="${o.id}"]`)?.addEventListener("change", async (e) => {
      await updateOrderStatus(o.id, e.target.value);
    });
    body.querySelector(`[data-view="${o.id}"]`)?.addEventListener("click", () => {
      content.innerHTML = `
        <p><strong>User:</strong> ${o.userEmail || "-"}</p>
        <p><strong>Type:</strong> ${o.type || "-"}</p>
        <p><strong>Title:</strong> ${o.title || "-"}</p>
        <p><strong>Description:</strong> ${o.description || "-"}</p>
        <p><strong>Budget:</strong> ${o.budget || "-"}</p>
        <p><strong>Deadline:</strong> ${o.deadline || "-"}</p>
        <p><strong>Priority:</strong> <span class="badge ${badgePriority(o.priority)}">${o.priority || "medium"}</span></p>
        <p><strong>Status:</strong> <span class="badge ${badgeStatus(o.status)}">${o.status || "pending"}</span></p>
      `;
      modal.classList.add("open");
    });
    body.querySelector(`[data-del="${o.id}"]`)?.addEventListener("click", async () => {
      if (!confirm("Delete this order?")) return;
      await deleteOrder(o.id);
    });
  });
}, () => {});

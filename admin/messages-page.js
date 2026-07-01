import { getMessages } from "../firebase/firestore.js";
import { guardAdmin, mountAdminLayout } from "./layout.js";

if (!guardAdmin()) throw new Error("Unauthorized");
const layout = mountAdminLayout({
  active: "messages",
  title: "Messages",
  subtitle: "Review user inquiries and support messages."
});

if (layout?.content) {
  layout.content.innerHTML = `
    <section class="grid-two">
      <article class="card">
        <h3 class="section-title">Inbox Summary</h3>
        <p class="section-subtitle">Recent messages from contact form are shown below.</p>
        <div class="badge badge-info" id="msg-count-badge">Messages: 0</div>
      </article>
      <article class="card empty-state-card hidden" id="msg-empty-card">
        <div class="empty-icon">📭</div>
        <h4>No data available</h4>
        <p>No messages have been received yet.</p>
      </article>
    </section>
    <section class="card mt-16" id="msg-table-card">
      <table class="table">
        <thead>
          <tr><th>Type</th><th>Name</th><th>Email</th><th>Message</th><th>Date</th></tr>
        </thead>
        <tbody id="msg-table-body"></tbody>
      </table>
    </section>
  `;
}

getMessages().then((messages) => {
  const body = document.getElementById("msg-table-body");
  const countBadge = document.getElementById("msg-count-badge");
  const emptyCard = document.getElementById("msg-empty-card");
  const tableCard = document.getElementById("msg-table-card");
  if (countBadge) countBadge.textContent = `Messages: ${messages.length}`;
  if (!body) return;
  if (!messages.length) {
    emptyCard.classList.remove("hidden");
    tableCard.classList.add("hidden");
    return;
  }
  body.innerHTML = messages.map((m) => `
    <tr>
      <td><span class="users-badge ${m.type === "support" ? "badge-user" : "badge-active"}">${m.type === "support" ? "Support" : "Contact"}</span></td>
      <td>${m.name || "-"}</td>
      <td>${m.email || "-"}</td>
      <td class="message-preview">${m.subject ? `<strong>${m.subject}</strong><br>` : ""}${m.message || "-"}</td>
      <td>${m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : "-"}</td>
    </tr>
  `).join("");
}).catch((err) => {
  console.error("Messages load failed:", err);
  const emptyCard = document.getElementById("msg-empty-card");
  const tableCard = document.getElementById("msg-table-card");
  emptyCard?.classList.remove("hidden");
  tableCard?.classList.add("hidden");
  if (emptyCard) {
    emptyCard.querySelector("h4").textContent = "Failed to load messages";
    emptyCard.querySelector("p").textContent = err?.message || "Check Firebase connection and try again.";
  }
});

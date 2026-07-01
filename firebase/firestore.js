import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { createAuthUserAccount } from "./user-auth-admin.js";

export const DEFAULT_CATEGORIES = {
  ui: { label: "UI", color: "#00FFD1", gradient: "linear-gradient(90deg, #00FFD1, #00C2FF)" },
  bugs: { label: "Bugs Fix", color: "#FF4B6E", gradient: "linear-gradient(90deg, #FF4B6E, #FF8A65)" },
  code: { label: "Code Write", color: "#00C2FF", gradient: "linear-gradient(90deg, #00C2FF, #4D9FFF)" },
  logic: { label: "Logic Write", color: "#FFB800", gradient: "linear-gradient(90deg, #FFB800, #FF8C00)" },
  backend: { label: "Backend", color: "#7A5FFF", gradient: "linear-gradient(90deg, #7A5FFF, #B06FFF)" }
};

export const CATEGORY_KEYS = ["ui", "bugs", "code", "logic", "backend"];

export const CATEGORY_ICONS = {
  ui: "🎨",
  bugs: "🐛",
  code: "💻",
  logic: "🧠",
  backend: "⚙️"
};

export const TASK_STATUS_META = {
  active: { icon: "⚡", badge: "In Progress", short: "ACTIVE" },
  locked: { icon: "🔜", badge: "Coming Update", short: "SOON" },
  done: { icon: "✅", badge: "Completed", short: "DONE" }
};

export function normalizeCompletedSections(raw) {
  const defaults = CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});
  if (!raw || typeof raw !== "object") return defaults;
  return CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = !!raw[key];
    return acc;
  }, { ...defaults });
}

export function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h, i) => ({
      id: h.id || `h${i}`,
      date: String(h.date || "").trim(),
      title: String(h.title || "").trim() || "Progress update",
      overallProgress: Math.min(100, Math.max(0, parseInt(h.overallProgress, 10) || 0)),
      note: String(h.note || "").trim(),
      progress: normalizeProgress(h.progress)
    }))
    .slice(0, 30);
}

export function formatTodayDate() {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function formatProjectStartDate(project = {}) {
  if (project.startDate) return project.startDate;
  if (project.createdAt?.toDate) {
    return project.createdAt.toDate().toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric"
    });
  }
  return "";
}

export function appendProgressHistory(history, prevOverall, nextOverall, progress, note = "") {
  const list = normalizeHistory(history);
  if (prevOverall === nextOverall && !note.trim()) return list;
  const entry = {
    id: `h${Date.now()}`,
    date: formatTodayDate(),
    title: note.trim() || `Overall progress reached ${nextOverall}%`,
    overallProgress: nextOverall,
    note: note.trim(),
    progress: normalizeProgress(progress)
  };
  return [entry, ...list.filter((h) => h.id !== entry.id)].slice(0, 30);
}

export function slugify(title) {
  return String(title || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeProgress(raw) {
  const defaults = { ui: 0, bugs: 0, code: 0, logic: 0, backend: 0 };
  if (!raw || typeof raw !== "object") return defaults;
  return CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = Math.min(100, Math.max(0, parseInt(raw[key], 10) || 0));
    return acc;
  }, {});
}

export function computeOverallProgress(progress) {
  const p = normalizeProgress(progress);
  const values = CATEGORY_KEYS.map((k) => p[k]);
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

export function progressToDepartments(progress) {
  const p = normalizeProgress(progress);
  return CATEGORY_KEYS.map((key) => ({
    key,
    name: DEFAULT_CATEGORIES[key].label,
    color: DEFAULT_CATEGORIES[key].color,
    gradient: DEFAULT_CATEGORIES[key].gradient,
    pct: p[key],
    icon: CATEGORY_ICONS[key]
  }));
}

export function normalizeTasks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t, i) => ({
      id: t.id || `t${Date.now()}-${i}`,
      title: String(t.title || "").trim(),
      category: CATEGORY_KEYS.includes(t.category) ? t.category : "ui",
      status: ["locked", "active", "done"].includes(t.status) ? t.status : "locked",
      order: parseInt(t.order, 10) || i + 1
    }))
    .sort((a, b) => a.order - b.order);
}

function normalizeProject(data = {}, id = "") {
  const techStack = Array.isArray(data.techStack)
    ? data.techStack
    : Array.isArray(data.tech)
      ? data.tech
      : String(data.techStack || data.tech || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

  const rawPriority = String(data.priority || "medium").toLowerCase();
  const priority = rawPriority === "high" || rawPriority === "medium" || rawPriority === "low"
    ? rawPriority
    : "medium";

  const status = ["upcoming", "running", "completed"].includes(data.status)
    ? data.status
    : "upcoming";

  const progress = normalizeProgress(data.progress);
  const overallProgress =
    data.overallProgress !== undefined
      ? Math.min(100, Math.max(0, parseInt(data.overallProgress, 10) || 0))
      : status === "completed"
        ? 100
        : computeOverallProgress(progress);
  const tasks = normalizeTasks(data.tasks);
  const modalId = data.modalId || slugify(data.title);
  const eta = data.eta || "";
  const startDate = String(data.startDate || "").trim();
  const completedSections = normalizeCompletedSections(data.completedSections);
  const history = normalizeHistory(data.history);
  const departments = progressToDepartments(progress);

  return {
    id,
    title: data.title || "",
    description: data.description || "",
    fullDesc: data.fullDesc || data.description || "",
    techStack,
    tech: techStack,
    status,
    priority,
    progress,
    overallProgress,
    tasks,
    modalId,
    eta,
    startDate,
    completedSections,
    history,
    departments,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
}

export async function getProjects() {
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeProject(d.data(), d.id));
}

export async function addProject(project) {
  const techStack = Array.isArray(project.techStack)
    ? project.techStack
    : String(project.techStack || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
  const title = String(project.title || "").trim();
  const progress = normalizeProgress(project.progress);
  const payload = {
    title,
    description: String(project.description || "").trim(),
    fullDesc: String(project.fullDesc || project.description || "").trim(),
    techStack,
    status: ["upcoming", "running", "completed"].includes(project.status) ? project.status : "upcoming",
    priority: ["low", "medium", "high"].includes(project.priority) ? project.priority : "medium",
    modalId: String(project.modalId || slugify(title)).trim() || slugify(title),
    eta: String(project.eta || "").trim(),
    progress,
    overallProgress: computeOverallProgress(progress),
    tasks: normalizeTasks(project.tasks || []),
    completedSections: normalizeCompletedSections(project.completedSections),
    startDate: String(project.startDate || "").trim(),
    history: normalizeHistory(project.history || []),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, "projects"), payload);
  return ref.id;
}

export async function updateProject(projectId, data) {
  const techStack = Array.isArray(data.techStack)
    ? data.techStack
    : String(data.techStack || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

  const title = String(data.title || "").trim();
  const payload = {
    title,
    description: String(data.description || "").trim(),
    fullDesc: String(data.fullDesc || data.description || "").trim(),
    techStack,
    status: ["upcoming", "running", "completed"].includes(data.status) ? data.status : "upcoming",
    priority: ["low", "medium", "high"].includes(data.priority) ? data.priority : "medium",
    updatedAt: serverTimestamp()
  };
  if (data.modalId !== undefined) payload.modalId = String(data.modalId || slugify(title)).trim();
  if (data.eta !== undefined) payload.eta = String(data.eta || "").trim();
  await updateDoc(doc(db, "projects", projectId), payload);
}

export async function updateProjectProgress(projectId, data) {
  const progress = normalizeProgress(data.progress);
  const payload = {
    progress,
    overallProgress: computeOverallProgress(progress),
    tasks: normalizeTasks(data.tasks || []),
    completedSections: normalizeCompletedSections(data.completedSections),
    history: normalizeHistory(data.history || []),
    updatedAt: serverTimestamp()
  };
  if (data.eta !== undefined) payload.eta = String(data.eta || "").trim();
  if (data.modalId !== undefined) payload.modalId = String(data.modalId || "").trim();
  if (data.startDate !== undefined) payload.startDate = String(data.startDate || "").trim();
  await updateDoc(doc(db, "projects", projectId), payload);
}

export async function deleteProject(projectId) {
  await deleteDoc(doc(db, "projects", projectId));
}

export function watchProjects(callback, onError) {
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const projects = snap.docs.map((d) => normalizeProject(d.data(), d.id));
      callback(projects);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export async function getTech() {
  const coll = collection(db, "tech");
  try {
    const q = query(coll, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("tech orderBy query failed, using fallback:", err);
    const snap = await getDocs(coll);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export async function addTech(techItem) {
  const payload = {
    name: String(techItem?.name || "").trim(),
    icon: String(techItem?.icon || "💡").trim(),
    desc: String(techItem?.desc || "").trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, "tech"), payload);
  return ref.id;
}

export async function updateTech(id, techItem) {
  await updateDoc(doc(db, "tech", id), {
    name: String(techItem?.name || "").trim(),
    icon: String(techItem?.icon || "💡").trim(),
    desc: String(techItem?.desc || "").trim(),
    updatedAt: serverTimestamp()
  });
}

export async function deleteTech(id) {
  await deleteDoc(doc(db, "tech", id));
}

export async function sendMessage(message) {
  const payload = {
    ...message,
    createdAt: serverTimestamp(),
    status: "unread"
  };
  const ref = await addDoc(collection(db, "messages"), payload);
  return ref.id;
}

export async function getMessages() {
  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function normalizeUser(data = {}, id = "") {
  const email = String(data.email || "").trim().toLowerCase();
  const role = data.role === "admin" ? "admin" : "user";
  const status = data.status === "blocked" ? "blocked" : "active";
  const source = data.source === "admin" ? "admin" : data.source === "signup" ? "signup" : data.uid ? "signup" : "admin";
  return {
    id,
    uid: data.uid || (id && id.length > 20 ? id : "") || "",
    name: String(data.name || data.fullName || "").trim() || "User",
    email,
    role,
    status,
    phone: String(data.phone || "").trim(),
    source,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    lastLoginAt: data.lastLoginAt || null
  };
}

export function formatUserDate(value) {
  if (!value) return "—";
  if (value?.toDate) {
    return value.toDate().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }
  return String(value);
}

export async function getUserByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;
  const q = query(collection(db, "users"), where("email", "==", normalizedEmail));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return normalizeUser(d.data(), d.id);
  }
  return null;
}

export async function getUserOrdersCount(email) {
  const orders = await getOrdersByUser(email);
  return orders.length;
}

export async function getUsers() {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeUser(d.data(), d.id));
}

export async function addUser(data) {
  const email = String(data.email || "").trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }

  const profile = {
    name: String(data.name || "").trim(),
    email,
    role: data.role === "admin" ? "admin" : "user",
    status: data.status === "blocked" ? "blocked" : "active",
    phone: String(data.phone || "").trim(),
    source: "admin"
  };

  if (data.password) {
    const uid = await createAuthUserAccount(email, data.password, profile);
    return uid;
  }

  const payload = {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, "users"), payload);
  return ref.id;
}

export async function updateUser(id, data) {
  const email = String(data.email || "").trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing && existing.id !== id) {
    throw new Error("EMAIL_EXISTS");
  }

  const payload = {
    name: String(data.name || "").trim(),
    email,
    role: data.role === "admin" ? "admin" : "user",
    status: data.status === "blocked" ? "blocked" : "active",
    phone: String(data.phone || "").trim(),
    updatedAt: serverTimestamp()
  };
  await updateDoc(doc(db, "users", id), payload);
}

export async function deleteUser(id) {
  await deleteDoc(doc(db, "users", id));
}

export async function mergeLegacyUserOnSignup(uid, email, profile = {}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!uid || !normalizedEmail) return;

  const q = query(collection(db, "users"), where("email", "==", normalizedEmail));
  const snap = await getDocs(q);
  const legacy = snap.docs.find((d) => d.id !== uid);
  const legacyData = legacy?.data() || {};

  const payload = {
    uid,
    name: String(profile.name || profile.fullName || legacyData.name || legacyData.fullName || "").trim() || "User",
    email: normalizedEmail,
    role: legacyData.role === "admin" ? "admin" : "user",
    status: legacyData.status === "blocked" ? "blocked" : "active",
    phone: String(profile.phone || legacyData.phone || "").trim(),
    source: profile.source || legacyData.source || "signup",
    createdAt: legacyData.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", uid), payload, { merge: true });
  if (legacy) {
    await deleteDoc(doc(db, "users", legacy.id));
  }
}

export function watchUsers(callback, onError) {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => normalizeUser(d.data(), d.id))),
    (error) => {
      if (onError) onError(error);
    }
  );
}

function normalizeOrder(data = {}, id = "") {
  const status = ["pending", "in-progress", "completed"].includes(data.status)
    ? data.status
    : "pending";
  const normalizedUserEmail = String(data.userEmail || "").trim().toLowerCase();
  return {
    id,
    userEmail: normalizedUserEmail,
    type: data.type || "Custom",
    title: data.title || "",
    description: data.description || data.desc || "",
    budget: data.budget || "",
    deadline: data.deadline || "",
    priority: String(data.priority || "medium").toLowerCase(),
    status,
    createdAt: data.createdAt || data.placed || null
  };
}

export async function addOrder(data) {
  const loggedInUserEmail = String(data?.loggedInUser?.email || data.userEmail || "").trim().toLowerCase();
  console.log("Saving order for:", loggedInUserEmail);
  const payload = {
    userEmail: loggedInUserEmail,
    type: data.type || "Custom",
    title: String(data.title || "").trim(),
    description: String(data.description || data.desc || "").trim(),
    budget: String(data.budget || "").trim(),
    deadline: String(data.deadline || "").trim(),
    priority: ["low", "medium", "high"].includes(String(data.priority || "").toLowerCase())
      ? String(data.priority).toLowerCase()
      : "medium",
    status: ["pending", "in-progress", "completed"].includes(data.status) ? data.status : "pending",
    createdAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, "orders"), payload);
  return ref.id;
}

export async function getOrders() {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeOrder(d.data(), d.id));
}

export async function getOrdersByUser(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const orders = snap.docs.map((d) => normalizeOrder(d.data(), d.id));
  const filteredOrders = orders.filter(
    (order) => String(order.userEmail || "").trim().toLowerCase() === normalizedEmail
  );
  console.log("Orders fetched for user:", normalizedEmail);
  console.log("All orders:", orders);
  console.log("Filtered orders:", filteredOrders);
  console.log("Orders count:", filteredOrders.length);
  return filteredOrders;
}

export async function updateOrderStatus(id, status) {
  const nextStatus = ["pending", "in-progress", "completed"].includes(status) ? status : "pending";
  await updateDoc(doc(db, "orders", id), { status: nextStatus });
}

export async function deleteOrder(id) {
  await deleteDoc(doc(db, "orders", id));
}

export function watchOrders(callback, onError) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => normalizeOrder(d.data(), d.id))),
    (err) => onError && onError(err)
  );
}

export function watchOrdersByUser(email, callback, onError) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const q = query(
    collection(db, "orders"),
    where("userEmail", "==", normalizedEmail),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => callback(
      snap.docs
        .map((d) => normalizeOrder(d.data(), d.id))
        .filter((order) => String(order.userEmail || "").trim().toLowerCase() === normalizedEmail)
    ),
    (err) => onError && onError(err)
  );
}

export const TEAM_ROLE_KEYS = ["ceo", "project_manager", "developer", "marketing_manager"];

export const TEAM_ROLE_PRESETS = {
  ceo: {
    roleKey: "ceo",
    roleLabel: "CEO",
    title: "Chief Executive Officer",
    tagline: "Leading vision & growth",
    avatar: "👑",
    cardTheme: {
      accentColor: "#FFB800",
      secondaryColor: "#7A5FFF",
      gradient: "linear-gradient(135deg, #FFB800 0%, #7A5FFF 100%)",
      borderColor: "rgba(255, 184, 0, 0.45)",
      glowColor: "rgba(255, 184, 0, 0.3)",
      layout: "executive"
    }
  },
  project_manager: {
    roleKey: "project_manager",
    roleLabel: "Project Manager",
    title: "Project Manager",
    tagline: "Delivering on time, every time",
    avatar: "📋",
    cardTheme: {
      accentColor: "#00C2FF",
      secondaryColor: "#4D9FFF",
      gradient: "linear-gradient(135deg, #00C2FF 0%, #4D9FFF 100%)",
      borderColor: "rgba(0, 194, 255, 0.4)",
      glowColor: "rgba(0, 194, 255, 0.25)",
      layout: "leader"
    }
  },
  developer: {
    roleKey: "developer",
    roleLabel: "Developer",
    title: "Full Stack Developer",
    tagline: "Building scalable products",
    avatar: "💻",
    cardTheme: {
      accentColor: "#00FFD1",
      secondaryColor: "#00C2FF",
      gradient: "linear-gradient(135deg, #00FFD1 0%, #00C2FF 100%)",
      borderColor: "rgba(0, 255, 209, 0.4)",
      glowColor: "rgba(0, 255, 209, 0.22)",
      layout: "tech"
    }
  },
  marketing_manager: {
    roleKey: "marketing_manager",
    roleLabel: "Marketing Manager",
    title: "Marketing Manager",
    tagline: "Growing brands with impact",
    avatar: "📣",
    cardTheme: {
      accentColor: "#FF4B6E",
      secondaryColor: "#FF8A65",
      gradient: "linear-gradient(135deg, #FF4B6E 0%, #FF8A65 100%)",
      borderColor: "rgba(255, 75, 110, 0.4)",
      glowColor: "rgba(255, 75, 110, 0.25)",
      layout: "creative"
    }
  }
};

const TEAM_LAYOUTS = ["executive", "leader", "tech", "creative"];

function normalizeCardTheme(raw = {}, roleKey = "developer") {
  const preset = TEAM_ROLE_PRESETS[roleKey]?.cardTheme || TEAM_ROLE_PRESETS.developer.cardTheme;
  const theme = raw && typeof raw === "object" ? raw : {};
  const layout = TEAM_LAYOUTS.includes(theme.layout) ? theme.layout : preset.layout;
  return {
    accentColor: theme.accentColor || preset.accentColor,
    secondaryColor: theme.secondaryColor || preset.secondaryColor,
    gradient: theme.gradient || preset.gradient,
    borderColor: theme.borderColor || preset.borderColor,
    glowColor: theme.glowColor || preset.glowColor,
    layout
  };
}

function normalizeStats(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => ({
      label: String(s?.label || "").trim(),
      value: String(s?.value || "").trim()
    }))
    .filter((s) => s.label && s.value)
    .slice(0, 6);
}

export function normalizeTeamMember(data = {}, id = "") {
  const roleKey = TEAM_ROLE_KEYS.includes(data.roleKey) ? data.roleKey : "developer";
  const preset = TEAM_ROLE_PRESETS[roleKey];
  const skills = Array.isArray(data.skills)
    ? data.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
    : String(data.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12);

  return {
    id,
    name: String(data.name || "").trim() || "Team Member",
    roleKey,
    roleLabel: String(data.roleLabel || preset?.roleLabel || "Team Member").trim(),
    title: String(data.title || preset?.title || "").trim(),
    bio: String(data.bio || "").trim(),
    tagline: String(data.tagline || preset?.tagline || "").trim(),
    highlight: String(data.highlight || "").trim(),
    avatar: String(data.avatar || preset?.avatar || "👤").trim(),
    email: String(data.email || "").trim(),
    phone: String(data.phone || "").trim(),
    linkedin: String(data.linkedin || "").trim(),
    skills,
    stats: normalizeStats(data.stats),
    order: parseInt(data.order, 10) || 0,
    active: data.active !== false,
    cardTheme: normalizeCardTheme(data.cardTheme, roleKey),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
}

export function applyRolePreset(roleKey) {
  const preset = TEAM_ROLE_PRESETS[roleKey] || TEAM_ROLE_PRESETS.developer;
  return {
    roleKey: preset.roleKey,
    roleLabel: preset.roleLabel,
    title: preset.title,
    tagline: preset.tagline,
    avatar: preset.avatar,
    cardTheme: { ...preset.cardTheme }
  };
}

function buildTeamMemberPayload(data) {
  const normalized = normalizeTeamMember(data);
  return {
    name: normalized.name,
    roleKey: normalized.roleKey,
    roleLabel: normalized.roleLabel,
    title: normalized.title,
    bio: normalized.bio,
    tagline: normalized.tagline,
    highlight: normalized.highlight,
    avatar: normalized.avatar,
    email: normalized.email,
    phone: normalized.phone,
    linkedin: normalized.linkedin,
    skills: normalized.skills,
    stats: normalized.stats,
    order: normalized.order,
    active: normalized.active,
    cardTheme: normalized.cardTheme,
    updatedAt: serverTimestamp()
  };
}

function mapTeamMemberDocs(docs) {
  return docs
    .map((d) => normalizeTeamMember(d.data(), d.id))
    .sort((a, b) => a.order - b.order);
}

async function fetchTeamMembersSorted() {
  const coll = collection(db, "team_members");
  try {
    const q = query(coll, orderBy("order", "asc"));
    const snap = await getDocs(q);
    return mapTeamMemberDocs(snap.docs);
  } catch (err) {
    console.warn("team_members orderBy query failed, using fallback:", err);
    const snap = await getDocs(coll);
    return mapTeamMemberDocs(snap.docs);
  }
}

export async function getTeamMembers() {
  return fetchTeamMembersSorted();
}

export async function addTeamMember(data) {
  const payload = {
    ...buildTeamMemberPayload(data),
    createdAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, "team_members"), payload);
  return ref.id;
}

export async function updateTeamMember(id, data) {
  await updateDoc(doc(db, "team_members", id), buildTeamMemberPayload(data));
}

export async function deleteTeamMember(id) {
  await deleteDoc(doc(db, "team_members", id));
}

export function watchTeamMembers(callback, onError) {
  const coll = collection(db, "team_members");
  const q = query(coll, orderBy("order", "asc"));
  let unsub = null;
  let usedFallback = false;

  const emit = (snap) => callback(mapTeamMemberDocs(snap.docs));

  unsub = onSnapshot(
    q,
    emit,
    (err) => {
      if (!usedFallback) {
        usedFallback = true;
        console.warn("team_members live orderBy failed, using fallback:", err);
        unsub?.();
        unsub = onSnapshot(coll, emit, (err2) => onError && onError(err2));
        return;
      }
      onError && onError(err);
    }
  );

  return () => unsub?.();
}

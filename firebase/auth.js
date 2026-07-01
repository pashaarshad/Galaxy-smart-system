import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const ADMIN_SESSION_KEY = "adminAuth";

export async function initAdmin() {
  try {
    const adminCheckQuery = query(collection(db, "admins"), limit(1));
    const adminCheckSnap = await getDocs(adminCheckQuery);
    console.log("Admin collection checked");

    if (adminCheckSnap.empty) {
      await addDoc(collection(db, "admins"), {
        email: "admin@galaxy.com",
        password: "admin123",
        role: "admin",
        updatedAt: serverTimestamp()
      });
      console.log("Default admin created");
    }
  } catch (error) {
    console.error("Admin initialization failed", error);
    throw new Error("Failed to initialize admin collection");
  }
}

export async function loginAdmin(email, password) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanEmail || !cleanPassword) {
    throw new Error("Invalid email or password");
  }

  const q = query(collection(db, "admins"), where("email", "==", cleanEmail));
  try {
    const snap = await getDocs(q);
    console.log("Admin collection checked");

    if (snap.empty) {
      console.log("Login failed");
      throw new Error("Invalid email or password");
    }

    const adminDoc = snap.docs[0];
    const admin = adminDoc.data();
    if (admin.password !== cleanPassword) {
      console.log("Login failed");
      throw new Error("Invalid email or password");
    }

    const session = {
      email: admin.email,
      role: admin.role || "admin"
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    console.log("Login success");
    return session;
  } catch (error) {
    if (error.message === "Invalid email or password") {
      throw error;
    }
    console.log("Login failed");
    throw new Error("Network issue. Please try again.");
  }
}

export async function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function watchAuth(callback) {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  let parsed = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch (e) {
    parsed = null;
  }
  callback(parsed);
  return () => {};
}

export function getAdminSession() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function updateAdminCredentials(currentEmail, nextEmail, nextPassword) {
  const cleanCurrentEmail = String(currentEmail || "").trim().toLowerCase();
  const cleanNextEmail = String(nextEmail || "").trim().toLowerCase();
  const cleanNextPassword = String(nextPassword || "");
  if (!cleanCurrentEmail || !cleanNextEmail || !cleanNextPassword) {
    throw new Error("Email and password are required");
  }

  const q = query(collection(db, "admins"), where("email", "==", cleanCurrentEmail));
  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(collection(db, "admins"), {
      email: cleanNextEmail,
      password: cleanNextPassword,
      role: "admin",
      updatedAt: serverTimestamp()
    });
  } else {
    await updateDoc(doc(db, "admins", snap.docs[0].id), {
      email: cleanNextEmail,
      password: cleanNextPassword,
      role: "admin",
      updatedAt: serverTimestamp()
    });
  }
}

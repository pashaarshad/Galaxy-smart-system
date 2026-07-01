import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmBEijtetS1a4_GFwCdkp8NDomL_muxIk",
  authDomain: "galaxy-smart-system.firebaseapp.com",
  projectId: "galaxy-smart-system",
  storageBucket: "galaxy-smart-system.firebasestorage.app",
  messagingSenderId: "363640718541",
  appId: "1:363640718541:web:048d9480357d1221309584",
  measurementId: "G-8R16MH7GEJ"
};

const SECONDARY_APP_NAME = "AdminUserCreate";

function getSecondaryAuth() {
  const existing = getApps().find((app) => app.name === SECONDARY_APP_NAME);
  const secondaryApp = existing || initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  return getAuth(secondaryApp);
}

export async function createAuthUserAccount(email, password, profile = {}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const auth = getSecondaryAuth();

  try {
    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const uid = credential.user.uid;
    await setDoc(doc(db, "users", uid), {
      uid,
      name: String(profile.name || "").trim() || "User",
      email: normalizedEmail,
      role: profile.role === "admin" ? "admin" : "user",
      status: profile.status === "blocked" ? "blocked" : "active",
      phone: String(profile.phone || "").trim(),
      source: "admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return uid;
  } finally {
    await signOut(auth).catch(() => {});
  }
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmBEijtetS1a4_GFwCdkp8NDomL_muxIk",
  authDomain: "galaxy-smart-system.firebaseapp.com",
  projectId: "galaxy-smart-system",
  storageBucket: "galaxy-smart-system.firebasestorage.app",
  messagingSenderId: "363640718541",
  appId: "1:363640718541:web:048d9480357d1221309584",
  measurementId: "G-8R16MH7GEJ"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * GALAXY SMART SYSTEM – auth.js
 * Login / Register with Firebase Authentication
 */

import { 
    auth, 
    db,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut,
    updateProfile 
} from '../assets/js/firebase-config.js';
import { mergeLegacyUserOnSignup } from '../firebase/firestore.js';
import { initAuthMobile } from '../assets/js/mobile-native.js';

const SESSION_KEY = 'gss_session';

/* ─── Tab Switcher ────────────────────────────── */
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    const tabEl = document.getElementById(`tab-${tab}`);
    const panelEl = document.getElementById(`panel-${tab}`);
    if (tabEl) tabEl.classList.add('active');
    if (panelEl) panelEl.classList.add('active');
    clearAlerts();
}
window.switchTab = switchTab;

function clearAlerts() {
    document.querySelectorAll('.auth-alert').forEach(a => {
        a.classList.remove('show', 'success-alert');
        a.textContent = '';
    });
}

function showAlert(id, msg, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert show${type === 'success' ? ' success-alert' : ''}`;
}

/* ─── Validation Helpers ─────────────────────── */
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setError(groupId, hasError) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.toggle('has-error', hasError);
    group.querySelector('input')?.classList.toggle('error', hasError);
}

/* ─── Password Strength ──────────────────────── */
document.getElementById('rg-pass')?.addEventListener('input', function () {
    const val = this.value;
    const strength = document.getElementById('pw-strength');
    const fill = document.getElementById('pw-fill');
    const label = document.getElementById('pw-label');
    if (!strength || !fill || !label) return;

    strength.style.display = val.length > 0 ? 'block' : 'none';

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = [
        { pct: '20%', color: '#FF4B4B', text: 'Weak' },
        { pct: '45%', color: '#FF9A00', text: 'Fair' },
        { pct: '70%', color: '#FFD200', text: 'Good' },
        { pct: '100%', color: '#00D084', text: 'Strong 💪' },
    ];
    const l = levels[score - 1] || levels[0];
    fill.style.width = l.pct;
    fill.style.background = l.color;
    label.textContent = l.text;
    label.style.color = l.color;
});

/* ─── Social Login (placeholder) ─────────────── */
function socialLogin(provider) {
    showAlert('login-alert', `${provider} login — coming soon in Phase 2!`, 'error');
}
window.socialLogin = socialLogin;

/* ─── Session Helpers ─────────────────────── */
function setSession(user) {
    const normalizedEmail = String(user?.email || '').trim().toLowerCase();
    const session = { 
        uid: user.uid, 
        name: user.displayName || 'User', 
        email: normalizedEmail, 
        loggedIn: true 
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: normalizedEmail
    }));
}

async function getUserProfile(uid) {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
}

async function enforceUserAccess(user) {
    const profile = await getUserProfile(user.uid);
    if (profile?.status === 'blocked') {
        await signOut(auth);
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('user');
        showAlert('login-alert', 'Your account has been blocked by admin.');
        return false;
    }
    await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }).catch(() => {});
    return true;
}

async function ensureUserDoc(user, fallbackFullName = '') {
    const uid = String(user?.uid || '').trim();
    const email = String(user?.email || '').trim().toLowerCase();
    const name = String(fallbackFullName || user?.displayName || '').trim() || 'User';
    if (!uid || !email) return;

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await mergeLegacyUserOnSignup(uid, email, { name, fullName: name });
        return;
    }

    const data = userSnap.data();
    if (!data.name && (data.fullName || name)) {
        await updateDoc(userRef, {
            name: data.fullName || name,
            updatedAt: serverTimestamp()
        });
    }
}

/* ─── REGISTER ──────────────────────────────── */
document.getElementById('reg-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAlerts();

    const fn = document.getElementById('rg-fn').value.trim();
    const ln = document.getElementById('rg-ln').value.trim();
    const email = document.getElementById('rg-email').value.trim();
    const pass = document.getElementById('rg-pass').value;
    const confirm = document.getElementById('rg-confirm').value;

    let valid = true;

    setError('rg-fn-grp', !fn); if (!fn) valid = false;
    setError('rg-ln-grp', !ln); if (!ln) valid = false;
    setError('rg-email-grp', !validateEmail(email)); if (!validateEmail(email)) valid = false;
    setError('rg-pass-grp', pass.length < 8); if (pass.length < 8) valid = false;
    setError('rg-confirm-grp', pass !== confirm); if (pass !== confirm) valid = false;

    if (!valid) return;

    const btn = document.getElementById('reg-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating Account...';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        const fullName = `${fn} ${ln}`.trim();

        // Update profile with names
        await updateProfile(user, {
            displayName: fullName
        });
        await mergeLegacyUserOnSignup(user.uid, user.email, {
            name: fullName,
            source: "signup"
        });

        showAlert('reg-alert', `✅ Account created! Redirecting to your dashboard...`, 'success');

        setTimeout(() => {
            window.location.href = './dashboard.html';
        }, 1400);

    } catch (error) {
        console.error('Registration error:', error);
        let msg = '⚠️ Registration failed. Please try again.';
        if (error.code === 'auth/email-already-in-use') msg = '⚠️ This email is already registered.';
        showAlert('reg-alert', msg);
        btn.disabled = false;
        btn.innerHTML = '✨ Create My Account';
    }
});

/* ─── LOGIN ─────────────────────────────────── */
document.getElementById('login-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAlerts();

    const email = document.getElementById('lg-email').value.trim();
    const pass = document.getElementById('lg-pass').value;

    let valid = true;
    setError('lg-email-grp', !validateEmail(email)); if (!validateEmail(email)) valid = false;
    setError('lg-pass-grp', !pass); if (!pass) valid = false;
    if (!valid) return;

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing In...';

    try {
        const credential = await signInWithEmailAndPassword(auth, email, pass);
        const allowed = await enforceUserAccess(credential.user);
        if (!allowed) {
            btn.disabled = false;
            btn.innerHTML = '🔐 Sign In';
            return;
        }
        showAlert('login-alert', `👋 Welcome back! Redirecting...`, 'success');
        setTimeout(() => { window.location.href = './dashboard.html'; }, 1200);
    } catch (error) {
        console.error('Login error:', error);
        showAlert('login-alert', '❌ Invalid email or password. Please try again.');
        btn.disabled = false;
        btn.innerHTML = '🔐 Sign In';
    }
});

/* ─── Auth State Listener ─────────── */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            await ensureUserDoc(user);
            const allowed = await enforceUserAccess(user);
            if (!allowed) return;
            setSession(user);
            if (window.location.pathname.includes('/auth.html')) {
                window.location.href = './dashboard.html';
            }
        } catch (error) {
            console.error('User Firestore sync failed:', error);
        }
    } else {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('user');
    }
});

initAuthMobile();

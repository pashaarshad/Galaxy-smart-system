/**
 * Login gateway for unified admin routes.
 */
import { getAdminSession, initAdmin, loginAdmin } from '../firebase/auth.js';
import { initAdminLoginMobile } from '../assets/js/mobile-native.js';

window.addEventListener('DOMContentLoaded', () => {
  initAdminLoginMobile();
  initAdmin().catch(() => {});
  const session = getAdminSession();
  if (session?.email && session?.role === 'admin') {
    window.location.href = './dashboard.html';
    return;
  }
  bindLogin();
});

function bindLogin() {
  const loginBtn = document.getElementById('login-btn');
  const userInput = document.getElementById('admin-username');
  const passInput = document.getElementById('admin-password');
  const errorBox = document.getElementById('login-error');
  const btnText = document.getElementById('login-btn-text');
  const spinner = document.getElementById('login-spinner');

  [userInput, passInput].forEach((el) => {
    el?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loginBtn?.click();
    });
  });

  loginBtn?.addEventListener('click', async () => {
    const email = userInput?.value.trim();
    const password = passInput?.value;
    loginBtn.disabled = true;
    if (btnText) btnText.textContent = 'Logging in...';
    if (spinner) spinner.classList.remove('hidden');
    try {
      await loginAdmin(email, password);
      errorBox?.classList.remove('show');
      window.location.href = './dashboard.html';
    } catch (e) {
      if (errorBox) errorBox.textContent = e?.message || 'Invalid email or password';
      errorBox?.classList.add('show');
      if (passInput) passInput.value = '';
    } finally {
      loginBtn.disabled = false;
      if (btnText) btnText.textContent = 'Login';
      if (spinner) spinner.classList.add('hidden');
    }
  });
}

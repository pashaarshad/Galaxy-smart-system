/**
 * Galaxy Smart System — E2E smoke tests
 * Run: node scripts/e2e-smoke.mjs
 * Requires: npx http-server . -p 5500 (or set BASE_URL)
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5500';
const results = [];
const errors = [];

function pass(name) {
  results.push({ name, ok: true });
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`FAIL  ${name} — ${detail}`);
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  // ── Public: Team section ──
  try {
    await page.goto(`${BASE}/#team`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);
    const cards = await page.locator('#team .team-card').count();
    const head = await page.locator('#team .section-title').textContent();
    if (cards >= 1 && head?.includes('Galaxy')) pass('Public team section');
    else fail('Public team section', `cards=${cards} head=${head}`);
  } catch (e) {
    fail('Public team section', e.message);
  }

  // ── Public: Contact form exists ──
  try {
    await page.goto(`${BASE}/#contact`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const form = await page.locator('#contact-form').count();
    if (form > 0) pass('Public contact form');
    else fail('Public contact form', 'form not found');
  } catch (e) {
    fail('Public contact form', e.message);
  }

  // ── Admin: Dashboard + messages ──
  try {
    const ctx = await browser.newContext();
    const adminPage = await ctx.newPage();
    adminPage.on('pageerror', (e) => errors.push(`admin: ${e.message}`));
    await adminPage.addInitScript(() => {
      localStorage.setItem('adminAuth', JSON.stringify({ role: 'admin', email: 'admin@galaxy.com' }));
    });
    await adminPage.goto(`${BASE}/admin/dashboard.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await adminPage.waitForTimeout(5000);
    const users = await adminPage.locator('#dash-users').textContent();
    const pill = await adminPage.locator('#dash-messages-pill').textContent();
    if (users && users !== '0' || parseInt(users, 10) >= 0) {
      if (!pill?.includes('unavailable')) pass('Admin dashboard stats');
      else fail('Admin dashboard stats', pill);
    } else fail('Admin dashboard stats', 'users count missing');

    await adminPage.goto(`${BASE}/admin/messages.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await adminPage.waitForTimeout(5000);
    const msgRows = await adminPage.locator('#msg-table-body tr').count();
    const msgFail = await adminPage.locator('#msg-empty-card h4').textContent().catch(() => '');
    if (!msgFail?.includes('Failed')) pass(`Admin messages inbox (${msgRows} rows)`);
    else fail('Admin messages inbox', msgFail);

    await adminPage.goto(`${BASE}/admin/tech.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await adminPage.waitForTimeout(4000);
    const addBtn = await adminPage.locator('#add-tech-btn').count();
    if (addBtn > 0) pass('Admin tech CRUD page');
    else fail('Admin tech CRUD page', 'add button missing');

    await ctx.close();
  } catch (e) {
    fail('Admin panel', e.message);
  }

  // ── User dashboard: auth page loads ──
  try {
    await page.goto(`${BASE}/user-dashboard/auth.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const loginForm = await page.locator('#login-form, form').count();
    if (loginForm > 0) pass('User auth page');
    else fail('User auth page', 'login form not found');
  } catch (e) {
    fail('User auth page', e.message);
  }

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log('\n--- Summary ---');
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (errors.length) {
    console.log('\nConsole errors captured:');
    [...new Set(errors)].slice(0, 10).forEach((e) => console.log(' -', e));
  }
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

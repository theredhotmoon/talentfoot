/**
 * User Auth Scenarios
 * Covers: Registration, Login (valid/invalid), Logout, Protected route redirect
 */

import { test as base, expect, type Page, chromium } from '@playwright/test';

const APP = 'http://localhost:5173';
const API  = 'http://localhost:8000';

// Helper — login via API and inject token
async function apiLogin(page: Page, email: string, password: string) {
  const resp = await page.request.post(`${API}/api/login`, {
    data: { email, password },
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });
  const json = await resp.json() as { token?: string };
  if (json.token) {
    await page.goto(APP + '/login');
    await page.evaluate((t: string) => localStorage.setItem('token', t), json.token);
  }
}

// These tests intentionally run WITHOUT pre-auth so auth flows are real
const test = base;

// ─── Unique email per run to avoid conflicts ───────────────────────────────
const RUN = Date.now();
const NEW_USER = {
  name: `E2E User ${RUN}`,
  email: `e2e_user_${RUN}@test.com`,
  password: 'Password1!',
};

test.describe('Auth — Registration', () => {
  test('registers a new account successfully', async ({ page }) => {
    await page.goto(APP + '/register');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="text"]').fill(NEW_USER.name);
    await page.locator('input[type="email"]').fill(NEW_USER.email);
    // Two password inputs
    const pwdInputs = page.locator('input[type="password"]');
    await pwdInputs.nth(0).fill(NEW_USER.password);
    await pwdInputs.nth(1).fill(NEW_USER.password);

    await page.locator('button[type="submit"]').click();

    // After successful registration the store redirects to dashboard
    await expect(page).toHaveURL(APP + '/', { timeout: 10_000 });
  });

  test('shows validation error when passwords do not match', async ({ page }) => {
    await page.goto(APP + '/register');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="text"]').fill('Test User');
    await page.locator('input[type="email"]').fill(`nomatch_${RUN}@test.com`);
    const pwdInputs = page.locator('input[type="password"]');
    await pwdInputs.nth(0).fill('Password1!');
    await pwdInputs.nth(1).fill('DifferentPass!');

    await page.locator('button[type="submit"]').click();

    // Error message div should appear
    await expect(page.locator('div[style*="color: #f87171"]')).toBeVisible({ timeout: 8_000 });
  });

  test('shows error for already-existing email', async ({ page }) => {
    await page.goto(APP + '/register');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="text"]').fill('Admin');
    await page.locator('input[type="email"]').fill('admin@admin.com');
    const pwdInputs = page.locator('input[type="password"]');
    await pwdInputs.nth(0).fill('Password1!');
    await pwdInputs.nth(1).fill('Password1!');

    await page.locator('button[type="submit"]').click();

    await expect(page.locator('div[style*="color: #f87171"]')).toBeVisible({ timeout: 8_000 });
  });

  test('has a link to the login page', async ({ page }) => {
    await page.goto(APP + '/register');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(APP + '/login');
  });
});

test.describe('Auth — Login', () => {
  test('logs in with valid credentials and reaches dashboard', async ({ page }) => {
    await page.goto(APP + '/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('testuser@talentfoot.com');
    await page.locator('input[type="password"]').fill('Password1!');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(APP + '/', { timeout: 10_000 });
  });

  test('shows error message with wrong password', async ({ page }) => {
    await page.goto(APP + '/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('admin@admin.com');
    await page.locator('input[type="password"]').fill('WrongPassword!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('div[style*="color: #f87171"]')).toBeVisible({ timeout: 8_000 });
  });

  test('shows error for non-existing email', async ({ page }) => {
    await page.goto(APP + '/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('nobody@notexist.com');
    await page.locator('input[type="password"]').fill('SomePassword1!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('div[style*="color: #f87171"]')).toBeVisible({ timeout: 8_000 });
  });

  test('has a link to the registration page', async ({ page }) => {
    await page.goto(APP + '/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /register|sign up|create/i }).click();
    await expect(page).toHaveURL(APP + '/register');
  });
});

test.describe('Auth — Protected Routes & Logout', () => {
  test('redirects unauthenticated user from dashboard to /login', async ({ page }) => {
    // Clear storage so no token is present
    await page.goto(APP + '/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto(APP + '/');
    await expect(page).toHaveURL(APP + '/login', { timeout: 8_000 });
  });

  test('redirects unauthenticated user from /my-challenges to /login', async ({ page }) => {
    await page.goto(APP + '/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto(APP + '/my-challenges');
    await expect(page).toHaveURL(APP + '/login', { timeout: 8_000 });
  });

  test('logout clears session and redirects to /login', async ({ page }) => {
    // Login via UI
    await page.goto(APP + '/login');
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').fill('testuser@talentfoot.com');
    await page.locator('input[type="password"]').fill('Password1!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(APP + '/', { timeout: 10_000 });

    // Click logout in nav — the button or link with logout text
    await page.getByRole('button', { name: /logout|sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

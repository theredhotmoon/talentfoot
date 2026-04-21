/**
 * User Auth Scenarios
 * Covers: Registration, Login (valid/invalid), Logout, Protected route redirect
 */

import { test as base, expect, type Page } from '@playwright/test';

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

// Helper: wait for a toast notification to appear
async function waitForToast(page: Page, type: 'success' | 'error' | 'warning' = 'error') {
  // Toasts are rendered by ToastManager with data-test or specific classes
  // We look for the toast container or any visible toast div
  await page.waitForSelector('.fixed.bottom-6', { timeout: 8_000 });
}

test.describe('Auth — Registration', () => {
  test('registers a new account successfully', async ({ page }) => {
    await page.goto(APP + '/register');
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

  test('shows toast error when passwords do not match', async ({ page }) => {
    await page.goto(APP + '/register');
    await page.locator('input[type="text"]').fill('Test User');
    await page.locator('input[type="email"]').fill(`nomatch_${RUN}@test.com`);
    const pwdInputs = page.locator('input[type="password"]');
    await pwdInputs.nth(0).fill('Password1!');
    await pwdInputs.nth(1).fill('DifferentPass!');

    await page.locator('button[type="submit"]').click();

    // Toast notification should appear
    await waitForToast(page, 'error');
    const toast = page.locator('.fixed.bottom-6 div').first();
    await expect(toast).toBeVisible({ timeout: 8_000 });
  });

  test('shows toast error for already-existing email', async ({ page }) => {
    await page.goto(APP + '/register');
    await page.locator('input[type="text"]').fill('Admin');
    await page.locator('input[type="email"]').fill('admin@admin.com');
    const pwdInputs = page.locator('input[type="password"]');
    await pwdInputs.nth(0).fill('Password1!');
    await pwdInputs.nth(1).fill('Password1!');

    await page.locator('button[type="submit"]').click();

    await waitForToast(page, 'error');
    const toast = page.locator('.fixed.bottom-6 div').first();
    await expect(toast).toBeVisible({ timeout: 8_000 });
  });

  test('has a link to the login page', async ({ page }) => {
    await page.goto(APP + '/register');
    // The register form has a login link; nav also has one — use the form's link specifically
    await page.locator('p').getByRole('link', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(APP + '/login');
  });
});

test.describe('Auth — Login', () => {
  test('logs in with valid credentials and reaches dashboard', async ({ page }) => {
    await page.goto(APP + '/login');
    await page.locator('input[type="email"]').fill('testuser@talentfoot.com');
    await page.locator('input[type="password"]').fill('Password1!');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(APP + '/', { timeout: 10_000 });
  });

  test('shows toast error with wrong password', async ({ page }) => {
    await page.goto(APP + '/login');
    await page.locator('input[type="email"]').fill('admin@admin.com');
    await page.locator('input[type="password"]').fill('WrongPassword!');
    await page.locator('button[type="submit"]').click();

    await waitForToast(page, 'error');
    const toast = page.locator('.fixed.bottom-6 div').first();
    await expect(toast).toBeVisible({ timeout: 8_000 });
  });

  test('shows toast error for non-existing email', async ({ page }) => {
    await page.goto(APP + '/login');
    await page.locator('input[type="email"]').fill('nobody@notexist.com');
    await page.locator('input[type="password"]').fill('SomePassword1!');
    await page.locator('button[type="submit"]').click();

    await waitForToast(page, 'error');
    const toast = page.locator('.fixed.bottom-6 div').first();
    await expect(toast).toBeVisible({ timeout: 8_000 });
  });

  test('has a link to the registration page', async ({ page }) => {
    await page.goto(APP + '/login');
    // Login page has a register link in the form footer; nav also has one — use the form's link
    await page.locator('p').getByRole('link', { name: /register|sign up|create/i }).click();
    await expect(page).toHaveURL(APP + '/register');
  });
});

test.describe('Auth — Protected Routes & Logout', () => {
  test('unauthenticated user can visit dashboard and sees login/register links', async ({ page }) => {
    // Clear storage so no token is present
    await page.goto(APP + '/login');
    await page.evaluate(() => localStorage.clear());

    // Dashboard (/) is publicly accessible for browsing
    await page.goto(APP + '/');
    await expect(page).toHaveURL(APP + '/', { timeout: 8_000 });

    // Without auth the nav shows Login and Register links (not a user avatar)
    const nav = page.locator('nav');
    await expect(nav.getByRole('link', { name: /login/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /register/i })).toBeVisible();
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
    await page.locator('input[type="email"]').fill('testuser@talentfoot.com');
    await page.locator('input[type="password"]').fill('Password1!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(APP + '/', { timeout: 10_000 });

    // The logout option is inside the UserAvatarMenu dropdown.
    // First open the avatar menu (circular button in the top-right nav area),
    // then click the Logout item inside the dropdown.
    const avatarBtn = page.locator('nav button[title]').last();
    await avatarBtn.click();
    await page.getByRole('button', { name: /logout|sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

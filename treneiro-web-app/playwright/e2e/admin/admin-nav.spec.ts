/**
 * Admin Navigation Scenarios
 * Covers: admin sees correct nav links, regular user cannot see admin links,
 *         regular user is redirected away from admin-only routes
 */

import { test, expect } from '../../fixtures';

test.describe('Admin Navigation', () => {
  test('admin sees Upload, Users, and Categories links in nav', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // The Management dropdown button must be visible (proves isAdmin = true)
    const managementBtn = page.locator('#management-menu-btn');
    await expect(managementBtn).toBeVisible({ timeout: 8_000 });

    // Click to open the dropdown — more reliable than hover() in headless CI.
    // The button has @click="showManagement = !showManagement" in App.vue.
    await managementBtn.click();

    await expect(nav.getByRole('link', { name: /upload/i })).toBeVisible({ timeout: 5_000 });
    await expect(nav.getByRole('link', { name: /users/i })).toBeVisible({ timeout: 5_000 });

    // Categories is always visible in the main nav (not inside the dropdown)
    await expect(nav.getByRole('link', { name: /categor/i })).toBeVisible();
  });

  test('admin can navigate to /upload page', async ({ adminPage: page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');

    // Should be on the upload page — not redirected to /login
    await expect(page).toHaveURL(/\/upload/, { timeout: 8_000 });
    // Upload form should render
    const form = page.locator('form, input[type="file"]').first();
    await expect(form).toBeVisible({ timeout: 8_000 });
  });

  test('admin can navigate to /users page', async ({ adminPage: page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/users/, { timeout: 8_000 });
    await expect(page.locator('table')).toBeVisible({ timeout: 8_000 });
  });

  test('admin can navigate to /categories admin page', async ({ adminPage: page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/categories/, { timeout: 8_000 });
    // Add category button should be visible for admin
    const addBtn = page.locator('button').filter({ hasText: /add|new|create|dodaj/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Regular User — Restricted Access', () => {
  test('regular user does NOT see Upload link in nav', async ({ userPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: /upload/i })).not.toBeVisible();
  });

  test('regular user does NOT see Users link in nav', async ({ userPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav');
    await expect(nav.getByRole('link', { name: /^users$/i })).not.toBeVisible();
  });

  test('regular user is redirected from /users to dashboard', async ({ userPage: page }) => {
    await page.goto('/users');
    // Router guard should redirect to /
    await expect(page).toHaveURL(/\/$/, { timeout: 8_000 });
  });

  test('regular user is redirected from /users/:id/edit to dashboard', async ({ userPage: page }) => {
    await page.goto('/users/1/edit');
    await expect(page).toHaveURL(/\/$/, { timeout: 8_000 });
  });

  test('regular user is redirected from /categories admin route', async ({ userPage: page }) => {
    // /categories is admin-only route
    await page.goto('/categories');
    // Gets redirected to /
    await expect(page).toHaveURL(/\/$/, { timeout: 8_000 });
  });
});

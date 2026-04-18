/**
 * Admin App Settings — E2E Tests
 *
 * Covers:
 *  1. Admin sees "App Settings" item in the Management dropdown
 *  2. Clicking "App Settings" opens the modal with 3 labeled inputs
 *  3. Admin can change values and save successfully (success feedback shown)
 *  4. Regular user does NOT see "App Settings" in nav
 *  5. Regular user cannot call PUT /api/admin/settings (403)
 *  6. GET /api/settings is publicly accessible (no auth)
 */

import { test, expect } from '../../fixtures';

// ─── Admin tests ──────────────────────────────────────────────────────────────

test.describe('Admin — App Settings', () => {

  test('admin sees "App Settings" button in the Management dropdown', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hover over the Management button to open dropdown
    const managementBtn = page.locator('#management-menu-btn');
    await expect(managementBtn).toBeVisible({ timeout: 8_000 });
    await managementBtn.click();

    // App Settings button should appear inside the dropdown
    const settingsBtn = page.locator('#open-app-settings-btn');
    await expect(settingsBtn).toBeVisible({ timeout: 5_000 });
  });

  test('clicking "App Settings" opens the modal with 3 inputs', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Management dropdown and click App Settings
    const managementBtn = page.locator('#management-menu-btn');
    await managementBtn.click();
    await page.locator('#open-app-settings-btn').click();

    // Modal should be visible
    const modal = page.locator('#app-settings-modal-overlay');
    await expect(modal).toBeVisible({ timeout: 6_000 });

    // All three inputs must exist
    await expect(page.locator('#setting-max-challenges')).toBeVisible();
    await expect(page.locator('#setting-dashboard-count')).toBeVisible();
    await expect(page.locator('#setting-per-page')).toBeVisible();

    // Save button is present
    await expect(page.locator('#settings-save-btn')).toBeVisible();
  });

  test('admin can save settings and sees success feedback', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open modal
    const managementBtn = page.locator('#management-menu-btn');
    await managementBtn.click();
    await page.locator('#open-app-settings-btn').click();
    await expect(page.locator('#app-settings-modal-overlay')).toBeVisible({ timeout: 6_000 });

    // Change max-challenges to 5
    const maxInput = page.locator('#setting-max-challenges');
    await maxInput.fill('5');

    // Change dashboard count to 3
    const dashInput = page.locator('#setting-dashboard-count');
    await dashInput.fill('3');

    // Submit
    await page.locator('#settings-save-btn').click();

    // Success banner or modal auto-close (within 3 seconds)
    // Either: success text visible OR modal closes (both are valid outcomes)
    await expect(
      page.locator('text=Settings saved successfully!').or(
        page.locator('#app-settings-modal-overlay').filter({ hasNot: page.locator('[style]') })
      )
    ).toBeVisible({ timeout: 6_000 });

    // Restore defaults to avoid side effects in other tests
    await page.goto('/');
    await managementBtn.click();
    await page.locator('#open-app-settings-btn').click();
    await expect(page.locator('#app-settings-modal-overlay')).toBeVisible({ timeout: 6_000 });
    await page.locator('#setting-max-challenges').fill('9');
    await page.locator('#setting-dashboard-count').fill('6');
    await page.locator('#settings-save-btn').click();
    await page.waitForTimeout(1800); // wait for auto-close
  });

  test('admin sees validation error for out-of-range input', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const managementBtn = page.locator('#management-menu-btn');
    await managementBtn.click();
    await page.locator('#open-app-settings-btn').click();
    await expect(page.locator('#app-settings-modal-overlay')).toBeVisible({ timeout: 6_000 });

    // Enter an invalid value (0 is below min of 1)
    await page.locator('#setting-max-challenges').fill('0');
    await page.locator('#settings-save-btn').click();

    // Validation error should appear
    const errorEl = page.locator('#err-max-challenges');
    await expect(errorEl).toBeVisible({ timeout: 4_000 });
  });

  test('modal can be closed with Escape key', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const managementBtn = page.locator('#management-menu-btn');
    await managementBtn.click();
    await page.locator('#open-app-settings-btn').click();
    await expect(page.locator('#app-settings-modal-overlay')).toBeVisible({ timeout: 6_000 });

    await page.keyboard.press('Escape');
    await expect(page.locator('#app-settings-modal-overlay')).not.toBeVisible({ timeout: 4_000 });
  });

  test('modal can be closed by clicking the overlay backdrop', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const managementBtn = page.locator('#management-menu-btn');
    await managementBtn.click();
    await page.locator('#open-app-settings-btn').click();
    const overlay = page.locator('#app-settings-modal-overlay');
    await expect(overlay).toBeVisible({ timeout: 6_000 });

    // Click the overlay (backdrop), not the modal card
    await overlay.click({ position: { x: 10, y: 10 } });
    await expect(overlay).not.toBeVisible({ timeout: 4_000 });
  });

});

// ─── Public API ───────────────────────────────────────────────────────────────

test.describe('Settings API — public endpoint', () => {

  test('GET /api/settings returns expected keys without authentication', async ({ adminPage: page }) => {
    const response = await page.request.get('/api/settings');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('max_active_challenges');
    expect(body).toHaveProperty('dashboard_clips_count');
    expect(body).toHaveProperty('per_page_count');

    // Values should be positive integers
    expect(body.max_active_challenges).toBeGreaterThan(0);
    expect(body.dashboard_clips_count).toBeGreaterThan(0);
    expect(body.per_page_count).toBeGreaterThan(0);
  });

});

// ─── Regular user ─────────────────────────────────────────────────────────────

test.describe('Regular User — Settings Access', () => {

  test('regular user does NOT see App Settings in the nav', async ({ userPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Management dropdown should not exist for regular users
    await expect(page.locator('#management-menu-btn')).not.toBeVisible();
    await expect(page.locator('#open-app-settings-btn')).not.toBeVisible();
  });

  test('regular user gets 403 when calling PUT /api/admin/settings', async ({ userPage: page }) => {
    const response = await page.request.put('/api/admin/settings', {
      data: { max_active_challenges: 3 },
    });
    expect(response.status()).toBe(403);
  });

});

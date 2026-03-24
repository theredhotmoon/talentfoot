/**
 * Error States & Edge Cases
 * Covers: API failures, empty states, non-existent resources, network errors
 */

import { test, expect } from '../../fixtures';

test.describe('Dashboard — Error States', () => {
  test('shows empty state when API returns no clips', async ({ userPage: page }) => {
    await page.route('**/api/clips*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should render the page without crashing
    await expect(page.locator('body')).toBeVisible();
    // No clip links should be present
    const clipLinks = page.locator('a[href*="/clips/"]');
    expect(await clipLinks.count()).toBe(0);
  });

  test('handles API error gracefully on dashboard', async ({ userPage: page }) => {
    await page.route('**/api/clips*', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Server Error"}' });
    });

    // Listen for unhandled errors in the console
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should still render (not blank/crashed)
    await expect(page.locator('nav')).toBeVisible();

    // No unhandled JS exceptions (console.error is fine, thrown is not)
    expect(errors.filter((e) => !e.includes('AxiosError'))).toHaveLength(0);
  });
});

test.describe('Clip Detail — Error States', () => {
  test('handles non-existent clip ID without crash', async ({ userPage: page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/clips/999999/non-existent-clip');
    await page.waitForLoadState('networkidle');

    // Page should not show a blank screen — nav should still be visible
    await expect(page.locator('nav')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Categories — Error States', () => {
  test('shows empty state when no categories exist', async ({ userPage: page }) => {
    await page.route('**/api/categories*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Page should render without crash
    await expect(page.locator('body')).toBeVisible();
    // No category links should be present
    const catLinks = page.locator('a[href*="/categories/"]');
    expect(await catLinks.count()).toBe(0);
  });

  test('handles category API failure gracefully', async ({ userPage: page }) => {
    await page.route('**/api/categories*', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error"}' });
    });

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Tags — Error States', () => {
  test('shows empty state when no tags exist', async ({ userPage: page }) => {
    await page.route('**/api/tags*', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/tags');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    const tagLinks = page.locator('a[href*="/tags/"]');
    expect(await tagLinks.count()).toBe(0);
  });

  test('handles tag API failure gracefully', async ({ userPage: page }) => {
    await page.route('**/api/tags*', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error"}' });
    });

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/tags');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Tag Detail — Error States', () => {
  test('handles non-existent tag ID without crash', async ({ userPage: page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/tags/999999');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('nav')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Category Detail — Error States', () => {
  test('handles non-existent category ID without crash', async ({ userPage: page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/categories/999999');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('nav')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Challenges — Error States', () => {
  test('handles challenges API failure gracefully', async ({ userPage: page }) => {
    await page.route('**/api/challenges*', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error"}' });
    });

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/my-challenges');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('nav')).toBeVisible();
  });
});

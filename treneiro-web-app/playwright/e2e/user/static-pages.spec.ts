/**
 * Static Pages Scenarios
 * Covers: Terms & Conditions, Privacy Policy, and Contact Page
 */

import { test as base, expect } from '@playwright/test';

const APP = 'http://localhost:5173';

// Static pages are accessible without authentication
const test = base;

test.describe('Terms & Conditions', () => {
  test('page renders with heading and sections', async ({ page }) => {
    await page.goto(APP + '/terms');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });

    // There should be 7 sections with h2 headings
    const sections = page.locator('h2');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('shows "Last updated" date', async ({ page }) => {
    await page.goto(APP + '/terms');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/last updated/i)).toBeVisible();
  });

  test('contains a link to the contact page', async ({ page }) => {
    await page.goto(APP + '/terms');
    await page.waitForLoadState('networkidle');

    const contactLink = page.locator('a[href="/contact"]');
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(page).toHaveURL(APP + '/contact', { timeout: 8_000 });
  });
});

test.describe('Privacy Policy', () => {
  test('page renders with heading and sections', async ({ page }) => {
    await page.goto(APP + '/privacy');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });

    const sections = page.locator('h2');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('shows "Last updated" date', async ({ page }) => {
    await page.goto(APP + '/privacy');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/last updated/i)).toBeVisible();
  });

  test('contains a link to the contact page', async ({ page }) => {
    await page.goto(APP + '/privacy');
    await page.waitForLoadState('networkidle');

    const contactLink = page.locator('a[href="/contact"]');
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(page).toHaveURL(APP + '/contact', { timeout: 8_000 });
  });
});

test.describe('Contact Page', () => {
  test('renders contact form with name, email, message fields', async ({ page }) => {
    await page.goto(APP + '/contact');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });

    // Name input
    await expect(page.locator('input[type="text"]')).toBeVisible();
    // Email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // Message textarea
    await expect(page.locator('textarea')).toBeVisible();
    // Submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('submit button is present and enabled', async ({ page }) => {
    await page.goto(APP + '/contact');
    await page.waitForLoadState('networkidle');

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test('successful submission shows success message', async ({ page }) => {
    // Mock the contact API
    await page.route('**/api/contact', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });

    await page.goto(APP + '/contact');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="text"]').fill('E2E Test User');
    await page.locator('input[type="email"]').fill('e2e@test.com');
    await page.locator('textarea').fill('This is an E2E test message.');
    await page.locator('button[type="submit"]').click();

    // Success message with ✅ emoji
    await expect(page.getByText('✅')).toBeVisible({ timeout: 8_000 });
  });

  test('failed submission shows error message', async ({ page }) => {
    // Mock the contact API with an error
    await page.route('**/api/contact', (route) => {
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ errors: { email: ['The email is invalid.'] } }),
      });
    });

    await page.goto(APP + '/contact');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="text"]').fill('Test');
    await page.locator('input[type="email"]').fill('bad');
    await page.locator('textarea').fill('Test');
    await page.locator('button[type="submit"]').click();

    // Error text should appear
    const errorText = page.locator('[style*="accent-red"], [style*="f87171"], p').filter({ hasText: /invalid|error|błąd/i });
    await expect(errorText.first()).toBeVisible({ timeout: 8_000 });
  });

  test('form fields are required (HTML5 validation)', async ({ page }) => {
    await page.goto(APP + '/contact');
    await page.waitForLoadState('networkidle');

    // Check the required attribute on inputs
    await expect(page.locator('input[type="text"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[type="email"]')).toHaveAttribute('required', '');
    await expect(page.locator('textarea')).toHaveAttribute('required', '');
  });
});

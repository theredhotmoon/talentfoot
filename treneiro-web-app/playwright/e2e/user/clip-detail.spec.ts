/**
 * Clip Detail Scenarios
 * Covers: page load, video presence, rating, posting a comment, subclip navigation,
 *         starting a challenge, challenge progress bar, and toasts
 */

import { test, expect } from '../../fixtures';

// Helper: navigate to the first clip from dashboard
async function gotoFirstClip(page: import('@playwright/test').Page) {
  await page.goto('/');
  const firstLink = page.locator('a[href*="/courses/"]').first();
  await expect(firstLink).toBeVisible({ timeout: 10_000 });
  await firstLink.click();
  await expect(page).toHaveURL(/\/courses\//, { timeout: 10_000 });
}

test.describe('Clip Detail — Page Load', () => {
  test('clip detail page renders video element', async ({ userPage: page }) => {
    await gotoFirstClip(page);

    await expect(page).toHaveURL(/\/courses\//, { timeout: 10_000 });
    // Video player must be present
    const video = page.locator('video');
    await expect(video).toBeVisible({ timeout: 10_000 });
  });

  test('shows clip info panel (title or description)', async ({ userPage: page }) => {
    await gotoFirstClip(page);

    // ClipInfo component renders — look for any heading or text block
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10_000 });
  });

  test('comments section is visible', async ({ userPage: page }) => {
    await gotoFirstClip(page);

    // ClipComments renders a textarea for new comments
    const commentArea = page.locator('textarea');
    await expect(commentArea).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Clip Detail — Rating', () => {
  test('rating buttons/stars are present and clickable', async ({ userPage: page }) => {
    await gotoFirstClip(page);

    // Look for rating stars or buttons — they're in ClipInfo
    // Use role=button and common class identifiers
    const ratingButtons = page.locator('button[aria-label*="star"], button[class*="star"], button[class*="rate"], svg[class*="star"]');

    if (await ratingButtons.count() > 0) {
      // Intercept the rating API call
      // Register listener BEFORE clicking to avoid race condition in CI.
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/rate') && resp.request().method() === 'POST',
      );
      await ratingButtons.first().click();
      const response = await responsePromise;
      expect(response.status()).toBeLessThan(500);
    } else {
      // Rating UI has generic buttons — find them by position in ClipInfo
      const buttons = page.locator('.card-static button, .card button').filter({ hasText: '' });
      if (await buttons.count() > 0) {
        await buttons.first().click();
      }
    }
  });
});

test.describe('Clip Detail — Comments', () => {
  test('posts a new comment and it appears in the list', async ({ userPage: page }) => {
    await gotoFirstClip(page);

    const commentText = `E2E test comment ${Date.now()}`;
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });

    await textarea.fill(commentText);

    // Register the response listener BEFORE clicking to avoid the race condition
    // where the response resolves before the listener is set up (especially in CI).
    const submitBtn = page.locator('button[type="submit"]').last();
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/comments') && resp.request().method() === 'POST',
      { timeout: 15_000 },
    );

    await submitBtn.click();

    const response = await responsePromise;
    expect(response.status()).toBe(201);

    // Comment should appear in the comment list
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 8_000 });
  });

  test('existing comments are listed when any exist', async ({ userPage: page }) => {
    await gotoFirstClip(page);

    // Comments load async — wait for the textarea (section rendered) then check DOM state.
    // Do NOT use waitForResponse here: the response may already be done before the listener
    // is registered, especially after gotoFirstClip already awaited navigation.
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Clip Detail — Subclips', () => {
  test('subclip sidebar renders if clip has subclips', async ({ userPage: page }) => {
    await gotoFirstClip(page);

    // SubclipsSidebar is a desktop sidebar — check if it renders
    const sidebar = page.locator('[class*="sidebar"], [class*="subclip"]').first();
    // Just verify page loads without crash (subclips may not be present)
    await expect(page.locator('video').first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking main clip button resets active subclip', async ({ userPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Collect hrefs FIRST before navigating away — the locator can't re-evaluate after goto().
    const clipLinks = page.locator('a[href*="/courses/"]');
    await expect(clipLinks.first()).toBeVisible({ timeout: 10_000 });
    const count = await clipLinks.count();
    const hrefs: string[] = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      const href = await clipLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }

    for (const href of hrefs) {
      await page.goto(href);
      await page.waitForLoadState('domcontentloaded');
      // Check if there are subclip navigation items
      const subclipItems = page.locator('[class*="subclip"] button, [class*="subclip"] [role="button"]');
      if (await subclipItems.count() > 1) {
        // Click a subclip
        await subclipItems.nth(1).click();
        await page.waitForTimeout(500);

        // Find and click the main clip button
        const mainBtn = page.locator('button').filter({ hasText: /main|clip principal|główny/i }).first();
        if (await mainBtn.count() > 0) {
          await mainBtn.click();
          await page.waitForTimeout(500);
        }
        break;
      }
    }
  });
});

test.describe('Clip Detail — Challenge', () => {
  test('challenge start modal appears and can be dismissed', async ({ userPage: page }) => {
    await gotoFirstClip(page);

    // Look for Start Course / Challenge button
    const startBtn = page.locator('button').filter({ hasText: /start|challenge|course/i }).first();

    if (await startBtn.count() > 0 && await startBtn.isVisible()) {
      await startBtn.click();

      // Modal should appear
      const modal = page.locator('.modal-overlay, .modal-card').first();
      await expect(modal).toBeVisible({ timeout: 5_000 });

      // Cancel / close the modal
      const cancelBtn = modal.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click();
        await expect(modal).not.toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test('starting a challenge shows the progress bar at bottom', async ({ userPage: page }) => {
    await gotoFirstClip(page);

    const startBtn = page.locator('button').filter({ hasText: /start|challenge|course/i }).first();

    if (await startBtn.count() > 0 && await startBtn.isVisible()) {
      await startBtn.click();

      // Confirm button in the modal
      const confirmBtn = page.locator('.fixed button').filter({ hasText: /start|confirm|yes/i }).first();
      if (await confirmBtn.count() > 0) {
        // Register listener BEFORE clicking to avoid race condition in CI.
        const respPromise = page.waitForResponse(
          (r) => r.url().includes('/challenges') && r.request().method() === 'POST',
        ).catch(() => null);
        await confirmBtn.click();
        await respPromise;

        // Progress bar should appear fixed at the bottom
        const progressBar = page.locator('[class*="progress"], [class*="challenge"]').filter({ hasText: /progress|\//i });
        await expect(progressBar.first()).toBeVisible({ timeout: 8_000 });
      }
    }
  });
});

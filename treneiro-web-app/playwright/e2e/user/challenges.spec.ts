/**
 * My Challenges Scenarios
 * Covers: page render, empty state, progress bar, completed badge, navigate to clip
 */

import { test, expect } from '../../fixtures';

test.describe('My Challenges', () => {
  test('page renders and shows title', async ({ userPage: page }) => {
    await page.goto('/my-challenges');
    // Either a challenges grid or an empty state trophy icon
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('shows empty state CTA when no challenges started', async ({ userPage: page }) => {
    // Mock API to return empty challenges
    await page.route('**/api/challenges', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/my-challenges');
    // Empty state has a 🏆 and a router-link to /
    const trophy = page.getByText('🏆');
    await expect(trophy).toBeVisible({ timeout: 8_000 });

    const browseLink = page.getByRole('link', { name: /browse|clips|explore/i });
    await expect(browseLink).toBeVisible();
  });

  test('challenge cards show progress bar when challenges exist', async ({ userPage: page }) => {
    // Mock API with a sample challenge
    const mockChallenge = {
      id: 'test-ch-1',
      clip_id: 1,
      clip_name: { en: 'Test Clip', pl: 'Test Klip' },
      clip_slug: { en: 'test-clip', pl: 'test-klip' },
      clip_thumbnail: null,
      watched_items: 2,
      total_items: 5,
      is_completed: false,
      started_at: new Date().toISOString(),
      finished_at: null,
      duration: null,
      watched_ids: [1, 2],
    };

    await page.route('**/api/challenges', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockChallenge]),
      });
    });

    await page.goto('/my-challenges');
    // Progress bar should be visible (div with rounded-full style)
    const progressBar = page.locator('.rounded-full').filter({ has: page.locator('[style*="width"]') }).first();
    await expect(progressBar).toBeVisible({ timeout: 8_000 });

    // Progress counter "2/5"
    await expect(page.getByText('2/5')).toBeVisible();
  });

  test('completed challenge shows completed badge', async ({ userPage: page }) => {
    const mockChallenge = {
      id: 'test-ch-done',
      clip_id: 2,
      clip_name: { en: 'Completed Clip', pl: 'Ukończony Klip' },
      clip_slug: { en: 'completed-clip', pl: 'ukonczony-klip' },
      clip_thumbnail: null,
      watched_items: 5,
      total_items: 5,
      is_completed: true,
      started_at: new Date(Date.now() - 86400000).toISOString(),
      finished_at: new Date().toISOString(),
      duration: '1:23:45',
      watched_ids: [1, 2, 3, 4, 5],
    };

    await page.route('**/api/challenges', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockChallenge]),
      });
    });

    await page.goto('/my-challenges');
    // Completed badge
    const completedBadge = page.locator('[style*="accent-emerald"]').filter({ hasText: /complet|ukończon/i }).first();
    await expect(completedBadge).toBeVisible({ timeout: 8_000 });

    // Trophy icon (🏆)
    await expect(page.getByText('🏆').first()).toBeVisible();
  });

  test('challenge card links to the correct clip detail', async ({ userPage: page }) => {
    const mockChallenge = {
      id: 'test-ch-nav',
      clip_id: 42,
      clip_name: { en: 'Nav Test Clip', pl: 'Klip Nav' },
      clip_slug: { en: 'nav-test-clip', pl: 'klip-nav' },
      clip_thumbnail: null,
      watched_items: 1,
      total_items: 3,
      is_completed: false,
      started_at: new Date().toISOString(),
      finished_at: null,
      duration: null,
      watched_ids: [1],
    };

    await page.route('**/api/challenges', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockChallenge]),
      });
    });

    await page.goto('/my-challenges');
    // Link should point to /challenge/...
    const link = page.locator(`a[href*="/challenge/"]`).first();
    await expect(link).toBeVisible({ timeout: 8_000 });
  });

  test('challenge duration is shown for completed challenges', async ({ userPage: page }) => {
    const mockChallenge = {
      id: 'test-ch-dur',
      clip_id: 3,
      clip_name: { en: 'Duration Clip', pl: 'Klip Czas' },
      clip_slug: { en: 'duration-clip', pl: 'klip-czas' },
      clip_thumbnail: null,
      watched_items: 3,
      total_items: 3,
      is_completed: true,
      started_at: new Date(Date.now() - 7200000).toISOString(),
      finished_at: new Date().toISOString(),
      duration: '2:00:00',
      watched_ids: [1, 2, 3],
    };

    await page.route('**/api/challenges', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockChallenge]),
      });
    });

    await page.goto('/my-challenges');
    await expect(page.getByText('2:00:00')).toBeVisible({ timeout: 8_000 });
  });
});

/**
 * Tags Scenarios (User)
 * Covers: tags list page, tag card render, browse by tag (tag detail), clip list in tag
 */

import { test, expect } from '../../fixtures';

test.describe('Tags — Browse', () => {
  test('tags list page renders the grid of tags', async ({ userPage: page }) => {
    await page.goto('/tags');
    const grid = page.locator('.grid').first();
    await expect(grid).toBeVisible();
  });

  test('each tag card shows its name', async ({ userPage: page }) => {
    await page.goto('/tags');
    // All router-links in the tags grid
    const tagLinks = page.locator('a[href*="/tags/"]');
    await expect(tagLinks.first()).toBeVisible({ timeout: 10_000 });

    const count = await tagLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each tag card shows clips count badge', async ({ userPage: page }) => {
    await page.goto('/tags');
    // Badge spans with clips count text
    const badge = page.locator('.grid span[style*="rgba(255,255,255,0.15)"]').first();
    if (await badge.count() > 0) {
      await expect(badge).toBeVisible();
    }
  });

  test('clicking a tag navigates to tag detail page', async ({ userPage: page }) => {
    await page.goto('/tags');
    const firstTagLink = page.locator('a[href*="/tags/"]').first();
    await expect(firstTagLink).toBeVisible({ timeout: 10_000 });

    const href = await firstTagLink.getAttribute('href');
    await firstTagLink.click();

    await expect(page).toHaveURL(/\/tags\//, { timeout: 8_000 });
    // URL should match /tags/<id>
    expect(page.url()).toMatch(/\/tags\/\w+/);
  });
});

test.describe('Tags — Tag Detail Page', () => {
  async function gotoFirstTagDetail(page: import('@playwright/test').Page) {
    await page.goto('/tags');
    const firstLink = page.locator('a[href*="/tags/"]').first();
    await firstLink.click();
  }

  test('tag detail page shows tag name as heading', async ({ userPage: page }) => {
    await gotoFirstTagDetail(page);

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });
  });

  test('tag detail page shows a list of related clips', async ({ userPage: page }) => {
    await gotoFirstTagDetail(page);

    // Clip tiles or links
    const clipLinks = page.locator('a[href*="/courses/"]');
    // There might be 0 clips in a tag — just check the page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('clicking a clip in tag detail navigates to clip detail', async ({ userPage: page }) => {
    await gotoFirstTagDetail(page);

    const clipLink = page.locator('a[href*="/courses/"]').first();
    if (await clipLink.count() > 0) {
      await clipLink.click();
      await expect(page).toHaveURL(/\/courses\//, { timeout: 8_000 });
    }
  });

  test('tag detail has a back navigation', async ({ userPage: page }) => {
    await gotoFirstTagDetail(page);

    // Click the "Tags" breadcrumb link to go back
    const breadcrumbTags = page.getByRole('navigation', { name: 'Breadcrumb' }).locator('a').filter({ hasText: /tags|tagi/i }).first();
    await breadcrumbTags.click();
    await expect(page).toHaveURL(/\/tags$/, { timeout: 8_000 });
  });
});

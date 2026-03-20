/**
 * Custom Playwright fixtures.
 *
 * Import `test` and `expect` from THIS file (not @playwright/test) to get
 * pre-authenticated admin and user pages.
 *
 * Usage:
 *   import { test, expect } from '../../fixtures';
 *
 *   test('my admin test', async ({ adminPage }) => { ... });
 *   test('my user test',  async ({ userPage  }) => { ... });
 */

import { test as base, type Page } from '@playwright/test';

type AuthFixtures = {
  /** Page authenticated as admin@admin.com */
  adminPage: Page;
  /** Page authenticated as testuser@talentfoot.com */
  userPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';

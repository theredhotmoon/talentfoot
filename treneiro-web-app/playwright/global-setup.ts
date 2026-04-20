/**
 * Global setup — runs ONCE before the entire test suite.
 *
 * Logs in as admin and as a regular user via the API, then persists the
 * browser storage state (cookies + localStorage) so individual tests can
 * skip the login UI entirely.
 *
 * Output files (git-ignored):
 *   playwright/.auth/admin.json
 *   playwright/.auth/user.json
 */

import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:8000';
const APP_BASE = 'http://localhost:5173';

interface LoginBody {
  email: string;
  password: string;
}

async function saveAuthState(
  config: FullConfig,
  creds: LoginBody,
  outFile: string,
) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: APP_BASE });
  const page = await context.newPage();

  // 1. Hit the SPA so Vite sets any initial cookies / LocalStorage baseline
  await page.goto(APP_BASE + '/login');
  await page.waitForLoadState('networkidle');

  // 2. Call the API login endpoint directly (fast, no UI form)
  const response = await page.request.post(`${API_BASE}/api/login`, {
    data: creds,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });

  if (!response.ok()) {
    const body = await response.text();
    console.error(`[global-setup] Login failed for ${creds.email}:`, response.status(), body);
    await browser.close();
    return;
  }

  const json = await response.json() as { token?: string; access_token?: string };

  const tokenValue = json.token ?? json.access_token;
  if (!tokenValue) {
    console.error(`[global-setup] No token in response for ${creds.email}:`, json);
    await browser.close();
    return;
  }

  // 3. Inject the Sanctum token into localStorage (same key used by the auth store)
  await page.evaluate((token: string) => {
    localStorage.setItem('token', token);
  }, tokenValue);

  // 4. Ensure the auth dir exists and persist state
  const dir = path.dirname(outFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await context.storageState({ path: outFile });
  await browser.close();
  console.log(`[global-setup] ✅ Auth state saved → ${outFile}`);
}

async function ensureTestClipExists(token: string) {
  try {
    const checkResp = await fetch(`${API_BASE}/api/test-clip`, {
      headers: { Accept: 'application/json' },
    });
    if (checkResp.ok) {
      console.log('[global-setup] Ensured dummy clip exists via /api/test-clip');
    } else {
      console.warn('[global-setup] Failed to ensure dummy clip exists:', await checkResp.text());
    }
  } catch (e) {
    console.warn('[global-setup] Could not check or create dummy clip:', e);
  }
}

async function disableWelcomeTourForUser(userToken: string) {
  try {
    const resp = await fetch(`${API_BASE}/api/profile/tips`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ show_tips: false }),
    });
    if (resp.ok) {
      console.log('[global-setup] ✅ WelcomeTour disabled for test user (show_tips=false)');
    } else {
      console.warn('[global-setup] Could not disable WelcomeTour:', resp.status, await resp.text());
    }
  } catch (e) {
    console.warn('[global-setup] Could not call profile/tips API:', e);
  }
}

async function ensureTestUserExists(adminToken: string) {
  const resp = await fetch(`${API_BASE}/api/users?search=testuser%40talentfoot.com`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Accept: 'application/json',
    },
  });
  const data = await resp.json() as { data: unknown[] };
  if (data?.data?.length === 0) {
    // Create the test user via API
    await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Test User',
        email: 'testuser@talentfoot.com',
        password: 'Password1!',
        password_confirmation: 'Password1!',
      }),
    });
    console.log('[global-setup] 🆕 Test user created: testuser@talentfoot.com');
  }
}

export default async function globalSetup(config: FullConfig) {
  const adminCreds: LoginBody = {
    email: 'admin@admin.com',
    password: '1234',
  };

  // Save admin auth first
  await saveAuthState(config, adminCreds, 'playwright/.auth/admin.json');

  // Ensure the regular test user exists (create via register if not)
  try {
    const loginResp = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(adminCreds),
    });
    const json = await loginResp.json() as { token?: string, access_token?: string };
    const token = json.token ?? json.access_token;
    if (token) {
      await ensureTestUserExists(token);
      await ensureTestClipExists(token);
    }
  } catch (e) {
    console.warn('[global-setup] Could not ensure test user:', e);
  }

  const userCreds: LoginBody = {
    email: 'testuser@talentfoot.com',
    password: 'Password1!',
  };

  // Log in as the test user and disable WelcomeTour so it never blocks tests in CI.
  try {
    const userLoginResp = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(userCreds),
    });
    const userJson = await userLoginResp.json() as { token?: string; access_token?: string };
    const userToken = userJson.token ?? userJson.access_token;
    if (userToken) {
      await disableWelcomeTourForUser(userToken);
    }
  } catch (e) {
    console.warn('[global-setup] Could not disable WelcomeTour for test user:', e);
  }

  await saveAuthState(config, userCreds, 'playwright/.auth/user.json');
}

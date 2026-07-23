import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function localChromiumExecutable(): string | undefined {
  if (process.platform !== 'win32' || !process.env.LOCALAPPDATA) return undefined;
  const browserRoot = join(process.env.LOCALAPPDATA, 'ms-playwright');
  if (!existsSync(browserRoot)) return undefined;
  const candidates = readdirSync(browserRoot)
    .filter((name) => name.startsWith('chromium-'))
    .sort()
    .reverse();
  const executable = candidates
    .map((name) => join(browserRoot, name, 'chrome-win64', 'chrome.exe'))
    .find((path) => existsSync(path));
  return executable;
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: process.env.CI ? undefined : 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: { executablePath: localChromiumExecutable() },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm.cmd run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

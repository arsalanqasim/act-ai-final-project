import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDirectory = join(root, 'docs', 'screenshots');
const baseURL = process.env.SHOWCASE_URL ?? 'http://127.0.0.1:4173';
let previewProcess;

function localChromiumExecutable() {
  if (process.platform !== 'win32' || !process.env.LOCALAPPDATA) return undefined;
  const browserRoot = join(process.env.LOCALAPPDATA, 'ms-playwright');
  if (!existsSync(browserRoot)) return undefined;
  const candidates = readdirSync(browserRoot)
    .filter((name) => name.startsWith('chromium-'))
    .sort()
    .reverse();
  return candidates
    .map((name) => join(browserRoot, name, 'chrome-win64', 'chrome.exe'))
    .find((path) => existsSync(path));
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {
      // The preview may still be starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }
  throw new Error(`Production preview did not become available at ${baseURL}. Run npm.cmd run build and check the preview logs.`);
}

async function ensurePreview() {
  try {
    const response = await fetch(baseURL);
    if (response.ok) return;
  } catch {
    // Start the local preview below.
  }
  if (process.env.SHOWCASE_URL) throw new Error(`SHOWCASE_URL is not reachable: ${baseURL}`);
  previewProcess = spawn('npm.cmd', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: root,
    stdio: 'ignore',
    windowsHide: true,
    shell: true
  });
  await waitForPreview();
}

async function preparePage(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('opp_pulse_is_guest_v2', 'true');
  });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.locator('#opp-card-opp_001').waitFor({ state: 'visible', timeout: 15000 });
}

async function capture() {
  mkdirSync(outputDirectory, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: localChromiumExecutable() });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await preparePage(page);
    await page.screenshot({ path: join(outputDirectory, '01-radar-overview.png'), fullPage: true });

    await page.locator('#btn-ingest-opportunity').click();
    await page.locator('#btn-tab-mode-text').click();
    await page.getByRole('button', { name: 'Paste Sample Post' }).click();
    await page.locator('[role="dialog"]').last().screenshot({ path: join(outputDirectory, '02-trusted-ingestion.png') });
    await page.locator('#btn-close-ingester-modal').click();

    await page.locator('#btn-open-career-workspace').click();
    await page.locator('#career-command-center-modal').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#career-command-center-modal').screenshot({ path: join(outputDirectory, '03-career-command-center.png') });
    await page.locator('#btn-close-career-center').click();

    await page.locator('#btn-track-application-opp_001').click();
    await page.locator('#app-workspace-modal-container').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#app-workspace-modal-container').screenshot({ path: join(outputDirectory, '04-application-workspace.png') });
    await page.close();
    await context.close();

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const mobilePage = await mobileContext.newPage();
    await preparePage(mobilePage);
    await mobilePage.screenshot({ path: join(outputDirectory, '05-mobile-view.png'), fullPage: true });
    await mobileContext.close();
  } finally {
    await browser.close();
  }
}

try {
  await ensurePreview();
  await capture();
  console.log(`Showcase screenshots written to ${outputDirectory}`);
} finally {
  if (previewProcess) previewProcess.kill();
}

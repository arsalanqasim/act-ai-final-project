import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('opp_pulse_is_guest_v2', 'true');
  });
  await page.goto('/');
  await expect(page.locator('#opp-card-opp_001')).toBeVisible();
});

test('guest saves an opportunity and creates/completes a task', async ({ page }) => {
  await page.locator('#btn-bookmark-opp_002').click();
  await expect(page.locator('#btn-bookmark-opp_002')).toHaveClass(/purple/);

  await page.locator('#btn-open-career-workspace').click();
  await expect(page.locator('#career-command-center-modal')).toBeVisible({ timeout: 15000 });
  await page.locator('#btn-new-task-global').click();
  await page.locator('#task-title-input').fill('Prepare portfolio links');
  await page.locator('#btn-submit-task-modal').click();
  await expect(page.locator('#action-task-modal-dialog')).toBeHidden();
  await expect(page.getByText('Prepare portfolio links')).toBeVisible();
  await page.locator('button[id^="btn-complete-task-"]').last().click();
  await expect(page.locator('button[id^="btn-reopen-task-"]')).toBeVisible();
});

test('notification preferences show an honest guest sign-in state', async ({ page }) => {
  await page.locator('#btn-notification-preferences').click();
  await expect(page.getByRole('heading', { name: 'Email alerts' })).toBeVisible();
  await expect(page.getByText('Sign in required')).toBeVisible();
  await expect(page.locator('#btn-sign-in-notification-preferences')).toBeVisible();
});

test('application workspace opens from an opportunity', async ({ page }) => {
  await page.locator('#btn-track-application-opp_001').click();
  await expect(page.locator('#app-workspace-modal-container')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#application-workspace-title')).toBeVisible();
});

test('career command center opens and exposes its tabs', async ({ page }) => {
  await page.locator('#btn-open-career-workspace').click();
  await expect(page.locator('#career-command-center-modal')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[role="tab"]')).toHaveCount(5);
  await expect(page.locator('#career-tab-kanban')).toBeVisible();
  await expect(page.locator('#career-tab-notifications')).toBeVisible();
});

test('Escape closes dialogs', async ({ page }) => {
  await page.locator('#btn-track-application-opp_001').click();
  await expect(page.locator('#app-workspace-modal-container')).toBeVisible({ timeout: 15000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#app-workspace-modal-container')).toBeHidden();

  await page.locator('#btn-open-career-workspace').click();
  await expect(page.locator('#career-command-center-modal')).toBeVisible({ timeout: 15000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#career-command-center-modal')).toBeHidden();
});

test('offline indicator appears when browser connectivity is unavailable', async ({ page, context }) => {
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.locator('#offline-status-banner')).toBeVisible();
  await expect(page.locator('#offline-status-banner')).toContainText('offline');
});

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { REPORT_ORIGIN } from './server-origins';

test('builder invalidates edited output, catches URL size failures, and recovers', async ({ page }) => {
  await page.goto(`${REPORT_ORIGIN}/build/`);
  const input = page.locator('#aggregate-input');
  const original = await input.inputValue();
  await page.locator('#generate-url').click();
  await expect(page.locator('#copy-url')).toBeEnabled();
  await input.fill('{');
  await expect(page.locator('#copy-url')).toBeDisabled();
  await expect(page.locator('#builder-success')).toBeEmpty();
  await page.locator('#generate-url').click();
  await expect(page.locator('#builder-error')).toContainText('Malformed JSON');
  const oversized = JSON.parse(original);
  oversized.top_page_path = `/${'x'.repeat(6000)}`;
  await input.fill(JSON.stringify(oversized));
  await page.locator('#generate-url').click();
  await expect(page.locator('#builder-error')).toContainText('4096');
  await expect(page.locator('#copy-url')).toBeDisabled();
  const download = page.waitForEvent('download');
  await page.locator('#download-brief').click();
  expect(await (await download).path()).toBeTruthy();
  await input.fill(original);
  await page.locator('#generate-url').click();
  await expect(page.locator('#copy-url')).toBeEnabled();
  await page.locator('#mode-report-url').click();
  await page.locator('#validate-url').click();
  await expect(page.locator('#copy-url')).toBeEnabled();
  await page.locator('#report-url-input').fill('https://invalid.test/');
  await expect(page.locator('#copy-url')).toBeDisabled();
});

test('downloaded file is readable offline with JS disabled, no requests, and print layout', async ({
  page,
  browser,
  browserName
}, testInfo) => {
  await page.goto(`${REPORT_ORIGIN}/build/`);
  const aggregate = JSON.parse(await page.locator('#aggregate-input').inputValue());
  aggregate.domain = 'private-client.example';
  aggregate.top_page_path = '/people/private-person';
  aggregate.warnings.push('private-person@example.test');
  await page.locator('#aggregate-input').fill(JSON.stringify(aggregate));
  const downloading = page.waitForEvent('download');
  await page.locator('#download-brief').click();
  const download = await downloading;
  const path = testInfo.outputPath('evidence-brief.html');
  await download.saveAs(path);
  const html = readFileSync(path, 'utf8');
  expect(html).not.toMatch(/private-client|private-person|<script|<form|<img|localStorage|sendBeacon/);
  // WebKit's offline emulation rejects even a minimal file:// document on
  // macOS. Its HTTP(S) requests are still recorded and blocked below.
  const context = await browser.newContext({ javaScriptEnabled: false, offline: browserName !== 'webkit' });
  const requests: string[] = [];
  await context.route(/^https?:/, (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  const offline = await context.newPage();
  await offline.goto(pathToFileURL(path).href);
  await expect(offline.getByRole('heading', { name: 'Engineering handoff' })).toBeVisible();
  await expect(offline.locator('body')).toContainText('additional source warning(s) withheld');
  await expect(offline.locator('body')).toContainText('Copies cannot be revoked');
  await offline.emulateMedia({ media: 'print' });
  await expect(offline.getByRole('heading', { name: 'Navigation timing evidence' })).toBeVisible();
  await offline.screenshot({ path: testInfo.outputPath('evidence-brief-print.png'), fullPage: true });
  expect(requests).toEqual([]);
  await context.close();
});

test('explicit labels are escaped and the file writes no browser storage', async ({
  page,
  browser,
  browserName
}, testInfo) => {
  await page.goto(`${REPORT_ORIGIN}/build/`);
  const aggregate = JSON.parse(await page.locator('#aggregate-input').inputValue());
  aggregate.top_page_path = '/<script>window.__injected=true</script>';
  await page.locator('#aggregate-input').fill(JSON.stringify(aggregate));
  await page.locator('#include-site-labels').check();
  const downloading = page.waitForEvent('download');
  await page.locator('#download-brief').click();
  const path = testInfo.outputPath('labeled-brief.html');
  await (await downloading).saveAs(path);
  const context = await browser.newContext({ offline: browserName !== 'webkit' });
  await context.route(/^https?:/, (route) => route.abort());
  const offline = await context.newPage();
  const requests: string[] = [];
  offline.on('request', (request) => {
    if (!request.url().startsWith('file:')) requests.push(request.url());
  });
  await offline.goto(pathToFileURL(path).href);
  await expect(offline.locator('body')).toContainText(aggregate.top_page_path);
  expect(
    await offline.evaluate(() => ({
      injected: '__injected' in window,
      local: localStorage.length,
      session: sessionStorage.length
    }))
  ).toEqual({ injected: false, local: 0, session: 0 });
  expect(await context.cookies()).toEqual([]);
  expect(requests).toEqual([]);
  await context.close();
});

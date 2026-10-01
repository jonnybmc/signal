import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  affirmingAggregateFixture,
  encodeSignalReportUrl,
  lowInpCoverageAggregateFixture,
  strongLcpCoverageAggregateFixture
} from '../../packages/signal-contracts/src/index.ts';
import { REPORT_ORIGIN } from './server-origins';

// Visual baselines for the RC3 redesign — vertical scroll narrative, light
// theme default, Signifier typography. Snapshots are scoped per section
// and refreshed via `pnpm test:e2e:visual:update` when the design lands
// or shifts.
// Fixed viewport chrome otherwise overlays headings in full-section captures.
// Navigation and progress remain visible in the separate functional suite.
const screenshotStylePath = path.join(__dirname, 'report-screenshot.css');

function buildReportUrl(aggregate: Parameters<typeof encodeSignalReportUrl>[0]) {
  const encoded = encodeSignalReportUrl(aggregate, `${REPORT_ORIGIN}/r`).url;
  return encoded;
}

test.describe('report visual regression — vertical scroll narrative', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Visual snapshots run in Chromium only.');

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
  });

  test('cover section presents the editorial masthead', async ({ page }) => {
    await page.goto(buildReportUrl(strongLcpCoverageAggregateFixture));
    const cover = page.locator('#cover');
    await cover.scrollIntoViewIfNeeded();
    await expect(cover).toHaveScreenshot('report-cover.png', {
      animations: 'disabled',
      caret: 'hide',
      stylePath: screenshotStylePath
    });
  });

  test('audience section presents the persona pair + tier table', async ({ page }) => {
    await page.goto(buildReportUrl(strongLcpCoverageAggregateFixture));
    const audience = page.locator('#audience');
    await audience.scrollIntoViewIfNeeded();
    await expect(audience).toHaveScreenshot('report-audience.png', {
      animations: 'disabled',
      caret: 'hide',
      stylePath: screenshotStylePath
    });
  });

  test('distance section presents the race lanes + LCP subparts', async ({ page }) => {
    await page.goto(buildReportUrl(strongLcpCoverageAggregateFixture));
    const distance = page.locator('#distance');
    await distance.scrollIntoViewIfNeeded();
    await expect(distance).toHaveScreenshot('report-distance.png', {
      animations: 'disabled',
      caret: 'hide',
      stylePath: screenshotStylePath
    });
  });

  test('funnel section presents the FCP/LCP/INP cliff', async ({ page }) => {
    await page.goto(buildReportUrl(strongLcpCoverageAggregateFixture));
    const funnel = page.locator('#funnel');
    await funnel.scrollIntoViewIfNeeded();
    await expect(funnel).toHaveScreenshot('report-funnel.png', {
      animations: 'disabled',
      caret: 'hide',
      stylePath: screenshotStylePath
    });
  });

  test('reduced funnel still feels intentional', async ({ page }) => {
    await page.goto(buildReportUrl(lowInpCoverageAggregateFixture));
    const funnel = page.locator('#funnel');
    await funnel.scrollIntoViewIfNeeded();
    await expect(funnel).toHaveScreenshot('report-funnel-reduced.png', {
      animations: 'disabled',
      caret: 'hide',
      stylePath: screenshotStylePath
    });
  });

  test('business section presents the KPI ledger + Rapid Fix CTA', async ({ page }) => {
    await page.goto(buildReportUrl(strongLcpCoverageAggregateFixture));
    const business = page.locator('#business');
    await business.scrollIntoViewIfNeeded();
    await expect(business).toHaveScreenshot('report-business.png', {
      animations: 'disabled',
      caret: 'hide',
      stylePath: screenshotStylePath
    });
  });

  test('affirming case keeps the same structure with calmer measured language', async ({ page }) => {
    await page.goto(buildReportUrl(affirmingAggregateFixture));
    const funnel = page.locator('#funnel');
    await funnel.scrollIntoViewIfNeeded();
    await expect(funnel).toHaveScreenshot('report-funnel-affirming.png', {
      animations: 'disabled',
      caret: 'hide',
      stylePath: screenshotStylePath
    });
  });
});

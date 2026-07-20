import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import path from 'path';

const url = 'file:///' + path.resolve('hospitals.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(url, { waitUntil: 'networkidle' });
// Scroll through so reveal-on-scroll elements settle into their final
// (visible) state before the scan, same as a real user would see them.
const h = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 250) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(60);
}
await page.waitForTimeout(500);

const results = await new AxeBuilder({ page }).analyze();
console.log('VIOLATIONS:', results.violations.length);
for (const v of results.violations) {
  console.log('---');
  console.log(v.id, '-', v.impact, '-', v.help);
  for (const node of v.nodes) {
    console.log('  target:', node.target.join(', '));
    console.log('  summary:', node.failureSummary.replace(/\n/g, ' '));
  }
}
await browser.close();

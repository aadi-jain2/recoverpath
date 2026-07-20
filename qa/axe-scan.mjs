import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(url, { waitUntil: 'networkidle' });
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

import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();

async function scan(label, setup) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  if (setup) await setup(page);
  const results = await new AxeBuilder({ page }).analyze();
  console.log(`=== ${label}: ${results.violations.length} violations ===`);
  for (const v of results.violations) {
    console.log(' -', v.id, v.impact, '|', v.help);
    for (const n of v.nodes) {
      console.log('   target:', n.target.join(', '));
      console.log('   summary:', n.failureSummary.replace(/\n/g, ' '));
    }
  }
  await context.close();
}

await scan('dark mode', async (page) => { await page.click('#themeToggle'); await page.waitForTimeout(300); });
await scan('mobile menu open (390px)', async (page) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.click('#navHamburger');
  await page.waitForTimeout(400);
});
await scan('mid-scroll (timeline + prototype active)', async (page) => {
  await page.evaluate(() => document.getElementById('timeline').scrollIntoView());
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(500);
});
await scan('prototype legend breakpoint (860px)', async (page) => {
  await page.setViewportSize({ width: 860, height: 900 });
  await page.evaluate(() => document.getElementById('protoLegend').scrollIntoView());
  await page.waitForTimeout(300);
});

await browser.close();

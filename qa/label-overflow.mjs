import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const page = await browser.newPage();

for (const w of [701, 768, 860, 980, 1024, 1280, 1440, 1920]) {
  await page.setViewportSize({ width: w, height: 1000 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById('prototype').scrollIntoView());
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const labels = Array.from(document.querySelectorAll('.proto-label'));
    return labels.map(l => {
      const r = l.getBoundingClientRect();
      return { id: l.id, left: Math.round(r.left), right: Math.round(r.right), overshoot: Math.max(0, Math.round(-r.left), Math.round(r.right - vw)) };
    });
  });
  console.log(`width=${w}`, JSON.stringify(data));
}
await browser.close();

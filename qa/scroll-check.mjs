import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const page = await browser.newPage();

for (const w of [375, 390, 428, 600, 768, 860, 980]) {
  await page.setViewportSize({ width: w, height: 1000 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  // try to actually scroll the page horizontally and see if position moves
  const result = await page.evaluate(() => {
    window.scrollTo({ left: 500, top: 0 });
    return { scrollX: window.scrollX, canScrollX: window.scrollX > 0 };
  });
  console.log(`width=${w}`, JSON.stringify(result));
}
await browser.close();

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const widths = [375, 390, 428, 600, 768, 860, 980, 1024, 1280, 1440, 1920];
const outDir = path.resolve('qa/screens');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

for (const w of widths) {
  await page.setViewportSize({ width: w, height: 1000 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  // full page screenshot
  await page.screenshot({ path: path.join(outDir, `full-${w}.png`), fullPage: true });

  // check horizontal overflow
  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const viewportWidth = document.documentElement.clientWidth;
    return { docWidth, viewportWidth, overflowing: docWidth > viewportWidth + 1 };
  });
  console.log(`width=${w} docWidth=${overflow.docWidth} viewport=${overflow.viewportWidth} overflowing=${overflow.overflowing}`);
}

console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors));
await browser.close();

import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const page = await browser.newPage();

for (const w of [375, 428, 600, 768, 860]) {
  await page.setViewportSize({ width: w, height: 1000 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const offenders = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    function isInsideCompareScroll(el) {
      return !!el.closest('.compare-scroll');
    }
    const results = [];
    document.querySelectorAll('body *').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      if (isInsideCompareScroll(el)) return;
      const overshoot = Math.max(rect.right - vw, -rect.left, 0);
      if (overshoot > 0.5) {
        results.push({
          tag: el.tagName, id: el.id, cls: (el.className || '').toString().slice(0, 60),
          left: Math.round(rect.left), right: Math.round(rect.right), overshoot: Math.round(overshoot)
        });
      }
    });
    results.sort((a, b) => b.overshoot - a.overshoot);
    return results.slice(0, 10);
  });
  console.log(`--- width=${w} ---`);
  console.log(JSON.stringify(offenders, null, 1));
}
await browser.close();

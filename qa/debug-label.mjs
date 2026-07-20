import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 768, height: 1000 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
// scroll to the prototype section so ScrollTrigger pin/refresh has engaged
await page.evaluate(() => {
  document.getElementById('prototype').scrollIntoView();
});
await page.waitForTimeout(500);

const debug = await page.evaluate(() => {
  const pv = document.getElementById('protoVisual');
  const band = document.getElementById('part-band');
  const label = document.getElementById('label-band');
  const cs = getComputedStyle(pv);
  return {
    protoVisualOffsetWidth: pv.offsetWidth,
    protoVisualTransform: cs.transform,
    bandOffsetWidth: band.offsetWidth,
    labelInlineStyle: { left: label.style.left, right: label.style.right, top: label.style.top },
    labelRect: label.getBoundingClientRect(),
    pvRect: pv.getBoundingClientRect()
  };
});
console.log(JSON.stringify(debug, null, 2));
await browser.close();

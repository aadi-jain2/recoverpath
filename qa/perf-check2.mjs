import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const client = await context.newCDPSession(page);

await page.setViewportSize({ width: 1280, height: 900 });

await page.addInitScript(() => {
  window.__clsValue = 0;
  window.__clsEntries = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__clsValue += entry.value;
          window.__clsEntries.push({ value: entry.value, hadRecentInput: entry.hadRecentInput });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
});

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500);

await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

// Real mouse-wheel scrolling (sets hadRecentInput=true for the browser's
// own input-tracking, matching how a real user's scroll would be judged
// for Core Web Vitals) instead of programmatic window.scrollTo.
const scrollStart = Date.now();
for (let i = 0; i < 120; i++) {
  await page.mouse.wheel(0, 90);
  await page.waitForTimeout(40);
}
const scrollDuration = Date.now() - scrollStart;

await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await page.waitForTimeout(500);

const cls = await page.evaluate(() => ({ value: window.__clsValue, count: window.__clsEntries.length, entries: window.__clsEntries }));
console.log('CLS value (real scroll gestures):', cls.value.toFixed(4));
console.log('Non-excluded shift count:', cls.count);
if (cls.entries.length) console.log('Details:', JSON.stringify(cls.entries.slice(0, 15)));
console.log('Scroll-through duration (6x CPU throttle, 120 wheel steps):', scrollDuration, 'ms');

await browser.close();

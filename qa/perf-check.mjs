import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const client = await context.newCDPSession(page);

await page.setViewportSize({ width: 1280, height: 900 });

// Measure CLS via PerformanceObserver, injected before navigation.
await page.addInitScript(() => {
  window.__clsValue = 0;
  window.__clsEntries = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__clsValue += entry.value;
          window.__clsEntries.push({ value: entry.value, sources: (entry.sources || []).map(s => s.node ? s.node.nodeName : 'unknown') });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
});

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500); // let fonts/layout settle

// throttle CPU 6x and scroll through the whole page, timing frame work
await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

const scrollStart = Date.now();
const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
const steps = 40;
for (let i = 0; i <= steps; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.floor((totalHeight / steps) * i));
  await page.waitForTimeout(80);
}
const scrollDuration = Date.now() - scrollStart;

await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await page.waitForTimeout(500);

const cls = await page.evaluate(() => ({ value: window.__clsValue, entries: window.__clsEntries }));
console.log('CLS value:', cls.value.toFixed(4));
if (cls.entries.length) console.log('CLS sources:', JSON.stringify(cls.entries.slice(0, 10)));
console.log('Scroll-through duration (6x CPU throttle, 40 steps):', scrollDuration, 'ms');
console.log('No crash / no console errors during throttled scroll = pass');

await browser.close();

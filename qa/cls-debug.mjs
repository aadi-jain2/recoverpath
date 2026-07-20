import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.setViewportSize({ width: 1280, height: 900 });

await page.addInitScript(() => {
  window.__shifts = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__shifts.push({
          value: entry.value,
          time: entry.startTime,
          scrollY: window.scrollY,
          rects: (entry.sources || []).map(s => {
            try {
              return { prev: s.previousRect ? { x: s.previousRect.x, y: s.previousRect.y, w: s.previousRect.width, h: s.previousRect.height } : null,
                       curr: s.currentRect ? { x: s.currentRect.x, y: s.currentRect.y, w: s.currentRect.width, h: s.currentRect.height } : null,
                       node: s.node ? (s.node.id ? '#' + s.node.id : s.node.className ? '.' + s.node.className.toString().slice(0,40) : s.node.nodeName) : 'unknown' };
            } catch(e) { return { node: 'err' }; }
          })
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
});

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500);

for (let i = 0; i < 120; i++) {
  await page.mouse.wheel(0, 90);
  await page.waitForTimeout(40);
}
await page.waitForTimeout(500);

const shifts = await page.evaluate(() => window.__shifts);
shifts
  .filter(s => s.value > 0.01)
  .forEach(s => {
    console.log(`value=${s.value.toFixed(3)} time=${s.time.toFixed(0)}ms scrollY=${s.scrollY}`);
    s.rects.forEach(r => console.log('   ', JSON.stringify(r)));
  });

await browser.close();

import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

// Trace first ~20 tab stops from the top of the page.
console.log('--- Tab order from top ---');
for (let i = 0; i < 20; i++) {
  await page.keyboard.press('Tab');
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName, id: el.id, cls: (el.className || '').toString().slice(0, 40),
      text: (el.textContent || '').trim().slice(0, 40),
      outline: cs.outlineStyle + ' ' + cs.outlineColor + ' ' + cs.outlineWidth
    };
  });
  console.log(i, JSON.stringify(info));
}

// Heading hierarchy check
console.log('--- Heading hierarchy ---');
const headings = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({
    level: h.tagName, text: h.textContent.trim().slice(0, 50), hidden: h.closest('.visually-hidden') !== null || h.classList.contains('visually-hidden')
  }));
});
headings.forEach(h => console.log(h.level, '-', h.text, h.hidden ? '(visually-hidden)' : ''));

await browser.close();

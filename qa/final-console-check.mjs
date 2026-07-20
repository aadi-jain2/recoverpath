import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const messages = [];
page.on('console', msg => messages.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => messages.push(`[pageerror] ${err.message}`));

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1000);

// theme toggle x2
await page.click('#themeToggle');
await page.waitForTimeout(300);
await page.click('#themeToggle');
await page.waitForTimeout(300);

// mobile menu open/close via hamburger + escape
await page.setViewportSize({ width: 390, height: 800 });
await page.click('#navHamburger');
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// full page scroll
await page.setViewportSize({ width: 1280, height: 900 });
for (let i = 0; i < 60; i++) {
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(30);
}

// hover sensor cards
const cards = await page.$$('.sensor-card');
for (const c of cards) {
  await c.hover();
  await page.waitForTimeout(100);
}

// scroll comparator table horizontally
await page.evaluate(() => document.getElementById('compareScroll').scrollIntoView());
await page.waitForTimeout(200);
await page.evaluate(() => { document.getElementById('compareScroll').scrollLeft = 400; });
await page.waitForTimeout(200);

// resize a few times (debounced handlers)
await page.setViewportSize({ width: 800, height: 900 });
await page.waitForTimeout(200);
await page.setViewportSize({ width: 1400, height: 900 });
await page.waitForTimeout(400);

const relevant = messages.filter(m => m.startsWith('[error]') || m.startsWith('[warning]') || m.startsWith('[pageerror]'));
console.log('Total console messages:', messages.length);
console.log('Errors/warnings/pageerrors:', relevant.length);
relevant.forEach(m => console.log(m));

await browser.close();

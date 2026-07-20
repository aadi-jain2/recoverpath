import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 390, height: 800 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

// Tab to the hamburger and activate with keyboard
await page.focus('#navHamburger');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);

let state = await page.evaluate(() => ({
  open: document.getElementById('mobileMenu').classList.contains('is-open'),
  active: document.activeElement.tagName + '.' + document.activeElement.className,
  expanded: document.getElementById('navHamburger').getAttribute('aria-expanded')
}));
console.log('after Enter on hamburger:', JSON.stringify(state));

// Tab through all focusable items inside the menu, confirm it wraps (trap)
const focusableCount = await page.evaluate(() => document.querySelectorAll('#mobileMenu a, #mobileMenu button').length);
console.log('focusable items in menu:', focusableCount);
for (let i = 0; i < focusableCount; i++) {
  await page.keyboard.press('Tab');
}
let afterLoop = await page.evaluate(() => document.activeElement.textContent.trim().slice(0, 30));
console.log('focus after tabbing through all items once (should wrap to first):', afterLoop);

// Escape should close and return focus to hamburger
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
state = await page.evaluate(() => ({
  open: document.getElementById('mobileMenu').classList.contains('is-open'),
  active: document.activeElement.id,
  expanded: document.getElementById('navHamburger').getAttribute('aria-expanded')
}));
console.log('after Escape:', JSON.stringify(state));

await browser.close();

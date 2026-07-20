import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const outDir = path.resolve('qa/screens');
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();

// 1. Mobile menu open, at 390px
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.click('#navHamburger');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'mobile-menu-open.png') });
  const state = await page.evaluate(() => ({
    ariaExpanded: document.getElementById('navHamburger').getAttribute('aria-expanded'),
    menuAriaHidden: document.getElementById('mobileMenu').getAttribute('aria-hidden')
  }));
  console.log('mobile menu state', state);
  await page.close();
}

// 2. Prototype legend at 860px
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 860, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('prototype').scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'proto-legend-860.png') });
  await page.close();
}

// 3. Timeline mid-scroll at 1280px
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.getElementById('timeline');
    const rect = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + rect.top - 300);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, 'timeline-1280.png') });
  await page.close();
}

// 4. Exploded view mid-scroll at 1280px (labels visible)
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.getElementById('prototypeStage');
    const rect = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + rect.top + window.innerHeight * 1.3);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, 'exploded-1280.png') });
  await page.close();
}

// 5. Dark mode toggle
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.click('#themeToggle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'dark-mode.png') });
  await page.close();
}

await browser.close();
console.log('done');

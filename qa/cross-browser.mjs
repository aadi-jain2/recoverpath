import { chromium, firefox, webkit } from 'playwright';
import path from 'path';
import fs from 'fs';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const outDir = path.resolve('qa/screens');
fs.mkdirSync(outDir, { recursive: true });

const engines = { chromium, firefox, webkit };

for (const [name, engine] of Object.entries(engines)) {
  const browser = await engine.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const support = await page.evaluate(() => {
    const testEl = document.createElement('div');
    return {
      backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)') || CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),
      aspectRatio: CSS.supports('aspect-ratio', '3 / 4'),
      positionSticky: CSS.supports('position', 'sticky'),
      colorMix: CSS.supports('background', 'color-mix(in srgb, red 50%, blue)'),
      localStorageWorks: (() => { try { localStorage.setItem('t','1'); localStorage.removeItem('t'); return true; } catch(e){ return false; } })(),
      deviceFrameAspect: getComputedStyle(document.getElementById('deviceRenderPlaceholder')).aspectRatio,
      navBackdrop: getComputedStyle(document.getElementById('siteNav')).backdropFilter || getComputedStyle(document.getElementById('siteNav')).webkitBackdropFilter
    };
  });

  await page.screenshot({ path: path.join(outDir, `crossbrowser-${name}.png`) });

  // exercise theme toggle + mobile menu quickly
  await page.click('#themeToggle');
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.click('#navHamburger');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, `crossbrowser-${name}-mobile-menu.png`) });

  console.log(`=== ${name} ===`);
  console.log('support:', JSON.stringify(support));
  console.log('console errors:', JSON.stringify(errors));
  await browser.close();
}

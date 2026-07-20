import { chromium } from 'playwright';
import path from 'path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'load' });
const meta = await page.evaluate(() => ({
  title: document.title,
  description: document.querySelector('meta[name=description]')?.content,
  canonical: document.querySelector('link[rel=canonical]')?.href,
  ogTitle: document.querySelector('meta[property="og:title"]')?.content,
  ogImage: document.querySelector('meta[property="og:image"]')?.content,
  twitterCard: document.querySelector('meta[name="twitter:card"]')?.content,
  favicon: document.querySelector('link[rel=icon]')?.href.slice(0, 50),
  h1Count: document.querySelectorAll('h1').length,
  h1Text: document.querySelector('h1')?.textContent
}));
console.log(JSON.stringify(meta, null, 2));
await browser.close();

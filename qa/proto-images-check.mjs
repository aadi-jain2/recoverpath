import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = "file:///" + path.resolve(__dirname, "..", "index.html").replace(/\\/g, "/");

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(url);
await page.waitForTimeout(1000);

const imgs = await page.evaluate(() =>
  [...document.querySelectorAll('img[src*="images/prototype"]')].map(i => ({
    src: i.getAttribute("src"),
    ok: i.complete && i.naturalWidth > 0
  }))
);
console.log("prototype images:", imgs.filter(i => !i.ok).length ? imgs : `${imgs.length} all loaded OK`);

await page.evaluate(() => document.getElementById("solution").scrollIntoView({ block: "center" }));
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(__dirname, "proto-solution-check.png") });

await page.evaluate(() => document.getElementById("prototype").scrollIntoView({ block: "start" }));
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(__dirname, "proto-closed-check.png") });

for (let i = 0; i < 8; i++) {
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(200);
}
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(__dirname, "proto-exploded-check.png") });

await page.evaluate(() => document.getElementById("prototypePhotoGallery").scrollIntoView({ block: "center" }));
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(__dirname, "proto-gallery-check.png") });

console.log("console errors:", errors);
await browser.close();

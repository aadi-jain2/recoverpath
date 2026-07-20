import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileUrl = "file://" + path.resolve(__dirname, "..", "index.html").replace(/\\/g, "/");

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
page.on("pageerror", err => errors.push(err.message));

await page.goto(fileUrl);
await page.waitForTimeout(1000);

const mark = await page.$(".brand-mark");
const box = await mark.boundingBox();
console.log("brand-mark box:", box);

const heroVisual = await page.$(".hero-visual");
console.log("hero-visual present:", !!heroVisual);

await page.screenshot({ path: path.resolve(__dirname, "logo-hero-light.png") });

await page.click("#themeToggle");
await page.waitForTimeout(400);
await page.screenshot({ path: path.resolve(__dirname, "logo-hero-dark.png") });

console.log("console errors:", errors);

await browser.close();

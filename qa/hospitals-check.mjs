import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const idxUrl = "file://" + path.join(root, "index.html").replace(/\\/g, "/");
const hospUrl = "file://" + path.join(root, "hospitals.html").replace(/\\/g, "/");

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

async function withErrors(page, label) {
  const errors = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(label + ": " + msg.text()); });
  page.on("pageerror", err => errors.push(label + " (pageerror): " + err.message));
  return errors;
}

// ---- 1. index.html regression: nav link, mobile menu, theme toggle, reveal ----
let page = await context.newPage();
const idxErrors = await withErrors(page, "index");
await page.goto(idxUrl);
await page.waitForTimeout(700);

const hospLinkDesktop = await page.$('.nav-external[href="hospitals.html"]');
console.log("index.html: desktop 'For Hospitals' link present:", !!hospLinkDesktop);

// mobile menu at narrow width
await page.setViewportSize({ width: 480, height: 800 });
await page.waitForTimeout(200);
await page.click("#navHamburger");
await page.waitForTimeout(500);
const menuOpen = await page.evaluate(() => document.getElementById("mobileMenu").classList.contains("is-open"));
console.log("index.html: mobile menu opens:", menuOpen);
const hospLinkMobile = await page.$('.mobile-menu-links a[href="hospitals.html"]');
console.log("index.html: mobile 'For Hospitals' link present:", !!hospLinkMobile);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const menuClosed = await page.evaluate(() => !document.getElementById("mobileMenu").classList.contains("is-open"));
console.log("index.html: Escape closes mobile menu:", menuClosed);

await page.setViewportSize({ width: 1440, height: 900 });
await page.click("#themeToggle");
await page.waitForTimeout(400);
const isDark = await page.evaluate(() => document.documentElement.getAttribute("data-theme") === "dark");
console.log("index.html: theme toggle works:", isDark);

// click the nav link and verify real navigation to hospitals.html
await page.click('.nav-external[href="hospitals.html"]');
await page.waitForLoadState("load");
console.log("index.html -> nav click navigated to:", page.url());
await page.goBack();
await page.waitForTimeout(300);

await page.screenshot({ path: path.join(__dirname, "regress-index-light.png") });

// ---- 2. hospitals.html: dashboard link, charts, dark mode, mobile menu ----
let hpage = await context.newPage();
const hospErrors = await withErrors(hpage, "hospitals");
await hpage.goto(hospUrl);
await hpage.waitForTimeout(1000);

const dashLink = await hpage.$('a[href="https://recband.vercel.app/dashboard"]');
const dashTarget = dashLink ? await dashLink.getAttribute("target") : null;
const dashRel = dashLink ? await dashLink.getAttribute("rel") : null;
console.log("hospitals.html: dashboard link present, target/rel:", dashTarget, dashRel);

const brandLink = await hpage.$('.brand[href="index.html"]');
console.log("hospitals.html: logo links back to index.html:", !!brandLink);

await hpage.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
await hpage.waitForTimeout(1200);
const rocDrawn = await hpage.evaluate(() => {
  const p = document.getElementById("rocCurvePath");
  return p ? getComputedStyle(p).strokeDashoffset : null;
});
console.log("hospitals.html: ROC path strokeDashoffset after scroll (should be ~0px):", rocDrawn);

await hpage.screenshot({ path: path.join(__dirname, "hospitals-light.png"), fullPage: true });

await hpage.click("#themeToggle");
await hpage.waitForTimeout(400);
await hpage.screenshot({ path: path.join(__dirname, "hospitals-dark.png"), fullPage: true });

// mobile menu on hospitals.html
await hpage.setViewportSize({ width: 480, height: 800 });
await hpage.waitForTimeout(200);
await hpage.click("#navHamburger");
await hpage.waitForTimeout(500);
const hMenuOpen = await hpage.evaluate(() => document.getElementById("mobileMenu").classList.contains("is-open"));
console.log("hospitals.html: mobile menu opens:", hMenuOpen);

console.log("\nConsole errors — index.html:", idxErrors);
console.log("Console errors — hospitals.html:", hospErrors);

await browser.close();

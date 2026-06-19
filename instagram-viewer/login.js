/**
 * One-time login script — saves your Instagram session to disk so the
 * main viewer never has to log in again (survives restarts).
 */
require("dotenv").config();
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const readline = require("readline");

const SESSION_PATH = path.join(__dirname, ".session");

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

async function main() {
  const username = process.env.INSTAGRAM_USERNAME || await ask("Instagram username: ");
  const password = process.env.INSTAGRAM_PASSWORD || await ask("Instagram password: ");

  console.log("\nOpening browser — log in, handle any 2FA, then press Enter here...\n");

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle" });

  // Fill credentials
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation away from login page
  await page.waitForURL((url) => !url.href.includes("/accounts/login"), { timeout: 30000 }).catch(() => {});

  // Prompt user to complete 2FA / dismiss dialogs manually
  await ask('Complete any 2FA or "Save info" dialogs in the browser, then press Enter here: ');

  // Dismiss "Turn on notifications" popup if present
  const notifBtn = page.locator('button:has-text("Not Now")').first();
  if (await notifBtn.isVisible().catch(() => false)) await notifBtn.click();

  // Save session
  const storageState = await context.storageState();
  fs.writeFileSync(SESSION_PATH, JSON.stringify(storageState, null, 2));
  console.log(`\nSession saved to ${SESSION_PATH}`);
  console.log('Run "npm start" to launch the hands-free viewer.\n');

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });

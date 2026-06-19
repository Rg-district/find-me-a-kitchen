/**
 * Hands-free Instagram viewer
 * - Starts on Reels tab or Home feed (configurable via .env)
 * - Auto-plays reels back-to-back
 * - Auto-advances photos on a timer
 * - Keyboard controls: space = pause/resume, → = skip, ← = back, q = quit
 */
require("dotenv").config();
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SESSION_PATH = path.join(__dirname, ".session");
const PHOTO_DELAY = parseInt(process.env.PHOTO_DELAY_MS ?? "5000", 10);
const REEL_DELAY = parseInt(process.env.REEL_DELAY_MS ?? "0", 10);
const MAX_POSTS = parseInt(process.env.MAX_POSTS ?? "0", 10);
const START_ON = process.env.START_ON ?? "reels";
const HEADLESS = process.env.HEADLESS === "true";

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg) {
  process.stdout.write(`\r[Instagram Viewer] ${msg}`.padEnd(80));
}

// ─── Keyboard control (non-blocking) ────────────────────────────────────────

let paused = false;
let skip = false;
let back = false;
let quit = false;

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (key) => {
    if (key === " ") { paused = !paused; log(paused ? "⏸  Paused — press Space to resume" : "▶  Resumed"); }
    else if (key === "[C") { skip = true; } // →
    else if (key === "[D") { back = true; } // ←
    else if (key === "q" || key === "") { quit = true; log("Quitting..."); process.exit(0); }
  });
  console.log("Controls: [Space] pause/resume  [→] skip  [←] back  [q] quit\n");
}

// ─── Wait with pause/skip support ───────────────────────────────────────────

async function waitWithControls(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (quit) return "quit";
    if (skip) { skip = false; return "skip"; }
    if (back) { back = false; return "back"; }
    if (!paused) {
      const remaining = Math.ceil((end - Date.now()) / 1000);
      log(`⏱  Next in ${remaining}s  [Space=pause  →=skip  ←=back  q=quit]`);
    }
    await sleep(250);
  }
  return "next";
}

// ─── Reel auto-player ───────────────────────────────────────────────────────

async function playReels(page) {
  log("Navigating to Reels...");
  await page.goto("https://www.instagram.com/reels/", { waitUntil: "networkidle" });
  await sleep(2000);

  // Dismiss any dialogs
  for (const text of ["Not Now", "Allow", "Turn Off"]) {
    const btn = page.locator(`button:has-text("${text}")`).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) await btn.click().catch(() => {});
  }

  let postCount = 0;

  while (!quit) {
    if (MAX_POSTS > 0 && postCount >= MAX_POSTS) {
      log("Reached MAX_POSTS limit — looping back to top...");
      await page.goto("https://www.instagram.com/reels/", { waitUntil: "networkidle" });
      await sleep(2000);
      postCount = 0;
    }

    // Make sure any video on screen is playing
    await page.evaluate(() => {
      const videos = document.querySelectorAll("video");
      videos.forEach((v) => {
        if (v.paused) v.play().catch(() => {});
        v.muted = false;
      });
    }).catch(() => {});

    // Get current reel duration for smart waiting
    const duration = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v ? (v.duration || 0) : 0;
    }).catch(() => 0);

    const waitMs = REEL_DELAY > 0 ? REEL_DELAY : Math.max((duration || 15) * 1000, 5000);
    log(`▶  Playing reel ${postCount + 1} (~${Math.ceil(waitMs / 1000)}s)`);

    const action = await waitWithControls(waitMs);
    if (action === "quit") break;

    // Scroll down to next reel
    if (action !== "back") {
      await page.keyboard.press("ArrowDown");
      postCount++;
    } else {
      await page.keyboard.press("ArrowUp");
      postCount = Math.max(0, postCount - 1);
    }
    await sleep(800);
  }
}

// ─── Feed photo auto-player ─────────────────────────────────────────────────

async function playFeed(page) {
  log("Navigating to Home feed...");
  await page.goto("https://www.instagram.com/", { waitUntil: "networkidle" });
  await sleep(2000);

  // Dismiss any dialogs
  for (const text of ["Not Now", "Allow", "Turn Off"]) {
    const btn = page.locator(`button:has-text("${text}")`).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) await btn.click().catch(() => {});
  }

  let postCount = 0;
  // Collect post elements as we scroll
  const seenPosts = new Set();

  while (!quit) {
    if (MAX_POSTS > 0 && postCount >= MAX_POSTS) {
      log("Reached MAX_POSTS — looping back to top...");
      await page.goto("https://www.instagram.com/", { waitUntil: "networkidle" });
      await sleep(2000);
      postCount = 0;
      seenPosts.clear();
    }

    // Find the next unprocessed article/post
    const posts = await page.locator("article").all();
    const current = posts[postCount] ?? posts[posts.length - 1];

    if (current) {
      await current.scrollIntoViewIfNeeded().catch(() => {});
      await sleep(500);

      // If it contains a video (reel/video post), play it
      const hasVideo = await current.locator("video").count() > 0;
      if (hasVideo) {
        await page.evaluate((el) => {
          const v = el.querySelector("video");
          if (v) { v.muted = false; v.play().catch(() => {}); }
        }, await current.elementHandle()).catch(() => {});

        const duration = await page.evaluate((el) => {
          const v = el.querySelector("video");
          return v ? (v.duration || 15) : 15;
        }, await current.elementHandle()).catch(() => 15);

        const waitMs = REEL_DELAY > 0 ? REEL_DELAY : Math.max(duration * 1000, 5000);
        log(`▶  Playing video post ${postCount + 1} (~${Math.ceil(waitMs / 1000)}s)`);
        const action = await waitWithControls(waitMs);
        if (action === "quit") break;
        if (action === "back") { postCount = Math.max(0, postCount - 1); continue; }
      } else {
        log(`📸  Photo post ${postCount + 1} — showing for ${PHOTO_DELAY / 1000}s`);
        const action = await waitWithControls(PHOTO_DELAY);
        if (action === "quit") break;
        if (action === "back") { postCount = Math.max(0, postCount - 1); continue; }
      }
    }

    // Scroll to load more if near the bottom
    const atBottom = await page.evaluate(() =>
      window.scrollY + window.innerHeight >= document.body.scrollHeight - 200
    ).catch(() => false);

    if (atBottom) {
      await page.evaluate(() => window.scrollBy(0, 600));
      await sleep(2000);
    }

    postCount++;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error(
      'No saved session found.\nRun "npm run login" first to save your Instagram session.\n'
    );
    process.exit(1);
  }

  const storageState = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    storageState,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  // Hide webdriver flag to reduce detection
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await context.newPage();

  console.log(`Starting hands-free Instagram viewer (${START_ON} mode)...\n`);

  try {
    if (START_ON === "reels") {
      await playReels(page);
    } else {
      await playFeed(page);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error("\nError:", e.message); process.exit(1); });

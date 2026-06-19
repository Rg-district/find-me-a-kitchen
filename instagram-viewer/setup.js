/**
 * One-time setup: installs Playwright browsers.
 */
const { execSync } = require("child_process");

console.log("Installing Playwright Chromium browser...\n");
try {
  execSync("npx playwright install chromium", { stdio: "inherit" });
  console.log("\nSetup complete! Next steps:");
  console.log('  1. Copy .env.example to .env and fill in your credentials');
  console.log('  2. Run "npm run login" to save your Instagram session');
  console.log('  3. Run "npm start" to launch the hands-free viewer\n');
} catch (e) {
  console.error("Setup failed:", e.message);
  process.exit(1);
}

# Instagram Hands-Free Viewer

Auto-plays Instagram Reels and photos from accounts you follow, hands-free, while you work.

## How it works

1. A real Chromium browser opens and logs into your Instagram account
2. It navigates to the Reels tab (or your Home feed)
3. Reels play automatically back-to-back; photos advance on a timer
4. You control it with keyboard shortcuts — no mouse needed

## Setup (one time)

```bash
cd instagram-viewer

# 1. Install dependencies
npm install

# 2. Install the Chromium browser
npm run setup

# 3. Copy the example config
cp .env.example .env

# 4. Edit .env with your Instagram username/password and preferences
nano .env   # or open in any editor

# 5. Save your login session (opens a browser window for you to log in)
npm run login
```

During `npm run login`, a browser window opens. Log in normally, complete any 2FA, then press Enter in the terminal. Your session is saved locally so you never have to log in again.

## Running the viewer

```bash
npm start
```

## Keyboard controls

| Key | Action |
|-----|--------|
| `Space` | Pause / Resume |
| `→` (right arrow) | Skip to next post |
| `←` (left arrow) | Go back to previous post |
| `q` | Quit |

## Configuration (`.env`)

| Setting | Default | Description |
|---------|---------|-------------|
| `INSTAGRAM_USERNAME` | — | Your Instagram username |
| `INSTAGRAM_PASSWORD` | — | Your Instagram password |
| `PHOTO_DELAY_MS` | `5000` | How long to show each photo (ms) |
| `REEL_DELAY_MS` | `0` | How long to play each reel (0 = full reel) |
| `MAX_POSTS` | `50` | Posts before looping back to top (0 = infinite) |
| `START_ON` | `reels` | `reels` or `feed` |
| `HEADLESS` | `false` | Run browser in background (`true`) or visible (`false`) |

## Notes

- Your session file (`.session`) stays on your machine only — never committed to git
- The browser runs undetected as a normal user session
- Works with accounts you follow — no API keys needed
- If Instagram asks for 2FA during `npm run login`, complete it in the browser window before pressing Enter

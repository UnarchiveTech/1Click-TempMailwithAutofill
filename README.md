# 1Click: Temp Mail with Autofill

A powerful cross-browser extension that generates temporary email addresses and automatically fills forms with one click. Built with [WXT](https://wxt.dev/) for cross-browser compatibility and modern TypeScript.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/oilafkncmnboohnekbnokkifjbnjeecn?label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/1click-autofill-with-temp/oilafkncmnboohnekbnokkifjbnjeecn)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Features

- **Instant Temporary Emails** — Generate disposable addresses from multiple providers (Guerrilla Mail, Burner.kiwi)
- **One-Click Autofill** — Automatically fill registration forms with generated credentials
- **Smart OTP Handling** — Detect and fill verification codes automatically
- **Auto-Extend** — Per-inbox setting to prevent Guerrilla Mail addresses from expiring
- **Email Management** — Track, archive, search, and export all generated inboxes
- **Credential History** — Save and manage credentials for every website
- **Custom Settings** — Personalize names, passwords, and provider preferences
- **QR Code Generation** — Share email addresses as QR codes
- **Cross-Browser** — Works on Chrome (MV3) and Firefox (MV2/MV3)
- **Secure Passwords** — Uses `crypto.getRandomValues()` (not `Math.random()`)

## 🚀 Quick Start

### Install from Store

- 🌐 **Chrome Web Store**: [Install 1Click: Temp Mail with Autofill](https://chromewebstore.google.com/detail/1click-autofill-with-temp/oilafkncmnboohnekbnokkifjbnjeecn)
- 🦊 **Firefox Add-ons**: Coming soon!

### Load Built Extension Manually

1. Run `npm run build` (outputs to `.output/chrome-mv3/`)
2. Open `chrome://extensions/` → Enable **Developer mode**
3. Click **Load unpacked** → Select `.output/chrome-mv3/`

For Firefox:
1. Run `npm run build:firefox` (outputs to `.output/firefox-mv2/`)
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** → Select any file in `.output/firefox-mv2/`

## 🎮 Usage Guide

1. **Generate a Temporary Email** — Click the extension icon → the email is copied to clipboard automatically
2. **Autofill Forms** — On any registration page, click the blue autofill icon next to each field
3. **OTP Handling** — After submitting a form, the extension monitors your inbox and fills the OTP automatically
4. **Custom Password** — Settings → Enable **"Use Custom Password"** → Enter your password
5. **Manage Inboxes** — Use the Email Management tab to view active, expired, and archived inboxes

## 🏗️ Development

### Prerequisites

- **Node.js** v18 or higher
- **npm** v8+ or **bun** v1.0+

### Setup

```bash
# Clone the repo
git clone https://github.com/UnarchiveTech/1Click-TempMailwithAutofill
cd 1Click-TempMailwithAutofill

# Install dependencies
npm install
# or
bunx --bun install
```

### Development Commands

```bash
# Chrome — hot-reloading dev mode
npm run dev
# or
npx wxt

# Firefox — hot-reloading dev mode
npm run dev:firefox
# or
npx wxt --browser firefox

# Production build (Chrome)
npm run build
# or
npx wxt build

# Production build (Firefox)
npm run build:firefox
# or
npx wxt build --browser firefox

# Create distributable zip (Chrome)
npm run zip
# or
npx wxt zip

# Create distributable zip (Firefox)
npm run zip:firefox
# or
npx wxt zip --browser firefox

# Type-check without building
npm run typecheck
# or
npx tsc --noEmit

# Clean build artifacts
npm run clean
# or
npx wxt clean
```

> ⚠️ **Important**: `npm run dev` runs `wxt` (no subcommand). In WXT 0.21+, the dev server is `wxt [root]` — `wxt dev` would treat `dev` as the root directory. Always use `npm run dev` / `npm run dev:firefox`, or `npx wxt` / `npx wxt --browser firefox` directly.


### Hot Reload Workflow (Chrome)

1. Run `npm run dev` — WXT starts a dev server and auto-rebuilds on changes
2. Open `chrome://extensions/` → Enable **Developer mode**
3. Click **Load unpacked** → select `.output/chrome-mv3-dev/`
4. Changes to source files auto-reload the extension

### Hot Reload Workflow (Firefox)

1. Run `npm run dev:firefox` — WXT opens Firefox automatically with the extension loaded
2. Changes to source files hot-reload in Firefox

## 📁 Project Structure

```
1Click-TempMailwithAutofill/
├── src/
│   ├── entrypoints/              # WXT entrypoints (auto-detected)
│   │   ├── background.ts         # Service worker (MV3) / background page (MV2)
│   │   ├── content.ts            # Content script injected into all pages
│   │   └── popup/
│   │       ├── index.html        # Popup UI
│   │       ├── index.ts          # Popup entry (imports popup.ts)
│   │       └── styles.css        # Popup styles
│   ├── popup/
│   │   ├── popup.ts              # Popup logic (~3500 lines)
│   │   ├── data-manager.ts       # Export/import utilities
│   │   └── styles.css            # Popup styles (source)
│   ├── utils/
│   │   └── types.ts              # Shared TypeScript interfaces
│   ├── public/
│   │   ├── icons/                # Extension icons (16, 32, 48, 64, 128px)
│   │   └── qrcode.js             # Vendored QR code library (served as-is)
│   └── icons/                    # Source icons
├── wxt.config.ts                 # WXT configuration (replaces manifest.json)
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

### Output Structure (after build)

```
.output/
├── chrome-mv3/                   # Chrome production build
│   ├── manifest.json             # Auto-generated by WXT
│   ├── background.js
│   ├── content-scripts/content.js
│   ├── popup.html
│   ├── chunks/
│   └── assets/
└── firefox-mv2/                  # Firefox production build (auto-adapted)
```

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `npx wxt dev:firefox` fails | Use `npm run dev:firefox` or `npx wxt dev --browser firefox` |
| Build fails | Run `npm install` then `npm run build` |
| Extension not loading | Select `.output/chrome-mv3/` (not `dist/`) in Chrome |
| Stale Vite cache | Delete `.output/` and `node_modules/.vite/`, then rebuild |
| TypeScript errors | Run `npm run typecheck` to see all errors |

## 🤝 Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Make changes in `src/`
4. Test: `npm run dev`
5. Build: `npm run build`
6. Typecheck: `npm run typecheck`
7. Commit and open a Pull Request

## 🙏 Acknowledgments

Special thanks to [**Enzo Davico**](https://github.com/envico801) for their valuable contributions.

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

*Built with [WXT](https://wxt.dev/) · TypeScript 6 · Vite 7*
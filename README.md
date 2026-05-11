# 1Click Temp Mail Autofill Form

Generate temporary email addresses and auto-fill OTPs and login forms with one click.

## Features

- **Temporary Email Generation**: Create disposable email addresses instantly
- **OTP Auto-Detection**: Automatically detects and extracts OTP codes from emails
- **Form Auto-Fill**: One-click OTP and email form filling
- **Multiple Browser Support**: Works on Chrome and Firefox
- **Identity Management**: Manage multiple identities with custom names
- **Inbox Management**: View and manage emails across multiple inboxes
- **Tag System**: Organize inboxes with custom tags and colors

## Installation

### Chrome
1. Download the latest release from the [Releases](https://github.com/yourusername/1click-temp-mail-autofill-form/releases) page
2. Extract the downloaded zip file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted folder

### Firefox
1. Download the latest Firefox release from the [Releases](https://github.com/yourusername/1click-temp-mail-autofill-form/releases) page
2. Extract the downloaded zip file
3. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on" and select the `manifest.json` file in the extracted folder

## Development

### Prerequisites
- Node.js 18+ or Bun
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/1click-temp-mail-autofill-form.git
cd 1click-temp-mail-autofill-form

# Install dependencies
bun install

# Run development server (Chrome)
bun run dev

# Run development server (Firefox)
bun run dev:firefox
```

### Build

```bash
# Build for Chrome
bun run build

# Build for Firefox
bun run build:firefox

# Create zip package
bun run zip
bun run zip:firefox
```

### Linting and Type Checking

```bash
# Run Biome lint check
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Run TypeScript type check
bun run typecheck
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── entrypoints/         # Extension entry points (app, popup, sidepanel, background)
├── features/            # Feature-specific logic (inbox, identities, etc.)
├── utils/               # Utility functions and types
└── views/               # Page views (Inbox, Identities, Settings, etc.)
```

## Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

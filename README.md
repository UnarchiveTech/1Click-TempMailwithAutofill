# 1Click: Temp Mail with Autofill

A powerful Chrome extension that generates temporary email addresses and automatically fills forms with one click. Built with modern Vite.js for optimal development experience and performance.

## ✨ Features

- **Instant Temporary Emails**: Generate disposable email addresses from multiple providers (Burner.kiwi, Guerrilla Mail)
- **One-Click Autofill**: Automatically fill registration forms with generated credentials
- **Smart OTP Handling**: Automatic detection and filling of verification codes
- **Auto-Extend Functionality**: Per-inbox auto-extend settings for Guerrilla Mail addresses to prevent expiration
- **Email History**: Track and manage all your generated email addresses
- **Custom Settings**: Personalize names, passwords, and preferences
- **Login Information Storage**: Save and manage credentials for different websites
- **Modern UI**: Clean, responsive interface with real-time notifications
- **QR Code Generation**: Built-in QR code functionality for sharing

## 🚀 How It Works

1. **Generate Email**: Click the extension icon and generate a temporary email address
2. **Auto-fill Forms**: Use the autofill buttons that appear on registration pages
3. **OTP Detection**: The extension monitors your inbox and automatically fills verification codes
4. **Manage History**: Access your email history and saved login information

## 🎯 Fine-Grained Controls

- **Individual Field Filling**: Fill specific fields instead of entire forms
- **Custom Passwords**: Set personalized passwords in settings
- **Provider Selection**: Choose between multiple email providers
- **Per-Inbox Auto-Extend**: Toggle auto-extend functionality for individual Guerrilla Mail addresses
- **Notification Settings**: Customize alerts and notifications

## 📥 Installation

### From Browser Stores
🌐 **Chrome Web Store**: [Install 1Click: Temp Mail with Autofill](https://chromewebstore.google.com/detail/1click-autofill-with-temp/oilafkncmnboohnekbnokkifjbnjeecn)

🦊 **Firefox Add-ons**: Coming soon!

**Installation Steps:**
1. Click the store link above
2. Click "Add to Chrome" (or "Add to Firefox")
3. Confirm the installation

### Manual Installation (Development)
1. Download or clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode" in the top-right corner
6. Click "Load unpacked" and select the `dist` folder

## 🎮 Usage Guide

1. **Generate a Temporary Email**:
   - Click the extension icon in your browser toolbar
   - Click "Generate New Email" to create a temporary email address
   - The email will be automatically copied to your clipboard

2. **Auto-fill Registration Forms**:
   - Navigate to any registration page
   - Look for the green autofill button that appears near form fields
   - Click the button to automatically fill the entire form with generated data
   - Alternatively, click the small icon next to any individual field to fill just that one

3. **Automatic OTP Handling**:
   - After you submit the form, the extension will monitor the inbox for a new email
   - When an OTP email arrives, the extension will extract the code and automatically fill it on the verification page

4. **Using a Custom Password**:
   - Click the **Settings** (gear) icon in the popup
   - Enable the **"Use Custom Password"** toggle
   - Enter the password you wish to use. The extension will now use this password for autofilling

5. **Managing Auto-Extend for Guerrilla Mail**:
   - For Guerrilla Mail addresses, click the auto-extend toggle button to enable/disable automatic renewal
   - When auto-extend is enabled, the inbox will show "Auto extend expiry enabled" instead of the countdown timer
   - Auto-extend is enabled by default for new Guerrilla Mail addresses

6. **Accessing Saved Information**:
   - Click the **History** (clock) icon to see a list of past inboxes you've created
   - Click the **Login Info** (key) icon to see the credentials you've saved for different websites

## 🏗️ Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/UnarchiveTech/1Click-TempMailwithAutofill
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Commands

```bash
# Development build with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Clean build artifacts
npm run clean
```

### Building the Extension

The build process automatically:
- Compiles TypeScript files
- Copies all necessary files to the `dist/` folder
- Prepares the extension for Chrome installation
- Optimizes assets for production

### Development Workflow

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

3. The extension will automatically reload when you make changes to the source files

## 📁 Project Structure

```
src/
├── background/
│   └── background.js      # Service worker script
├── content/
│   └── content.js         # Content script for web pages
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup functionality
│   ├── data-manager.js    # Data management utilities
│   └── styles.css         # Popup styles
├── icons/                 # Extension icons
├── qrcode.ts             # QR code generation (TypeScript)
└── manifest.json         # Extension manifest

dist/                     # Built extension (generated)
├── background.js
├── content.js
├── popup.html
├── popup.css
├── qrcode.js            # Compiled from TypeScript
├── icons/
└── manifest.json
```

### Key Files

- `background.js`: Core service worker managing API communication, state, and OTP extraction logic
- `content.js`: Injects autofill buttons and logic into web pages, handles DOM interaction
- `popup.html` / `popup.js` / `styles.css`: Main extension popup UI and functionality
- `manifest.json`: Extension manifest defining permissions, scripts, and metadata
- `qrcode.ts`: QR code generation library (TypeScript source, compiled to `qrcode.js`)
- `icons/`: SVG and PNG icons used throughout the extension

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Extension builds without errors (`npm run build`)
- [ ] All files present in `dist/` folder
- [ ] Extension loads in Chrome without errors
- [ ] All features work as expected
- [ ] Email generation and autofill features functional
- [ ] OTP detection and copying works
- [ ] Settings and preferences accessible

## 🛠️ Troubleshooting

### Common Issues

**Build Problems:**
- Run `npm install` to ensure dependencies are installed
- Clear cache with `npm cache clean --force`
- Delete `node_modules` and reinstall if needed

**Loading Problems:**
- Select the `dist/` folder when loading unpacked extension
- Check browser console for error messages
- Verify all required files are present in `dist/`

**Extension Not Working:**
- Check browser console for JavaScript errors
- Verify manifest.json is valid and permissions are set correctly

## 🤝 Contributing

Contributions are welcome and appreciated! If you have an idea for a new feature or want to fix a bug, please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Make changes in the `src/` directory
4. Test with `npm run dev`
5. Build with `npm run build`
6. Test the built extension
7. Commit your changes (`git commit -m 'Add your feature'`)
8. Push to the branch (`git push origin feature/your-feature`)
9. Open a Pull Request

Alternatively, you can open an issue to report a bug or suggest an enhancement.

## 🙏 Acknowledgments

Special thanks to [**Enzo Davico**](https://github.com/envico801) for their valuable contributions and pull requests that helped improve this extension.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---
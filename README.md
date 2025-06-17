# 1Click: Temp Mail with Autofill

A powerful Chrome extension designed to streamline your online registration process. This tool automatically generates temporary email addresses, autofills signup forms, and intelligently extracts OTPs, making signups fast, secure, and private.

![Extension Popup UI](main-screenshot.png) <!-- Suggestion: Add a screenshot of the main UI -->

## Key Features

- **Disposable Email Generation**: Instantly creates temporary email addresses for signup forms.
- **Automatic Form Filling**: Auto-populates signup forms with a single click.
- **OTP Management**: Intelligently detects and extracts OTPs from emails.
- **Customizable Autofill**: Set a custom name (first/last) and password for personalized form filling.
- **Keyboard Shortcut**: Trigger autofill instantly with a configurable hotkey (`Alt+Shift+F` by default).
- **Email History & Saved Logins**: Tracks all generated emails and credentials securely.
- **Modern UI with Theme Support**: Offers a clean interface with both light and dark modes.
- **Data Management**: Export and import your extension data easily.
- **One-Click Copy**: Quickly copy emails, passwords, and OTPs.

## How It Works

1.  **Generate Email**: The extension provides a temporary email address upon opening.
2.  **Autofill Form**: Navigate to a signup page and use the **"Autofill Form"** button (or the `Alt+Shift+F` hotkey) to instantly fill in the email, a secure password, and your name.
3.  **Receive OTP**: When the verification email arrives, the extension automatically detects the OTP.
4.  **Complete Signup**: The OTP is sent to the content script, which fills it into the verification field, completing the signup.

### Fine-Grained Control

- **Individual Field Filling**: Don't want to fill the whole form? Helper icons appear next to individual fields, allowing you to fill just the email, name, or password.
- **Custom Settings**:
    - Supports both **Dark and Light Mode**.
    - Toggle desktop notifications for new emails.

## Installation

1.  **Download the code:**
    -   Clone this repository: `git clone https://github.com/UnarchiveTech/1Click-TempMailwithAutofill.git`
    -   Or, download the ZIP and extract it.
2.  **Open Chrome Extensions:** Navigate to `chrome://extensions/` in your Chrome browser.
3.  **Enable Developer Mode:** Turn on the "Developer mode" toggle, usually in the top-right corner.
4.  **Load the Extension:**
    -   Click the **"Load unpacked"** button.
    -   Select the directory where you cloned or extracted the code.
5.  The **1Click** icon will now appear in your toolbar. Pin it for easy access!

## Usage Guide

1.  **Create an Inbox:** The extension creates a new temporary email for you automatically. You can create more using the `+` button in the popup.
2.  **Autofill a Signup Form:**
    -   Navigate to any website's registration page.
    -   Click the **"Autofill Details"** button in the extension popup to fill all detected fields.
    -   Alternatively, click the small icon next to any individual field to fill just that one.
3.  **Automatic OTP Handling:**
    -   After you submit the form, the extension will monitor the inbox for a new email.
    -   When an OTP email arrives, the extension will extract the code and automatically fill it on the verification page.
4.  **Using a Custom Password:**
    -   Click the **Settings** (gear) icon in the popup.
    -   Enable the **"Use Custom Password"** toggle.
    -   Enter the password you wish to use. The extension will now use this password for autofilling.
5.  **Accessing Saved Information:**
    -   Click the **History** (clock) icon to see a list of past inboxes you've created.
    -   Click the **Login Info** (key) icon to see the credentials you've saved for different websites.

## File Structure

-   `background.js`: Core service worker. Manages API communication, state, and all OTP extraction logic.
-   `content.js`: Injects autofill buttons and logic into web pages. Handles all direct interaction with the DOM.
-   `popup.html` / `popup.js` / `styles.css`: The HTML, JavaScript, and CSS for the main extension popup UI.
-   `manifest.json`: The extension's manifest file, defining permissions, scripts, and metadata.
-   `icons/`: Contains all SVG and PNG icons used throughout the extension.

## Contributing

Contributions are welcome and appreciated! If you have an idea for a new feature or want to fix a bug, please follow these steps:

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/your-feature`).
3.  Commit your changes (`git commit -m 'Add your feature'`).
4.  Push to the branch (`git push origin feature/your-feature`).
5.  Open a Pull Request.

Alternatively, you can open an issue to report a bug or suggest an enhancement.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
# 1Click Autofill with Temp Mail

A powerful Chrome extension designed to simplify online signups by generating disposable email addresses and managing one-time password (OTP) codes. Powered by the burner.kiwi API, this extension automates form filling, captures OTPs, and provides a seamless user experience with a modern, customizable interface.

## Features

- **Disposable Email Generation**: Instantly creates temporary email addresses for signup forms.
- **Automatic Form Filling**: Auto-populates signup forms with generated email addresses.
- **OTP Management**: Extracts and displays OTP codes from verification emails in real-time.
- **Email History**: Tracks previously used temporary email addresses for easy reference.
- **Modern UI with Theme Support**: Offers dark and light modes.
- **One-Click Copy**: Quickly copy email addresses and OTP codes with a single click.
- **Real-Time Updates**: Automatically refreshes messages and inbox for up-to-date information.

## Prerequisites

- Google Chrome browser (latest stable version recommended).
- Internet connection for burner.kiwi API access.
- Developer mode enabled in Chrome for installing unpacked extensions.

## Installation

1. Clone or download this repository to your local machine:

   ```bash
   git clone https://github.com/EveryWebStuffs/1Click-Autofill-with-Temp-Mail.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`.

3. Enable **Developer mode** in the top-right corner.

4. Click **Load unpacked** and select the extension’s directory.

5. The **1Click Autofill with Temp Mail** icon will appear in your Chrome toolbar.

## Usage

1. Click the extension icon to open the popup interface.
2. A temporary email address is automatically generated via the burner.kiwi API.
3. Click **Start Auto Signup** to enable automatic form filling.
4. The extension will populate signup forms with the temporary email address.
5. When a verification email arrives, the OTP code is extracted and displayed in the **Latest OTP Code** section.
6. Use the copy button to paste the OTP code into the required field.
7. Access **Email History** or **Messages** sections to review past emails and messages.

## Features in Detail

### Temporary Email Management

- Generates disposable email addresses using the burner.kiwi API.
- Allows refreshing of email addresses for new inboxes.
- Maintains a history of used email addresses for easy access.

### Message Center

- Monitors incoming messages in real-time via the burner.kiwi API.
- Extracts OTP codes from email subjects and bodies using intelligent pattern matching.
- Displays a message list with a detailed view for each email.

### User Interface

- Clean, responsive popup interface.
- Supports dark and light themes
- Smooth transitions and hover effects for an engaging user experience.

## File Structure

- `background.js`: Manages background processes and API communication.
- `content.js`: Handles form auto-filling on web pages.
- `data-manager.js`: Stores and retrieves temporary emails and OTP codes.
- `history.js`: Logic for displaying and managing email history.
- `icons/`: Contains icon assets:
  - `autofill.svg`: Auto-fill functionality icon.
  - `history.svg`: Email history view icon.
  - `icon*.png`: Extension icons in various sizes.
  - `refresh.svg`: Refresh button icon.
- `manifest.json`: Defines extension permissions and structure.
- `popup.html`: Main popup interface HTML.
- `popup.js`: Handles popup UI logic and user interactions.
- `styles.css`: Styles the extension with a modern, theme-aware design.

## API Integration

### burner.kiwi API

The extension leverages the burner.kiwi API v2 for temporary email functionality:

- **Inbox Creation**: Generates disposable inboxes via `https://burner.kiwi/api/v2/inbox`.
- **Message Retrieval**: Fetches messages using `https://burner.kiwi/api/v2/inbox/{id}/messages`.
- **Authentication**: Uses secure tokens for API access.

### OTP Extraction

- Employs advanced pattern matching to identify OTP codes (4-8 digits, with/without separators).
- Analyzes email subjects and bodies to support various OTP formats.
- Ensures reliable extraction across different email providers and message structures.

## Security

- Uses temporary email addresses to protect your primary email’s privacy.
- Stores no sensitive data permanently; all data is kept in local browser storage.
- Communicates with the burner.kiwi API over secure HTTPS.
- Email tokens are securely managed and stored locally.

## Troubleshooting

- **Extension not loading**: Ensure Developer mode is enabled and the extension is loaded from the correct directory.
- **API errors**: Verify your internet connection and check if the burner.kiwi API is operational.
- **OTP not detected**: Ensure the email format is supported; contact support if issues persist.
- **Theme issues**: Clear browser cache or reload the extension to apply the latest `styles.css` changes.

## Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Please ensure your code follows the project’s coding style and includes relevant tests.

## Future Enhancements

- Support for additional temporary email providers.
- Enhanced OTP detection for non-standard formats.
- Customizable theme colors via a settings panel.
- Browser extension support for Firefox and Edge.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
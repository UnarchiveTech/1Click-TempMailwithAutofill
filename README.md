# 1Click Autofill with Temp Mail

A powerful Chrome extension that streamlines the signup process by automatically generating temporary email addresses and managing OTP codes. This extension integrates with the burner.kiwi API to create disposable email addresses on demand.

## Features

- **Temporary Email Generation**: Instantly creates disposable email addresses for signup forms
- **Auto Form Fill**: Automatically fills signup forms with generated temporary email
- **OTP Management**: Captures and displays OTP codes from verification emails
- **Email History**: Keeps track of previously used temporary email addresses
- **Dark/Light Theme**: Supports both dark and light mode for better visibility
- **One-Click Copy**: Easy copying of email addresses and OTP codes
- **Real-time Updates**: Automatic refresh of messages and email inbox

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your Chrome toolbar

## Usage

1. Click the extension icon to open the popup interface
2. A temporary email address will be automatically generated
3. Click "Start Auto Signup" to enable form auto-filling
4. The extension will automatically fill signup forms with the temporary email
5. When you receive an OTP code, it will be displayed in the "Latest OTP Code" section
6. Use the copy button to quickly copy the OTP code
7. View your email history and received messages in the dedicated sections

## Features in Detail

### Temporary Email Management
- Automatic email generation using burner.kiwi API
- Email refresh capability
- History of previously used emails

### Message Center
- Real-time message monitoring via burner.kiwi API
- Intelligent OTP code extraction from email subjects and bodies
- Message list with detailed view

### User Interface
- Clean and intuitive design
- Dark/Light theme toggle
- Responsive popup interface

## File Structure

```
├── manifest.json        # Extension configuration
├── popup.html          # Main popup interface
├── popup.js            # Popup functionality
├── content.js          # Content script for form filling
├── background.js       # Background service worker
├── history.html        # Email history page
├── history.js          # History functionality
└── icons/              # Extension icons
```

## API Integration

### burner.kiwi API
- The extension integrates with burner.kiwi API v2 for temporary email functionality
- Creates disposable email inboxes via `https://burner.kiwi/api/v2/inbox`
- Retrieves messages using `https://burner.kiwi/api/v2/inbox/{id}/messages`
- Uses authentication tokens for secure API access

### OTP Extraction
- Sophisticated pattern matching to identify OTP codes in emails
- Supports various OTP formats (4-8 digits, with/without separators)
- Contextual analysis to identify codes in different message formats

## Security

- The extension operates with temporary email addresses, ensuring your primary email remains private
- No sensitive data is stored permanently
- All communication with burner.kiwi API is secured via HTTPS
- Email tokens are stored locally in browser storage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
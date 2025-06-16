# NoDoxxing - Anti-Doxx Browser Extension

🔒 **Automatic privacy protection for screen sharing and browsing**

This browser extension automatically detects and redacts sensitive data on web pages to prevent accidental exposure during screen sharing, presentations, or when others can see your screen.

## Features

- **Automatic Detection**: Identifies and redacts sensitive data in real-time
- **Multiple Data Types**: Protects emails, phone numbers, names, addresses, and more
- **Custom Strings**: Add your own custom strings to redact (company names, project names, etc.)
- **CIA/FBI Style**: Replaces sensitive data with "REDACTED" text with black background and white text
- **Dynamic Content**: Works with dynamically loaded content and AJAX updates
- **Easy Toggle**: Simple on/off control via browser extension popup
- **Privacy First**: All processing happens locally in your browser

## Protected Data Types

- 📧 Email addresses
- 📱 Phone numbers (various formats)
- 💳 Credit card numbers
- 🆔 Social Security numbers
- 🌐 IP addresses
- 👤 GitHub usernames
- 👥 Personal names (First Last format)
- 🏠 Street addresses
- 🔤 Custom strings (user-defined)

## Installation

### Install from Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The NoDoxxing extension should now appear in your browser toolbar

### Usage

1. **Automatic Protection**: Once installed, the extension automatically starts protecting your data on all websites
2. **Toggle Protection**: Click the extension icon in your browser toolbar to enable/disable protection
3. **Add Custom Strings**: Open the extension popup and add your own strings to redact (company names, project codes, etc.)
4. **Visual Feedback**: Protected data appears as "REDACTED" with black background and white text
5. **Status Check**: Open the extension popup to see current protection status

### Managing Custom Strings

1. Click the NoDoxxing extension icon in your browser toolbar
2. In the popup, find the "Custom Strings to Redact" section
3. Type the string you want to redact in the input field
4. Click "Add" or press Enter
5. The string will be added to your list and immediately start being redacted on all pages
6. To remove a string, click the "Remove" button next to it in the list
7. All custom strings are saved and will persist across browser sessions

**Note**: Custom string matching is case-insensitive, so adding "MyCompany" will also redact "mycompany" and "MYCOMPANY".

## Testing

Open the included `test.html` file in your browser to see the extension in action with built-in patterns. The page contains various types of sensitive data that will be automatically redacted.

For testing custom strings, open `test-user-strings.html` which contains sample content specifically designed to test user-defined string redaction.

## How It Works

1. **Content Script**: Scans all text content on web pages using TreeWalker API
2. **Pattern Matching**: Uses regular expressions to identify sensitive data patterns
3. **DOM Replacement**: Replaces sensitive text with styled "REDACTED" elements
4. **Dynamic Monitoring**: Uses MutationObserver to handle dynamically added content
5. **Local Processing**: All detection and redaction happens locally for privacy

## Privacy & Security

- **No Data Collection**: The extension does not collect, store, or transmit any of your data
- **Local Processing**: All redaction happens directly in your browser
- **Open Source**: Full source code is available for review
- **Minimal Permissions**: Only requires access to active tabs for content modification

## Development

### File Structure
```
├── manifest.json          # Extension configuration
├── content.js            # Main redaction logic
├── background.js         # Extension background service
├── popup.html/css/js     # Extension popup interface
├── styles.css            # Redacted text styling
├── icons/                # Extension icons
└── test.html            # Test page for development
```

### Customization

You can modify the detection patterns in `content.js` by editing the `patterns` object to add new data types or adjust existing ones.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with the test page
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Perfect for:

- 🎥 Screen sharing sessions
- 📊 Live presentations
- 🎓 Online teaching/training
- 💼 Client demonstrations
- 📹 Recording tutorials
- 🤝 Pair programming sessions

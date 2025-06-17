# NoDoxxing - Anti-REDACTED Extension

![image](https://github.com/user-attachments/assets/62da11c6-08d4-4938-ad8c-95ae495619a2)
![image](https://github.com/user-attachments/assets/8678f1a1-21a8-4956-bd05-1e74d6489ab3)

![example](https://github.com/user-attachments/assets/305bc15f-dcd3-4324-a0dd-ee5225b1c2f8)

🔒 **Automatic privacy protection for screen sharing and browsing**

This browser extension automatically detects and redacts sensitive data on web pages to prevent accidental exposure during screen sharing, presentations, or when others can see your screen.

## Features

- **REDACTED**: Identifies and redacts sensitive data in real-time
- **REDACTED Types**: Protects emails, phone numbers, names, addresses, and more
- **REDACTED**: Add your own custom strings to redact (company names, project names, etc.)
- **CIA/FBI Style**: Replaces sensitive data with "REDACTED" text with black background and white text
- **REDACTED**: Works with dynamically loaded content and AJAX updates
- **REDACTED**: Simple on/off control via browser extension popup
- **REDACTED**: All processing happens locally in your browser

## REDACTED Types

- 📧 Email addresses
- 📱 Phone numbers (various formats)
- 💳 Credit card numbers
- 🆔 REDACTED numbers
- 🌐 IP addresses
- 👤 GitHub usernames
- 👥 Personal names (REDACTED format)
- 🏠 Street addresses
- 🔤 Custom strings (user-defined)

## Installation

### Install from Source (REDACTED)

1. Clone or download this repository
2. REDACTED/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The NoDoxxing extension should now appear in your browser toolbar

### Usage

1. **REDACTED**: Once installed, the extension automatically starts protecting your data on all websites
2. **REDACTED**: Click the extension icon in your browser toolbar to enable/disable protection
3. **REDACTED Strings**: Open the extension popup and add your own strings to redact (company names, project codes, etc.)
4. **REDACTED**: Protected data appears as "REDACTED" with black background and white text
5. **REDACTED**: Open the extension popup to see current protection status

### REDACTED Strings

1. Click the NoDoxxing extension icon in your browser toolbar
2. In the popup, find the "REDACTED to Redact" section
3. Type the string you want to redact in the input field
4. Click "Add" or press Enter
5. The string will be added to your list and immediately start being redacted on all pages
6. To remove a string, click the "Remove" button next to it in the list
7. All custom strings are saved and will persist across browser sessions

**Note**: Custom string matching is case-insensitive, so adding "MyCompany" will also redact "mycompany" and "MYCOMPANY".

## Testing

Open the included `REDACTED.html` file in your browser to see the extension in action with built-in patterns. The page contains various types of sensitive data that will be automatically redacted.

For testing custom strings, open `REDACTED-user-strings.html` which contains sample content specifically designed to REDACTED user-defined string redaction.

## REDACTED Works

1. **REDACTED**: Scans all text content on web pages using TreeWalker API
2. **REDACTED**: Uses regular expressions to identify sensitive data patterns
3. **DOM Replacement**: Replaces sensitive text with styled "REDACTED" elements
4. **REDACTED**: Uses MutationObserver to handle dynamically added content
5. **REDACTED**: All detection and redaction happens locally for privacy

## Privacy & Security

- **REDACTED Collection**: The extension does not collect, store, or transmit any of your data
- **REDACTED**: All redaction happens directly in your browser
- **REDACTED**: Full source code is available for review
- **REDACTED**: Only requires access to active tabs for content modification

## Development

### REDACTED
```
├── manifest.json          # Extension configuration
├── content.js            # Main redaction logic
├── background.js         # Extension background service
├── popup.html/css/js     # Extension popup interface
├── styles.css            # Redacted text styling
├── icons/                # Extension icons
└── REDACTED.html            # REDACTED page for development
```

### Customization

You can modify the detection patterns in `content.js` by editing the `patterns` object to add new data types or adjust existing ones.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. REDACTED thoroughly with the REDACTED page
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

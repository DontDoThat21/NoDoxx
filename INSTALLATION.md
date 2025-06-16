# Installation Instructions

## Chrome/Chromium-based Browsers (Chrome, Edge, Brave, etc.)

1. **Download the Extension**
   - Download all files from this repository or clone it:
   ```bash
   git clone https://github.com/DontDoThat21/NoDoxx.git
   ```

2. **Open Extension Management**
   - Open Chrome/Edge
   - Navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Or click the three dots menu → More tools → Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The NoDoxxing extension should appear in your extensions list

5. **Verify Installation**
   - Look for the NoDoxxing icon in your browser toolbar
   - Click it to open the settings popup
   - Visit the `test.html` file to see redaction in action

## Firefox (Manual Installation)

1. **Prepare for Firefox**
   - Firefox requires signed extensions for permanent installation
   - For testing, you can use temporary installation

2. **Temporary Installation**
   - Open Firefox
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file

3. **Note**: Temporary installations are removed when Firefox restarts

## Usage

Once installed:
1. The extension is **enabled by default**
2. Visit any webpage with sensitive data
3. Sensitive information will automatically show as **REDACTED**
4. Click the extension icon to toggle protection on/off
5. Use the `test.html` file to verify functionality

## Troubleshooting

- **Extension not working**: Refresh the page after installation
- **No icon visible**: Check if the extension is enabled in extension management
- **Permission issues**: Ensure the extension has permission to access websites
- **Developer mode**: Make sure developer mode is enabled for unpacked extensions

## Testing

Open `test.html` in your browser to see various types of sensitive data that will be redacted by the extension.
# VerifyPal

Your verification codes, on autopilot.

VerifyPal is a Chrome browser extension that automatically detects verification codes from your email (Gmail, Outlook, Yahoo Mail, etc.), fills them into sign-in forms, and submits for you.

## Features

- **Auto-Detection**: Automatically scans your email for verification codes (OTP, 2FA, sign-in codes)
- **Auto-Fill**: Fills detected codes into verification input fields
- **Auto-Submit**: Automatically submits the form after filling
- **Multi-Provider Support**: Works with Gmail, Outlook, Yahoo Mail, and other web mail
- **Privacy First**: 100% local processing - your codes never leave your browser
- **No Tracking**: No analytics, no data collection, no external servers

## Installation

### From Source

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `chrome-extension` folder

### From Release

1. Download the latest release ZIP file
2. Extract the contents
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted folder

## How It Works

1. **Code Detection**: The extension monitors your email inbox for new verification codes
2. **Smart Recognition**: Uses pattern matching to identify codes with context (e.g., "Your verification code is 123456")
3. **Auto-Fill**: When you switch to a verification page, the code is automatically filled
4. **Auto-Submit**: The form is submitted automatically so you're signed in instantly

## Supported Code Formats

- 4-8 digit numeric codes
- Alphanumeric codes (must contain both letters and numbers)
- Codes preceded by terms like "verification code", "OTP", "2FA code", "your code is", etc.

## Privacy

VerifyPal is designed with privacy as a core principle:

- All processing happens locally in your browser
- No data is sent to external servers
- No analytics or tracking
- Open source - review the code yourself

## Supported Email Providers

- Gmail (mail.google.com)
- Outlook (outlook.live.com, outlook.office.com)
- Yahoo Mail (mail.yahoo.com)
- Other web mail providers (should work too!)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

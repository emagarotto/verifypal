# Privacy Policy for VerifyPal

**Last Updated: February 2, 2026**

## Overview

VerifyPal is a Chrome browser extension that automatically detects verification codes from email clients and fills them into sign-in forms. This Privacy Policy explains how VerifyPal handles your data.

## Data Collection

**VerifyPal does not collect, store, or transmit any personal data to external servers.**

All processing happens locally within your browser. We do not:
- Collect personal information
- Track your browsing activity
- Send data to external servers
- Use analytics or tracking tools
- Store your verification codes remotely

## How VerifyPal Works

1. **Email Scanning**: VerifyPal scans email content displayed in your browser (Gmail, Outlook, Yahoo Mail) to detect verification codes. This scanning happens entirely within your browser.

2. **Local Storage**: Detected codes are temporarily stored in your browser's local storage to enable auto-fill functionality and prevent duplicate detections. This data never leaves your device.

3. **Auto-Fill**: When you visit a verification page, VerifyPal fills the detected code into the appropriate input field. This is done locally without any external communication.

## Permissions Explained

VerifyPal requests the following browser permissions:

- **activeTab**: Required to detect verification input fields on the current page and auto-fill codes.
- **storage**: Required to temporarily store detected codes locally in your browser.
- **clipboardWrite**: Required to copy codes to your clipboard as a backup method.
- **Host permissions (email providers)**: Required to scan email content for verification codes on Gmail, Outlook, and Yahoo Mail.

## Data Retention

- Detected verification codes are stored locally for a maximum of 10 minutes to prevent duplicate detections.
- No data is retained after this period or after closing your browser.
- You can clear all stored data at any time through the extension popup.

## Third-Party Services

VerifyPal does not use any third-party services, analytics, or tracking tools. There are no external API calls or data transmissions.

## Open Source

VerifyPal is open source. You can review the complete source code at:
https://github.com/emagarotto/verifypal

## Children's Privacy

VerifyPal does not knowingly collect any information from children under 13 years of age.

## Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last Updated" date above.

## Contact

If you have questions about this Privacy Policy, please open an issue on our GitHub repository:
https://github.com/emagarotto/verifypal

## Summary

- All processing is 100% local
- No data is sent to external servers
- No tracking or analytics
- No personal data collection
- Open source and fully transparent

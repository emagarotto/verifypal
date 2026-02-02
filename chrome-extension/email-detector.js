// Content script for detecting verification codes in email clients

(function() {
  'use strict';

  // Specific patterns that directly capture codes after common phrases
  const DIRECT_CODE_PATTERNS = [
    // "Your X code is: 123456" patterns
    /(?:your\s+(?:verification|sign[- ]?in|login|log[- ]?in|security|one[- ]?time|temporary|authentication|activation|access|approval|recovery|reset|confirmation|2fa)\s+code\s+is[:\s]*)\s*(\d{4,8})/gi,
    /(?:your\s+(?:verification|sign[- ]?in|login|log[- ]?in|security|one[- ]?time|temporary|authentication|activation|access|approval|recovery|reset|confirmation|2fa)\s+code\s+is[:\s]*)\s*([A-Z0-9]{4,8})/gi,
    // "Your code is: 123456"
    /(?:your\s+code\s+is[:\s]*)\s*(\d{4,8})/gi,
    /(?:your\s+code\s+is[:\s]*)\s*([A-Z0-9]{4,8})/gi,
    // "Your OTP is: 123456"
    /(?:your\s+otp\s+(?:is[:\s]*|code[:\s]*))\s*(\d{4,8})/gi,
    // "X code: 123456" patterns
    /(?:(?:verification|sign[- ]?in|login|log[- ]?in|security|one[- ]?time|temporary|authentication|activation|access|approval|recovery|reset|confirmation|account|email|phone|identity|password)\s+code[:\s]*)\s*(\d{4,8})/gi,
    /(?:(?:verification|sign[- ]?in|login|log[- ]?in|security|one[- ]?time|temporary|authentication|activation|access|approval|recovery|reset|confirmation|account|email|phone|identity|password)\s+code[:\s]*)\s*([A-Z0-9]{4,8})/gi,
    // "X passcode/password: 123456"
    /(?:(?:one[- ]?time|temporary)\s+(?:passcode|password)[:\s]*)\s*(\d{4,8})/gi,
    // "Here is your X code: 123456"
    /(?:here\s+is\s+your\s+(?:verification\s+|sign[- ]?in\s+|login\s+|security\s+|one[- ]?time\s+)?code[:\s]*)\s*(\d{4,8})/gi,
    /(?:here\s+is\s+your\s+(?:verification\s+|sign[- ]?in\s+|login\s+|security\s+|one[- ]?time\s+)?code[:\s]*)\s*([A-Z0-9]{4,8})/gi,
    // "Use this code: 123456" / "Use the code below: 123456"
    /(?:(?:please\s+)?use\s+(?:this|the)\s+(?:verification\s+)?code(?:\s+below)?[:\s]*)\s*(\d{4,8})/gi,
    // "Enter this code: 123456" / "Enter the code below: 123456"
    /(?:(?:please\s+)?enter\s+(?:this|the)\s+(?:verification\s+|following\s+)?code(?:\s+below)?[:\s]*)\s*(\d{4,8})/gi,
    // "Enter this code to X: 123456"
    /(?:enter\s+this\s+code\s+to\s+(?:continue|sign\s+in|log\s+in|complete|reset|confirm|verify)[:\s]*)\s*(\d{4,8})/gi,
    // "To sign in, use the code below: 123456"
    /(?:to\s+(?:sign\s+in|log\s+in|finish|complete|verify|reset|confirm|activate)[^:]*[:\s]+)\s*(\d{4,8})/gi,
    // "OTP: 123456" or "OTP code: 123456"
    /(?:otp(?:\s+code)?[:\s]+)\s*(\d{4,8})/gi,
    // "2FA code: 123456"
    /(?:2fa\s+code[:\s]*)\s*(\d{4,8})/gi,
    // "2 step verification code: 123456"
    /(?:2\s*(?:step|factor)\s+(?:verification\s+)?code[:\s]*)\s*(\d{4,8})/gi,
    // "Two factor/step code: 123456"
    /(?:two\s+(?:factor|step)\s+(?:authentication\s+|verification\s+)?code[:\s]*)\s*(\d{4,8})/gi,
    // "Code: 123456" (standalone on line)
    /(?:^|\n)\s*code[:\s]+(\d{4,8})(?:\s|$|\.|\n)/gim,
    // "Security code is: 123456"
    /(?:security\s+code\s+is[:\s]*)\s*(\d{4,8})/gi,
    // Codes with spaces like "123 456" or dashes "123-456"
    /(?:code[:\s]*)\s*(\d{3}[\s-]\d{3})/gi,
    // Bold or emphasized codes (often in HTML emails)
    /(?:is|:)\s*<[^>]*>(\d{4,8})<\/[^>]*>/gi
  ];

  // Fallback patterns for detecting verification codes
  // Only 4-6 digit codes - 7+ digits are often monetary amounts
  const FALLBACK_CODE_PATTERNS = [
    // 6-digit codes (most common for verification)
    /\b(\d{6})\b/g,
    // 4-digit codes (PIN-style)
    /\b(\d{4})\b/g,
    // 5-digit codes
    /\b(\d{5})\b/g,
    // Alphanumeric codes (6-8 chars, uppercase) - these must have letters
    /\b([A-Z][A-Z0-9]{5,7})\b/g,
    /\b([A-Z0-9]{5,7}[A-Z])\b/g
  ];

  // Keywords that indicate a verification code context
  const CONTEXT_KEYWORDS = [
    // Code type keywords
    'verification code', 'your verification code', 'your sign-in code', 'your login code',
    'your log in code', 'your security code', 'your one time code', 'one time code',
    'one time password', 'one time passcode', 'your one time password', 'your one time passcode',
    'temporary code', 'temporary passcode', 'temporary password', 'your temporary code',
    'your temporary passcode', 'your temporary password', 'authentication code',
    'your authentication code', 'two factor authentication code', '2 step verification code',
    '2 factor code', 'two step verification code', 'account verification code',
    'email verification code', 'phone verification code', 'identity verification code',
    'security verification code', 'login verification code', 'sign in verification code',
    'password reset code', 'reset password code', 'your password reset code', 'your reset code',
    'account recovery code', 'recovery code', 'your recovery code', 'confirmation code',
    'your confirmation code', 'account confirmation code', 'activation code',
    'your activation code', 'account activation code', 'access code', 'your access code',
    'approval code', 'your approval code', 'otp', 'otp code', 'your otp', 'your 2fa code',
    // Action keywords
    'verification required', 'verify your email', 'verify your account', 'confirm your email',
    'confirm your account', 'finish signing in', 'complete your sign in',
    'your code is', 'your code is as follows', 'your code is listed below',
    'your code is shown below', 'here is your code', 'here is your verification code',
    'here is your sign in code', 'here is your login code', 'here is your security code',
    'here is your one time code', 'here is your one time password',
    // Use/enter instructions
    'use this code', 'use this verification code', 'use the code below', 'use the code shown below',
    'please use this code', 'please use the code below', 'please use the following code',
    'please use the following verification code', 'please enter this code',
    'please enter the code below', 'please enter the following code',
    'please enter the following verification code', 'enter this code', 'enter this verification code',
    'enter the code below', 'enter the following code', 'enter the following verification code',
    'enter the code in the app', 'enter this code to continue', 'enter this code to sign in',
    'enter this code to log in', 'enter this code to complete', 'enter this code to reset',
    'enter this code to confirm', 'enter this code to verify',
    'use this code to sign in', 'use this code to log in', 'use this code to complete',
    'use this code to reset', 'use this code to confirm', 'use this code to verify',
    'to sign in, use the code', 'to log in, use the code', 'to finish signing in',
    'to complete your login', 'to complete your sign in', 'to verify your email',
    'to verify your account', 'to verify your identity', 'to reset your password',
    'to confirm your email', 'to confirm your account', 'to activate your account',
    'use the following code to access', 'use the following code to complete',
    'use the following code to continue',
    // Expiry notices
    'this code expires', 'this code is valid for', 'this code can be used only once',
    'this code can only be used once', 'do not share this code',
    // Simple keywords
    'sign in code', 'login code', 'security code', '2fa', 'mfa'
  ];

  // Email subjects that indicate verification emails
  const SUBJECT_KEYWORDS = [
    'verification', 'verify', 'confirm', 'confirmation',
    'sign in', 'sign-in', 'signin', 'login', 'log in', 'log-in',
    'security', 'authentication', 'authorize', 'authorization',
    'one-time', 'one time', 'otp', '2fa', 'two-factor', 'two factor',
    'code', 'access', 'activation', 'activate', 'recovery', 'reset',
    'passcode', 'password', 'approval', 'approve'
  ];

  let lastDetectedCode = null;
  let observer = null;

  function detectEmailProvider() {
    const url = window.location.hostname;
    if (url.includes('mail.google.com')) return 'gmail';
    if (url.includes('outlook')) return 'outlook';
    if (url.includes('mail.yahoo.com')) return 'yahoo';
    return 'unknown';
  }

  // Parse email timestamp and check if within 10 minutes
  function getEmailTimestamp() {
    const provider = detectEmailProvider();
    let emailTime = null;
    
    try {
      if (provider === 'gmail') {
        // Gmail shows time in the email header area
        const timeEl = document.querySelector('.g3') || 
                       document.querySelector('[data-tooltip*=":"]') ||
                       document.querySelector('.gH .gK span');
        if (timeEl) {
          const timeText = timeEl.getAttribute('data-tooltip') || timeEl.textContent || '';
          emailTime = parseEmailTime(timeText);
        }
      } else if (provider === 'outlook') {
        // Outlook shows time in the message header
        const timeEl = document.querySelector('[role="heading"] + div time') ||
                       document.querySelector('time[datetime]');
        if (timeEl) {
          const datetime = timeEl.getAttribute('datetime');
          if (datetime) {
            emailTime = new Date(datetime).getTime();
          }
        }
      } else if (provider === 'yahoo') {
        // Yahoo shows time in message view
        const timeEl = document.querySelector('[data-test-id="message-time"]') ||
                       document.querySelector('.date-container time');
        if (timeEl) {
          const datetime = timeEl.getAttribute('datetime');
          if (datetime) {
            emailTime = new Date(datetime).getTime();
          }
        }
      }
    } catch (e) {
      // Ignore timestamp parsing errors
    }
    
    return emailTime;
  }
  
  function parseEmailTime(timeText) {
    if (!timeText) return null;
    
    // Try to parse common time formats
    const now = new Date();
    
    // "10:30 AM" or "2:45 PM" - today
    const todayMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (todayMatch) {
      let hours = parseInt(todayMatch[1]);
      const mins = parseInt(todayMatch[2]);
      const isPM = todayMatch[3].toUpperCase() === 'PM';
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins);
      return time.getTime();
    }
    
    // "Jan 15" or "Dec 3" - this year but different day (likely old)
    const dateMatch = timeText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
    if (dateMatch) {
      const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      const month = months[dateMatch[1].toLowerCase()];
      const day = parseInt(dateMatch[2]);
      const time = new Date(now.getFullYear(), month, day);
      return time.getTime();
    }
    
    return null;
  }
  
  function isEmailTooOld(emailTimestamp) {
    if (!emailTimestamp) return false; // If we can't determine, allow it
    const TEN_MINUTES = 10 * 60 * 1000;
    return (Date.now() - emailTimestamp) > TEN_MINUTES;
  }

  function getEmailContent() {
    const provider = detectEmailProvider();
    let content = '';
    let subject = '';
    let emailTimestamp = null;
    let isOpenedEmail = false; // Track if we're viewing an opened email vs inbox preview

    if (provider === 'gmail') {
      // Gmail email body (when email is open)
      const emailBody = document.querySelector('.a3s.aiL') || 
                        document.querySelector('[role="main"] .ii.gt') ||
                        document.querySelector('.gs .ii.gt');
      if (emailBody) {
        content = emailBody.textContent || '';
        isOpenedEmail = true;
        // Only get timestamp for opened emails
        emailTimestamp = getEmailTimestamp();
      }
      
      // Gmail subject
      const subjectEl = document.querySelector('h2.hP') ||
                        document.querySelector('[data-thread-perm-id] h2');
      if (subjectEl) {
        subject = subjectEl.textContent || '';
      }
      
      // Gmail email preview snippets (visible in inbox list without opening)
      // Don't check timestamp for inbox previews since we're scanning multiple emails
      if (!content) {
        const previewSnippets = document.querySelectorAll('.y2, .xT .y2, span.bog, .xS .xT span, .zA .y2');
        previewSnippets.forEach(snippet => {
          content += ' ' + (snippet.textContent || '');
        });
        
        // Also grab subject lines from inbox
        const subjectLines = document.querySelectorAll('.bqe, .bog, .xT span.y2');
        subjectLines.forEach(subj => {
          subject += ' ' + (subj.textContent || '');
        });
        // No timestamp check for inbox previews - we can't reliably attribute timestamps
        emailTimestamp = null;
      }
    } else if (provider === 'outlook') {
      // Outlook email body (when email is open)
      const emailBody = document.querySelector('[role="main"] .XbIp4') ||
                        document.querySelector('.customScrollBar') ||
                        document.querySelector('[data-app-section="ConversationContainer"]');
      if (emailBody) {
        content = emailBody.textContent || '';
        isOpenedEmail = true;
        emailTimestamp = getEmailTimestamp();
      }
      
      // Outlook subject
      const subjectEl = document.querySelector('[role="heading"]');
      if (subjectEl) {
        subject = subjectEl.textContent || '';
      }
      
      // Outlook email preview snippets (visible in inbox list)
      if (!content) {
        const previewSnippets = document.querySelectorAll(
          '[aria-label*="message"] .jGG6V, ' +
          '[data-focuszone-id] .XG5Jd, ' +
          '.hcptT, .OZZZK, ' +
          '[role="option"] span'
        );
        previewSnippets.forEach(snippet => {
          content += ' ' + (snippet.textContent || '');
        });
        emailTimestamp = null; // No timestamp for inbox previews
      }
    } else if (provider === 'yahoo') {
      // Yahoo email body (when email is open)
      const emailBody = document.querySelector('.msg-body') ||
                        document.querySelector('[data-test-id="message-view-body"]');
      if (emailBody) {
        content = emailBody.textContent || '';
        isOpenedEmail = true;
        emailTimestamp = getEmailTimestamp();
      }
      
      // Yahoo email preview snippets (visible in inbox list)
      if (!content) {
        const previewSnippets = document.querySelectorAll(
          '[data-test-id="message-list-item"] span, ' +
          '.D_F.W_6h8.Z_0I.H_28Wy, ' +
          '[data-test-id="snippet"]'
        );
        previewSnippets.forEach(snippet => {
          content += ' ' + (snippet.textContent || '');
        });
        emailTimestamp = null; // No timestamp for inbox previews
      }
    }

    return { content, subject, provider, emailTimestamp };
  }

  function hasVerificationContext(text) {
    const lowerText = text.toLowerCase();
    return CONTEXT_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  function isLikelyVerificationEmail(subject) {
    const lowerSubject = subject.toLowerCase();
    return SUBJECT_KEYWORDS.some(keyword => lowerSubject.includes(keyword.toLowerCase()));
  }

  function extractVerificationCode(content, subject) {
    // Only process if there's verification context
    const hasContext = hasVerificationContext(content) || isLikelyVerificationEmail(subject);
    if (!hasContext) return null;

    // FIRST: Try direct patterns that look for codes immediately after keywords
    // These are much more accurate because they find codes in specific positions
    for (const pattern of DIRECT_CODE_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let code = match[1];
        // Clean up codes with spaces/dashes
        code = code.replace(/[\s-]/g, '');
        if (code && code.length >= 4 && code.length <= 6) {
          // Exclude unlikely codes - pass content for currency check
          if (isValidCode(code, content)) {
            return code;
          }
        }
      }
    }

    // SECOND: Look for codes that appear near context keywords (within 50 chars)
    const lowerContent = content.toLowerCase();
    for (const keyword of CONTEXT_KEYWORDS) {
      const keywordPos = lowerContent.indexOf(keyword.toLowerCase());
      if (keywordPos !== -1) {
        // Get text around the keyword (50 chars before and 100 after)
        const start = Math.max(0, keywordPos - 50);
        const end = Math.min(content.length, keywordPos + keyword.length + 100);
        const nearbyText = content.substring(start, end);
        
        // Look for 6-digit codes first (most common)
        const sixDigitMatch = nearbyText.match(/\b(\d{6})\b/);
        if (sixDigitMatch && isValidCode(sixDigitMatch[1], content)) {
          return sixDigitMatch[1];
        }
        
        // Then 4-6 digit codes (not 7-8 which are often monetary)
        const digitMatch = nearbyText.match(/\b(\d{4,6})\b/);
        if (digitMatch && isValidCode(digitMatch[1], content)) {
          return digitMatch[1];
        }
        
        // Then alphanumeric
        const alphaMatch = nearbyText.match(/\b([A-Z0-9]{6,8})\b/);
        if (alphaMatch && isValidCode(alphaMatch[1], content)) {
          return alphaMatch[1];
        }
      }
    }

    // THIRD: Fallback to general pattern matching with preferences
    for (const pattern of FALLBACK_CODE_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = content.match(pattern);
      if (matches) {
        // Find the first valid code
        for (const match of matches) {
          if (isValidCode(match, content)) {
            return match;
          }
        }
      }
    }

    return null;
  }

  // Common English words that should never be detected as codes
  const EXCLUDED_WORDS = new Set([
    // Common words that might match alphanumeric patterns
    'your', 'code', 'your code', 'here', 'this', 'that', 'with', 'from', 'have', 'been',
    'will', 'more', 'when', 'some', 'only', 'also', 'back', 'them', 'then', 'than',
    'into', 'just', 'over', 'such', 'take', 'come', 'make', 'like', 'time', 'very',
    'after', 'most', 'know', 'first', 'last', 'good', 'want', 'give', 'made', 'find',
    'here', 'these', 'those', 'other', 'about', 'which', 'their', 'there', 'where',
    'would', 'could', 'should', 'being', 'using', 'enter', 'below', 'above', 'click',
    'email', 'phone', 'login', 'signin', 'signup', 'reset', 'account', 'verify',
    'please', 'thanks', 'thank', 'hello', 'dear', 'welcome', 'regards', 'sincerely',
    // Days, months
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september',
    'october', 'november', 'december',
    // Common abbreviations that are NOT codes
    'http', 'https', 'www', 'com', 'org', 'net', 'gov', 'edu',
    // Other common non-code patterns
    'password', 'username', 'user', 'pass', 'word'
  ]);

  // Check if a number appears as currency in the content
  function isCurrencyAmount(code, content) {
    if (!content) return false;
    
    // Look for the code with currency symbols or comma formatting nearby
    // Patterns: $210,700 or $210700 or €1,234 or £5000 etc.
    const currencyPatterns = [
      // Currency symbol before: $210,700 or $210700
      new RegExp(`[\\$€£¥₹]\\s*[\\d,]*${code.replace(/,/g, ',')}`, 'i'),
      // With commas in number: 210,700
      new RegExp(`\\b\\d{1,3}(,\\d{3})+\\b`),
      // Followed by currency words
      new RegExp(`${code}\\s*(dollars?|cents?|usd|eur|gbp|pounds?|euros?)`, 'i'),
      // Preceded by currency words
      new RegExp(`(price|cost|amount|total|payment|balance|fee|charge)[:\\s]*[\\$€£]?\\s*[\\d,]*${code}`, 'i')
    ];
    
    for (const pattern of currencyPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }
    
    return false;
  }

  function isValidCode(code, content) {
    if (!code) return false;
    
    // Must be at least 4 characters
    if (code.length < 4) return false;
    
    // Exclude common English words (case-insensitive)
    if (EXCLUDED_WORDS.has(code.toLowerCase())) return false;
    
    // Alphanumeric codes should have at least one digit
    // Pure letter codes like "YOUR", "CODE" are likely words, not codes
    if (/^[A-Za-z]+$/.test(code)) return false;
    
    // Exclude currency amounts (like $210,700)
    if (isCurrencyAmount(code, content)) return false;
    
    // Exclude common non-code patterns
    if (/^(19|20)\d{2}$/.test(code)) return false; // Years like 2024
    if (/^0{4,}$/.test(code)) return false; // All zeros
    if (/^1{4,}$/.test(code)) return false; // All ones
    if (/^(.)\1+$/.test(code)) return false; // Repeated single digit
    if (/^(12345678|87654321|123456|654321)$/.test(code)) return false; // Sequential
    if (/^(00000000|11111111|99999999)$/.test(code)) return false; // All same
    
    // Reject codes longer than 6 digits that don't look like verification codes
    // Most verification codes are 4-6 digits. 7-8 digit codes are rare.
    // Large numbers like 210700 are likely monetary amounts
    if (/^\d{7,}$/.test(code)) return false;
    
    // Valid codes are either:
    // 1. All digits (most common: 4-6 digit numeric codes)
    // 2. Alphanumeric with at least one digit AND one letter
    const hasDigit = /\d/.test(code);
    const hasLetter = /[A-Za-z]/.test(code);
    const isAllDigits = /^\d+$/.test(code);
    
    // Pure numeric codes - prefer 4-6 digits, allow up to 8 only if context is strong
    if (isAllDigits && code.length >= 4 && code.length <= 6) {
      return true;
    }
    
    // Alphanumeric codes must have both digits and letters
    if (hasDigit && hasLetter && code.length >= 4 && code.length <= 8) {
      return true;
    }
    
    return false;
  }

  function isExtensionValid() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  function scanForCode() {
    if (!isExtensionValid()) return;
    
    const { content, subject, provider, emailTimestamp } = getEmailContent();
    
    if (!content) return;
    
    // Skip emails older than 10 minutes
    if (isEmailTooOld(emailTimestamp)) {
      return;
    }

    const code = extractVerificationCode(content, subject);
    
    if (code && code !== lastDetectedCode) {
      lastDetectedCode = code;
      
      // Send the code to the background script
      try {
        chrome.runtime.sendMessage({
          type: 'CODE_DETECTED',
          code: code,
          source: provider
        });
      } catch (e) {
        // Extension context invalidated, silently ignore
        return;
      }
      
      // Visual feedback
      showCodeNotification(code);
    }
  }

  function showCodeNotification(code) {
    // Create a small notification overlay
    const existingNotif = document.getElementById('codepaste-notification');
    if (existingNotif) {
      existingNotif.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'codepaste-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <polyline points="9 12 11 14 15 10"></polyline>
          </svg>
        </div>
        <div>
          <div style="font-size: 12px; opacity: 0.9;">Code detected</div>
          <div style="font-size: 20px; font-weight: 700; letter-spacing: 3px; font-family: monospace;">${code}</div>
        </div>
        <button id="codepaste-close" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
        ">×</button>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // Add close handler
    document.getElementById('codepaste-close').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  function setupObserver() {
    // Watch for DOM changes (new emails being opened)
    observer = new MutationObserver((mutations) => {
      // Debounce the scanning
      clearTimeout(window.codePasteScanTimeout);
      window.codePasteScanTimeout = setTimeout(scanForCode, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Listen for scan requests from background script
  if (isExtensionValid()) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!isExtensionValid()) return;
        
        if (message.type === 'SCAN_NOW') {
          // Force a fresh scan, temporarily reset lastDetectedCode to allow re-detection
          scanForCode();
          sendResponse({ success: true });
        }
        return true;
      });
    } catch (e) {
      // Extension context invalidated
    }
  }

  // Initialize
  function init() {
    // Initial scan
    setTimeout(scanForCode, 1000);
    
    // Set up mutation observer
    setupObserver();
    
    // Also scan on focus (user switches back to email tab)
    window.addEventListener('focus', () => {
      setTimeout(scanForCode, 500);
    });
  }

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

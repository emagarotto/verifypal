// Content script for detecting verification codes in email clients

(function() {
  'use strict';

  // Patterns for detecting verification codes
  const CODE_PATTERNS = [
    // 6-digit codes (most common)
    /\b(\d{6})\b/g,
    // 4-digit codes
    /\b(\d{4})\b/g,
    // 8-digit codes
    /\b(\d{8})\b/g,
    // Alphanumeric codes (6-8 chars)
    /\b([A-Z0-9]{6,8})\b/gi
  ];

  // Keywords that indicate a verification code context
  const CONTEXT_KEYWORDS = [
    'verification code',
    'verify',
    'confirm',
    'authentication',
    'one-time',
    'otp',
    'passcode',
    'security code',
    'sign-in code',
    'login code',
    'access code',
    'confirmation code',
    'two-factor',
    '2fa',
    'mfa',
    'multi-factor',
    'temporary code',
    'enter this code',
    'enter the code',
    'use this code',
    'your code is',
    'code is:',
    'pin code',
    'secret code'
  ];

  // Email subjects that indicate verification emails
  const SUBJECT_KEYWORDS = [
    'verification',
    'verify',
    'confirm',
    'sign in',
    'login',
    'security',
    'authentication',
    'one-time',
    'otp',
    'code',
    'access'
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

  function getEmailContent() {
    const provider = detectEmailProvider();
    let content = '';
    let subject = '';

    if (provider === 'gmail') {
      // Gmail email body
      const emailBody = document.querySelector('.a3s.aiL') || 
                        document.querySelector('[role="main"] .ii.gt') ||
                        document.querySelector('.gs .ii.gt');
      if (emailBody) {
        content = emailBody.textContent || '';
      }
      
      // Gmail subject
      const subjectEl = document.querySelector('h2.hP') ||
                        document.querySelector('[data-thread-perm-id] h2');
      if (subjectEl) {
        subject = subjectEl.textContent || '';
      }
    } else if (provider === 'outlook') {
      // Outlook email body
      const emailBody = document.querySelector('[role="main"] .XbIp4') ||
                        document.querySelector('.customScrollBar');
      if (emailBody) {
        content = emailBody.textContent || '';
      }
      
      // Outlook subject
      const subjectEl = document.querySelector('[role="heading"]');
      if (subjectEl) {
        subject = subjectEl.textContent || '';
      }
    } else if (provider === 'yahoo') {
      // Yahoo email body
      const emailBody = document.querySelector('.msg-body') ||
                        document.querySelector('[data-test-id="message-view-body"]');
      if (emailBody) {
        content = emailBody.textContent || '';
      }
    }

    return { content, subject, provider };
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

    // Look for codes in the content
    for (const pattern of CODE_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        // Filter out unlikely codes
        for (const match of matches) {
          // Prefer 6-digit codes
          if (/^\d{6}$/.test(match)) {
            return match;
          }
        }
        // Fall back to other patterns
        for (const match of matches) {
          // Exclude common non-code numbers (years, etc.)
          if (/^(19|20)\d{2}$/.test(match)) continue;
          if (/^0{4,}$/.test(match)) continue;
          if (/^1{4,}$/.test(match)) continue;
          if (match.length >= 4 && match.length <= 8) {
            return match;
          }
        }
      }
    }

    return null;
  }

  function scanForCode() {
    const { content, subject, provider } = getEmailContent();
    
    if (!content) return;

    const code = extractVerificationCode(content, subject);
    
    if (code && code !== lastDetectedCode) {
      lastDetectedCode = code;
      
      // Send the code to the background script
      chrome.runtime.sendMessage({
        type: 'CODE_DETECTED',
        code: code,
        source: provider
      });
      
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

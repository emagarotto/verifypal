// Content script for auto-filling verification codes on any website

(function() {
  'use strict';

  // Selectors for OTP/verification input fields
  const OTP_SELECTORS = [
    'input[name*="otp"]',
    'input[name*="code"]',
    'input[name*="verify"]',
    'input[name*="token"]',
    'input[name*="pin"]',
    'input[id*="otp"]',
    'input[id*="code"]',
    'input[id*="verify"]',
    'input[id*="token"]',
    'input[id*="pin"]',
    'input[autocomplete="one-time-code"]',
    'input[inputmode="numeric"]',
    'input[type="tel"][maxlength="6"]',
    'input[type="text"][maxlength="6"]',
    'input[type="number"][maxlength="6"]',
    'input[aria-label*="code"]',
    'input[aria-label*="verification"]',
    'input[placeholder*="code"]',
    'input[placeholder*="verification"]',
    'input[placeholder*="OTP"]'
  ];

  // Patterns to identify OTP input groups (multiple single-digit inputs)
  const SINGLE_DIGIT_SELECTORS = [
    'input[maxlength="1"]',
    'input[type="tel"][maxlength="1"]',
    'input[type="text"][maxlength="1"]'
  ];

  let currentCode = null;

  function findOTPInputs() {
    // First, check for single input fields
    for (const selector of OTP_SELECTORS) {
      const input = document.querySelector(selector);
      if (input && isVisible(input) && !input.disabled) {
        return { type: 'single', element: input };
      }
    }

    // Check for multiple single-digit input fields (common OTP pattern)
    for (const selector of SINGLE_DIGIT_SELECTORS) {
      const inputs = document.querySelectorAll(selector);
      if (inputs.length >= 4 && inputs.length <= 8) {
        // Check if they're likely OTP inputs (grouped together)
        const visibleInputs = Array.from(inputs).filter(input => 
          isVisible(input) && !input.disabled
        );
        
        if (visibleInputs.length >= 4) {
          // Check if they share a common parent (likely an OTP group)
          const parent = visibleInputs[0].parentElement;
          const siblings = visibleInputs.filter(input => 
            input.parentElement === parent || 
            input.parentElement.parentElement === parent.parentElement
          );
          
          if (siblings.length >= 4) {
            return { type: 'multiple', elements: siblings };
          }
        }
      }
    }

    return null;
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           style.opacity !== '0';
  }

  function fillCode(code) {
    const otpInputs = findOTPInputs();
    
    if (!otpInputs) return false;

    if (otpInputs.type === 'single') {
      // Fill single input
      const input = otpInputs.element;
      input.focus();
      input.value = code;
      
      // Dispatch events to trigger any listeners
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      
      showFilledNotification(code);
      return true;
    } else if (otpInputs.type === 'multiple') {
      // Fill multiple inputs
      const inputs = otpInputs.elements;
      const digits = code.split('');
      
      for (let i = 0; i < Math.min(inputs.length, digits.length); i++) {
        inputs[i].focus();
        inputs[i].value = digits[i];
        inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
        inputs[i].dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      }
      
      // Focus the last input or next element
      if (inputs[digits.length - 1]) {
        inputs[digits.length - 1].focus();
      }
      
      showFilledNotification(code);
      return true;
    }

    return false;
  }

  function showFilledNotification(code) {
    const existingNotif = document.getElementById('codepaste-filled-notification');
    if (existingNotif) {
      existingNotif.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'codepaste-filled-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        color: white;
        padding: 14px 18px;
        border-radius: 10px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideUp 0.3s ease;
        font-size: 14px;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Code <strong style="letter-spacing: 2px; font-family: monospace;">${code}</strong> auto-filled!</span>
      </div>
      <style>
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 3000);

    // Tell background script the code was used
    chrome.runtime.sendMessage({ type: 'CODE_USED' });
  }

  function checkAndFill(forceRetry = false) {
    chrome.runtime.sendMessage({ type: 'GET_CODE' }, (response) => {
      if (response && response.code && response.autoPasteEnabled) {
        // Fill if it's a new code OR if forceRetry is true (e.g., tab switched)
        if (response.code !== currentCode || forceRetry) {
          const previousCode = currentCode;
          currentCode = response.code;
          
          // Try to fill the code
          const filled = fillCode(response.code);
          
          if (!filled) {
            // Watch for OTP inputs appearing later
            watchForOTPInputs(response.code);
          }
        }
      }
    });
  }

  function watchForOTPInputs(code) {
    const observer = new MutationObserver((mutations, obs) => {
      const otpInputs = findOTPInputs();
      if (otpInputs) {
        fillCode(code);
        obs.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Stop watching after 10 seconds
    setTimeout(() => observer.disconnect(), 10000);
  }

  // Listen for new codes from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NEW_CODE_AVAILABLE') {
      currentCode = message.code;
      
      // Check settings and try to fill
      chrome.runtime.sendMessage({ type: 'GET_CODE' }, (response) => {
        if (response && response.autoPasteEnabled) {
          const filled = fillCode(message.code);
          if (!filled) {
            watchForOTPInputs(message.code);
          }
        }
      });
    }
    sendResponse({ received: true });
    return true;
  });

  // Check for existing code on page load
  function init() {
    setTimeout(checkAndFill, 1000);
    
    // Re-check when tab becomes visible (user switches back to this tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Small delay to let the page settle, force retry even if same code
        setTimeout(() => checkAndFill(true), 300);
      }
    });
    
    // Re-check when window gains focus
    window.addEventListener('focus', () => {
      setTimeout(() => checkAndFill(true), 300);
    });
    
    // Also listen for clicks on the page (user might click on input after switching)
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT') {
        // Check if this might be an OTP field that we should fill
        setTimeout(() => {
          chrome.runtime.sendMessage({ type: 'GET_CODE' }, (response) => {
            if (response && response.code && response.autoPasteEnabled) {
              const otpInputs = findOTPInputs();
              if (otpInputs && !currentCode) {
                currentCode = response.code;
                fillCode(response.code);
              }
            }
          });
        }, 100);
      }
    }, { passive: true });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

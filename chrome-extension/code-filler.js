// Content script for auto-filling verification codes on any website

(function() {
  'use strict';

  // Selectors for OTP/verification input fields
  const OTP_SELECTORS = [
    // Autocomplete attribute (highest priority - browsers use this)
    'input[autocomplete="one-time-code"]',
    // Name attributes
    'input[name*="otp" i]',
    'input[name*="code" i]',
    'input[name*="verify" i]',
    'input[name*="token" i]',
    'input[name*="pin" i]',
    'input[name*="mfa" i]',
    'input[name*="2fa" i]',
    'input[name*="totp" i]',
    'input[name*="passcode" i]',
    'input[name*="activation" i]',
    // ID attributes
    'input[id*="otp" i]',
    'input[id*="code" i]',
    'input[id*="verify" i]',
    'input[id*="token" i]',
    'input[id*="pin" i]',
    'input[id*="mfa" i]',
    'input[id*="2fa" i]',
    'input[id*="totp" i]',
    'input[id*="passcode" i]',
    'input[id*="activation" i]',
    // Class attributes
    'input[class*="otp" i]',
    'input[class*="code" i]',
    'input[class*="verify" i]',
    'input[class*="pin" i]',
    // Input mode and type combinations
    'input[inputmode="numeric"]',
    'input[inputmode="tel"]',
    'input[type="tel"][maxlength="4"]',
    'input[type="tel"][maxlength="5"]',
    'input[type="tel"][maxlength="6"]',
    'input[type="tel"][maxlength="7"]',
    'input[type="tel"][maxlength="8"]',
    'input[type="text"][maxlength="4"]',
    'input[type="text"][maxlength="5"]',
    'input[type="text"][maxlength="6"]',
    'input[type="text"][maxlength="7"]',
    'input[type="text"][maxlength="8"]',
    'input[type="number"][maxlength="4"]',
    'input[type="number"][maxlength="5"]',
    'input[type="number"][maxlength="6"]',
    'input[type="number"][maxlength="7"]',
    'input[type="number"][maxlength="8"]',
    // Aria labels
    'input[aria-label*="code" i]',
    'input[aria-label*="verification" i]',
    'input[aria-label*="otp" i]',
    'input[aria-label*="pin" i]',
    // Placeholders
    'input[placeholder*="code" i]',
    'input[placeholder*="verification" i]',
    'input[placeholder*="OTP" i]',
    'input[placeholder*="enter" i][placeholder*="digit" i]',
    'input[placeholder*="digit" i]',
    // Data attributes (common in React/Vue apps)
    'input[data-testid*="code" i]',
    'input[data-testid*="otp" i]',
    'input[data-testid*="verify" i]'
  ];

  // Patterns to identify OTP input groups (multiple single-digit inputs)
  const SINGLE_DIGIT_SELECTORS = [
    'input[maxlength="1"]',
    'input[type="tel"][maxlength="1"]',
    'input[type="text"][maxlength="1"]'
  ];

  let currentCode = null;

  function findOTPInputs() {
    // First, check for single input fields using specific selectors
    for (const selector of OTP_SELECTORS) {
      try {
        const input = document.querySelector(selector);
        if (input && isVisible(input) && !input.disabled && !input.readOnly) {
          return { type: 'single', element: input };
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }

    // Check for multiple single-digit input fields (common OTP pattern)
    for (const selector of SINGLE_DIGIT_SELECTORS) {
      const inputs = document.querySelectorAll(selector);
      if (inputs.length >= 4 && inputs.length <= 8) {
        // Check if they're likely OTP inputs (grouped together)
        const visibleInputs = Array.from(inputs).filter(input => 
          isVisible(input) && !input.disabled && !input.readOnly
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

    // Fallback: Look for any visible, empty text/number input that could be a code field
    const allInputs = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="number"], input:not([type])');
    for (const input of allInputs) {
      if (isVisible(input) && !input.disabled && !input.readOnly && !input.value) {
        // Check if it's in a form that looks like a verification form
        const form = input.closest('form');
        const container = input.closest('div, section, main');
        const pageText = (form?.textContent || container?.textContent || '').toLowerCase();
        
        // Check for verification-related text nearby
        const verificationKeywords = ['verify', 'code', 'otp', 'authentication', 'confirm', 'enter', 'digit', 'security'];
        const hasVerificationContext = verificationKeywords.some(kw => pageText.includes(kw));
        
        if (hasVerificationContext) {
          // Additional check: input should accept numeric values or be short
          const maxLength = parseInt(input.getAttribute('maxlength')) || 100;
          if (maxLength <= 10 || input.inputMode === 'numeric' || input.type === 'tel' || input.type === 'number') {
            return { type: 'single', element: input };
          }
        }
      }
    }

    // Last resort: check if there's a focused input that could be a code field
    const focused = document.activeElement;
    if (focused && focused.tagName === 'INPUT' && isVisible(focused) && !focused.disabled) {
      const inputType = focused.type || 'text';
      if (['text', 'tel', 'number'].includes(inputType)) {
        return { type: 'single', element: focused };
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
      
      // Set value using multiple methods to ensure it works with React/Vue/Angular
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(input, code);
      
      // Also set directly
      input.value = code;
      
      // Dispatch comprehensive events for different frameworks
      triggerInputEvents(input);
      
      showFilledNotification(code);
      return true;
    } else if (otpInputs.type === 'multiple') {
      // Fill multiple inputs
      const inputs = otpInputs.elements;
      const digits = code.split('');
      
      for (let i = 0; i < Math.min(inputs.length, digits.length); i++) {
        const input = inputs[i];
        input.focus();
        
        // Set value using native setter for React compatibility
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, digits[i]);
        input.value = digits[i];
        
        triggerInputEvents(input);
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

  function triggerInputEvents(input) {
    // Create and dispatch events that work with various frameworks
    
    // Input event (React, Vue)
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    input.dispatchEvent(inputEvent);
    
    // Change event
    const changeEvent = new Event('change', { bubbles: true, cancelable: true });
    input.dispatchEvent(changeEvent);
    
    // Keyboard events
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Unidentified' }));
    input.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'Unidentified' }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Unidentified' }));
    
    // Focus/blur cycle can trigger validation
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    input.focus();
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
    if (isExtensionValid()) {
      try {
        chrome.runtime.sendMessage({ type: 'CODE_USED' });
      } catch (e) {
        // Extension context invalidated
      }
    }
  }

  function isExtensionValid() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  function checkAndFill(forceRetry = false) {
    if (!isExtensionValid()) return;
    
    try {
      chrome.runtime.sendMessage({ type: 'GET_CODE' }, (response) => {
        if (chrome.runtime.lastError) {
          // Extension context invalidated, silently ignore
          return;
        }
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
    } catch (e) {
      // Extension context invalidated, silently ignore
    }
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
  if (isExtensionValid()) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!isExtensionValid()) {
          return;
        }
        
        if (message.type === 'NEW_CODE_AVAILABLE') {
          currentCode = message.code;
          
          // Check settings and try to fill
          try {
            chrome.runtime.sendMessage({ type: 'GET_CODE' }, (response) => {
              if (chrome.runtime.lastError) return;
              if (response && response.autoPasteEnabled) {
                const filled = fillCode(message.code);
                if (!filled) {
                  watchForOTPInputs(message.code);
                }
              }
            });
          } catch (e) {
            // Extension context invalidated
          }
        }
        sendResponse({ received: true });
        return true;
      });
    } catch (e) {
      // Extension context invalidated
    }
  }

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
          if (!isExtensionValid()) return;
          try {
            chrome.runtime.sendMessage({ type: 'GET_CODE' }, (response) => {
              if (chrome.runtime.lastError) return;
              if (response && response.code && response.autoPasteEnabled) {
                const otpInputs = findOTPInputs();
                if (otpInputs && !currentCode) {
                  currentCode = response.code;
                  fillCode(response.code);
                }
              }
            });
          } catch (e) {
            // Extension context invalidated
          }
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

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
    'input[name*="confirmation" i]',
    'input[name*="security" i]',
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
    'input[id*="confirmation" i]',
    'input[id*="security" i]',
    // Class attributes
    'input[class*="otp" i]',
    'input[class*="code" i]',
    'input[class*="verify" i]',
    'input[class*="pin" i]',
    'input[class*="digit" i]',
    'input[class*="confirmation" i]',
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
    'input[aria-label*="digit" i]',
    'input[aria-label*="character" i]',
    // Placeholders
    'input[placeholder*="code" i]',
    'input[placeholder*="verification" i]',
    'input[placeholder*="OTP" i]',
    'input[placeholder*="enter" i][placeholder*="digit" i]',
    'input[placeholder*="digit" i]',
    'input[placeholder*="000000"]',
    'input[placeholder*="------"]',
    'input[placeholder*="••••••"]',
    // Data attributes (common in React/Vue apps)
    'input[data-testid*="code" i]',
    'input[data-testid*="otp" i]',
    'input[data-testid*="verify" i]',
    'input[data-testid*="pin" i]',
    'input[data-testid*="digit" i]'
  ];

  // Modal/dialog container selectors to prioritize searching within
  const MODAL_SELECTORS = [
    '[role="dialog"]',
    '[role="alertdialog"]',
    '[aria-modal="true"]',
    '.modal',
    '.dialog',
    '.popup',
    '.overlay',
    '[class*="modal" i]',
    '[class*="dialog" i]',
    '[class*="popup" i]',
    '[class*="overlay" i]',
    '[id*="modal" i]',
    '[id*="dialog" i]',
    '[id*="popup" i]'
  ];

  // Patterns to identify OTP input groups (multiple single-digit inputs)
  const SINGLE_DIGIT_SELECTORS = [
    'input[maxlength="1"]',
    'input[type="tel"][maxlength="1"]',
    'input[type="text"][maxlength="1"]'
  ];

  let currentCode = null;

  function findOTPInModals() {
    // Find open modals/dialogs - prioritize these for verification popups
    for (const modalSelector of MODAL_SELECTORS) {
      try {
        const modals = document.querySelectorAll(modalSelector);
        for (const modal of modals) {
          if (!isVisible(modal)) continue;
          
          // Search in modal and any shadow roots
          const result = searchInElementAndShadow(modal);
          if (result) return result;
        }
      } catch (e) {}
    }
    return null;
  }

  function searchInElementAndShadow(container) {
    // Search in regular DOM
    const result = searchForOTPInputs(container);
    if (result) return result;
    
    // Search in shadow roots
    const allElements = container.querySelectorAll('*');
    for (const el of allElements) {
      if (el.shadowRoot) {
        const shadowResult = searchForOTPInputs(el.shadowRoot);
        if (shadowResult) return shadowResult;
      }
    }
    
    return null;
  }

  function searchForOTPInputs(container) {
    // Look for OTP inputs using specific selectors
    for (const selector of OTP_SELECTORS) {
      try {
        const input = container.querySelector(selector);
        if (input && isVisible(input) && !input.disabled && !input.readOnly && !isExcludedInputBasic(input)) {
          return { type: 'single', element: input };
        }
      } catch (e) {}
    }
    
    // Look for single-digit inputs
    for (const selector of SINGLE_DIGIT_SELECTORS) {
      const inputs = container.querySelectorAll(selector);
      const visibleInputs = Array.from(inputs).filter(input => 
        isVisible(input) && !input.disabled && !input.readOnly && !isExcludedInputBasic(input)
      );
      
      if (visibleInputs.length >= 4 && visibleInputs.length <= 8) {
        return { type: 'multiple', elements: visibleInputs };
      }
    }
    
    // Fallback: any visible text/number input in the container that's not excluded
    const allInputs = container.querySelectorAll('input[type="text"], input[type="tel"], input[type="number"], input:not([type])');
    for (const input of allInputs) {
      if (isVisible(input) && !input.disabled && !input.readOnly && !isExcludedInputBasic(input)) {
        // Accept input if it looks like a code field
        const maxLength = input.maxLength;
        const isLikelyCodeInput = (maxLength >= 4 && maxLength <= 8) || 
                                   input.inputMode === 'numeric' ||
                                   input.pattern?.includes('\\d') ||
                                   input.type === 'tel' ||
                                   input.type === 'number';
        
        // Only accept if it looks like a code input
        if (isLikelyCodeInput && !input.value) {
          return { type: 'single', element: input };
        }
      }
    }
    
    return null;
  }
  
  // Basic exclusion check (lightweight version for hot path)
  function isExcludedInputBasic(input) {
    if (!input) return true;
    
    const type = (input.type || '').toLowerCase();
    
    // Always exclude these types
    if (type === 'password' || type === 'email' || type === 'search') return true;
    
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const autocomplete = (input.autocomplete || '').toLowerCase();
    
    // Quick exclusion checks
    const quickExclude = ['password', 'email', 'username', 'name', 'address', 'phone', 'search'];
    for (const kw of quickExclude) {
      if (name.includes(kw) || id.includes(kw) || autocomplete.includes(kw)) {
        // But allow if it also has OTP indicators
        if (name.includes('code') || id.includes('code') || name.includes('otp') || id.includes('otp')) {
          return false;
        }
        return true;
      }
    }
    
    return false;
  }

  function findOTPInputs() {
    // FIRST: Check inside modals/dialogs (higher priority for popup verification)
    const modalResult = findOTPInModals();
    if (modalResult) return modalResult;

    // SECOND: Check for single input fields using specific selectors
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
      // Skip excluded inputs (password, email, search, etc.)
      if (isExcludedInputBasic(input)) continue;
      
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
    if (focused && focused.tagName === 'INPUT' && isVisible(focused) && !focused.disabled && !isExcludedInputBasic(focused)) {
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
    
    // Watch for modals/dialogs appearing anywhere in the DOM
    watchForModals();
    
    // Also listen for clicks on the page (user might click on input after switching)
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT') {
        // ALWAYS try to fill when user clicks an input - be aggressive
        setTimeout(() => {
          if (!isExtensionValid()) return;
          try {
            chrome.runtime.sendMessage({ type: 'GET_CODE' }, (response) => {
              if (chrome.runtime.lastError) return;
              if (response && response.code && response.autoPasteEnabled) {
                // Force fill the clicked input if it looks like an OTP field
                const input = target;
                if (isLikelyOTPInput(input)) {
                  fillInputDirectly(input, response.code);
                } else {
                  // Try normal detection
                  const otpInputs = findOTPInputs();
                  if (otpInputs) {
                    currentCode = response.code;
                    fillCode(response.code);
                  }
                }
              }
            });
          } catch (e) {
            // Extension context invalidated
          }
        }, 100);
      }
    }, { passive: true });
    
    // Listen for focus events on inputs (more reliable than click for some modals)
    document.addEventListener('focusin', (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT' && isLikelyOTPInput(target)) {
        setTimeout(() => {
          if (!isExtensionValid()) return;
          try {
            chrome.runtime.sendMessage({ type: 'GET_CODE' }, (response) => {
              if (chrome.runtime.lastError) return;
              if (response && response.code && response.autoPasteEnabled && !target.value) {
                fillInputDirectly(target, response.code);
              }
            });
          } catch (e) {}
        }, 50);
      }
    }, { passive: true });
  }
  
  // Check if input should be excluded (password, email, search, etc.)
  function isExcludedInput(input) {
    if (!input) return true;
    
    const type = (input.type || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const className = (input.className || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    const autocomplete = (input.autocomplete || '').toLowerCase();
    
    // Exclude password fields
    if (type === 'password') return true;
    
    // Exclude email fields
    if (type === 'email') return true;
    if (autocomplete.includes('email')) return true;
    
    // Exclude search fields
    if (type === 'search') return true;
    if (name.includes('search') || id.includes('search') || placeholder.includes('search')) return true;
    
    // Exclude common non-OTP field patterns
    const excludeKeywords = [
      'password', 'passwd', 'pwd', 'pass',
      'email', 'mail', 'e-mail',
      'username', 'user', 'login', 'signin',
      'firstname', 'first_name', 'first-name', 'fname',
      'lastname', 'last_name', 'last-name', 'lname',
      'fullname', 'full_name', 'full-name', 'name',
      'address', 'street', 'city', 'state', 'zip', 'postal', 'country',
      'phone', 'mobile', 'telephone', 'cell',
      'card', 'credit', 'cvv', 'cvc', 'expir',
      'date', 'birthday', 'dob', 'birth',
      'comment', 'message', 'note', 'description', 'bio',
      'company', 'organization', 'website', 'url',
      'search', 'query', 'filter', 'keyword'
    ];
    
    const allText = `${name} ${id} ${className} ${placeholder} ${ariaLabel} ${autocomplete}`;
    
    // Check for exclude keywords, but allow if it also has OTP keywords
    const otpKeywords = ['code', 'otp', 'verify', 'verification', 'token', 'mfa', '2fa', 'totp', 'digit'];
    const hasOTPKeyword = otpKeywords.some(kw => allText.includes(kw));
    
    if (hasOTPKeyword) return false; // OTP keyword takes priority
    
    // Check for excluded patterns
    for (const keyword of excludeKeywords) {
      if (allText.includes(keyword)) return true;
    }
    
    return false;
  }
  
  function isLikelyOTPInput(input) {
    if (!input || input.tagName !== 'INPUT') return false;
    if (input.disabled || input.readOnly) return false;
    
    // First check if this is an excluded field type
    if (isExcludedInput(input)) return false;
    
    const type = input.type || 'text';
    if (!['text', 'tel', 'number', ''].includes(type)) return false;
    
    // Check various attributes
    const maxLength = input.maxLength;
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const className = (input.className || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    
    // Check if it looks like an OTP input
    const codeKeywords = ['code', 'otp', 'verify', 'pin', 'digit', 'token', 'mfa', '2fa', 'confirmation'];
    const hasKeyword = codeKeywords.some(kw => 
      name.includes(kw) || id.includes(kw) || className.includes(kw) || 
      placeholder.includes(kw) || ariaLabel.includes(kw)
    );
    
    // Short maxlength is a strong indicator (but only if not excluded)
    const hasShortMaxLength = maxLength >= 4 && maxLength <= 8; // Narrowed range for safety
    
    // Numeric input mode
    const isNumeric = input.inputMode === 'numeric' || input.inputMode === 'tel' || type === 'tel' || type === 'number';
    
    // Is it inside a modal/dialog with verification context?
    const isInModal = !!input.closest('[role="dialog"], [aria-modal="true"], [class*="modal" i], [class*="dialog" i], [class*="popup" i]');
    
    // For modal inputs, require at least one positive indicator
    if (isInModal) {
      return hasKeyword || hasShortMaxLength || isNumeric;
    }
    
    return hasKeyword || (hasShortMaxLength && isNumeric);
  }
  
  function fillInputDirectly(input, code) {
    if (!input || input.value) return; // Don't overwrite existing value
    
    input.focus();
    
    // Set value using native setter for React/Vue compatibility
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, code);
    input.value = code;
    
    triggerInputEvents(input);
    showFilledNotification(code);
    
    // Tell background script the code was used
    if (isExtensionValid()) {
      try {
        chrome.runtime.sendMessage({ type: 'CODE_USED' });
      } catch (e) {}
    }
  }
  
  function watchForModals() {
    // Watch for modal/dialog elements appearing
    const modalObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          
          // Check if the added node is or contains a modal
          const isModal = MODAL_SELECTORS.some(sel => {
            try {
              return node.matches && node.matches(sel);
            } catch (e) { return false; }
          });
          
          const containsModal = MODAL_SELECTORS.some(sel => {
            try {
              return node.querySelector && node.querySelector(sel);
            } catch (e) { return false; }
          });
          
          if (isModal || containsModal) {
            // Modal appeared - try to fill with delay to let it render
            setTimeout(() => checkAndFill(true), 100);
            setTimeout(() => checkAndFill(true), 300);
            setTimeout(() => checkAndFill(true), 500);
          }
        }
      }
    });
    
    modalObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

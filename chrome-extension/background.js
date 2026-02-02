// Background service worker for CodePaste extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CODE_DETECTED') {
    handleCodeDetected(message.code, message.source);
    sendResponse({ success: true });
  } else if (message.type === 'GET_CODE') {
    chrome.storage.local.get(['currentCode', 'codeTimestamp', 'autoPasteEnabled'], (data) => {
      let code = data.currentCode || null;
      
      // Check if code is older than 10 minutes (600000 ms)
      const TEN_MINUTES = 10 * 60 * 1000;
      if (code && data.codeTimestamp) {
        const age = Date.now() - data.codeTimestamp;
        if (age > TEN_MINUTES) {
          code = null; // Code expired, don't return it
        }
      }
      
      sendResponse({
        code: code,
        autoPasteEnabled: data.autoPasteEnabled !== false
      });
    });
    return true; // Keep channel open for async response
  } else if (message.type === 'CODE_USED') {
    // Clear the current code after it's been used
    chrome.storage.local.remove(['currentCode']);
    sendResponse({ success: true });
  }
  return true;
});

async function handleCodeDetected(code, source) {
  // Get current history and check if code was already detected
  const data = await chrome.storage.local.get(['codeHistory', 'detectedCodesWithTime']);
  const history = data.codeHistory || [];
  let detectedCodesWithTime = data.detectedCodesWithTime || [];
  
  const TEN_MINUTES = 10 * 60 * 1000;
  const now = Date.now();
  
  // Clean up old entries (older than 10 minutes)
  detectedCodesWithTime = detectedCodesWithTime.filter(entry => (now - entry.timestamp) < TEN_MINUTES);
  
  // Check if this code was detected within the last 10 minutes - skip if so
  const recentlyDetected = detectedCodesWithTime.some(entry => entry.code === code);
  if (recentlyDetected) {
    return; // Code was detected recently, don't process again
  }
  
  // Add code to detected list with timestamp
  detectedCodesWithTime.unshift({ code, timestamp: now });
  // Keep last 50 to prevent memory bloat
  const trimmedDetected = detectedCodesWithTime.slice(0, 50);
  
  // Add to history
  history.unshift({
    code: code,
    source: source,
    timestamp: Date.now()
  });
  
  // Keep only last 10 codes in visible history
  const trimmedHistory = history.slice(0, 10);
  
  // Store the code
  await chrome.storage.local.set({
    currentCode: code,
    codeSource: source,
    codeTimestamp: Date.now(),
    codeHistory: trimmedHistory,
    detectedCodesWithTime: trimmedDetected
  });
  
  // Show notification badge
  chrome.action.setBadgeText({ text: '1' });
  chrome.action.setBadgeBackgroundColor({ color: '#48bb78' });
  
  // Clear badge after 10 seconds
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 10000);
  
  // Notify all tabs that a new code is available
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'NEW_CODE_AVAILABLE',
        code: code
      });
    } catch (e) {
      // Tab might not have content script, ignore
    }
  }
}

// Initialize storage with default settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    autoPasteEnabled: true,
    codeHistory: [],
    detectedCodesWithTime: []
  });
});

// Function to find and focus on email tab, then request code scan
async function findEmailTabAndScan() {
  const emailPatterns = [
    '*://mail.google.com/*',
    '*://outlook.live.com/*',
    '*://outlook.office.com/*',
    '*://outlook.office365.com/*',
    '*://mail.yahoo.com/*'
  ];
  
  let emailTab = null;
  
  // Search for an open email tab
  for (const pattern of emailPatterns) {
    const tabs = await chrome.tabs.query({ url: pattern });
    if (tabs.length > 0) {
      // Prefer the most recently accessed email tab
      emailTab = tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
      break;
    }
  }
  
  if (emailTab) {
    // Focus the email tab briefly to trigger any updates
    const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
    const originalTabId = currentTab[0]?.id;
    
    // Activate the email tab
    await chrome.tabs.update(emailTab.id, { active: true });
    await chrome.windows.update(emailTab.windowId, { focused: true });
    
    // Request immediate scan from the content script
    try {
      await chrome.tabs.sendMessage(emailTab.id, { type: 'SCAN_NOW' });
    } catch (e) {
      // Content script might not be ready
    }
    
    // Wait briefly for scan to complete, then switch back
    setTimeout(async () => {
      if (originalTabId) {
        try {
          await chrome.tabs.update(originalTabId, { active: true });
        } catch (e) {
          // Original tab might be closed
        }
      }
    }, 1500);
    
    return true;
  }
  
  return false;
}

// Listen for request to fetch code from email
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_FROM_EMAIL') {
    findEmailTabAndScan().then(found => {
      sendResponse({ success: found });
    });
    return true;
  }
});

// Background service worker for CodePaste extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CODE_DETECTED') {
    handleCodeDetected(message.code, message.source);
    sendResponse({ success: true });
  } else if (message.type === 'GET_CODE') {
    chrome.storage.local.get(['currentCode', 'autoPasteEnabled'], (data) => {
      sendResponse({
        code: data.currentCode || null,
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
  const data = await chrome.storage.local.get(['codeHistory', 'detectedCodes']);
  const history = data.codeHistory || [];
  const detectedCodes = data.detectedCodes || [];
  
  // Check if this code was already detected - skip if duplicate
  if (detectedCodes.includes(code)) {
    return; // Code already detected, don't process again
  }
  
  // Add code to detected list (keep last 50 to prevent memory bloat)
  detectedCodes.unshift(code);
  const trimmedDetected = detectedCodes.slice(0, 50);
  
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
    detectedCodes: trimmedDetected
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
    detectedCodes: []
  });
});

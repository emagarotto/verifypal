document.addEventListener('DOMContentLoaded', () => {
  const codeValue = document.getElementById('codeValue');
  const codeSource = document.getElementById('codeSource');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const status = document.getElementById('status');
  const autoPasteToggle = document.getElementById('autoPasteToggle');
  const historySection = document.getElementById('historySection');
  const historyList = document.getElementById('historyList');

  function isExtensionValid() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  function safeStorageGet(keys, callback) {
    if (!isExtensionValid()) return;
    try {
      chrome.storage.local.get(keys, (data) => {
        if (chrome.runtime.lastError) return;
        callback(data);
      });
    } catch (e) {
      // Extension context invalidated
    }
  }

  function safeStorageSet(data, callback) {
    if (!isExtensionValid()) return;
    try {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) return;
        if (callback) callback();
      });
    } catch (e) {
      // Extension context invalidated
    }
  }

  function safeStorageRemove(keys, callback) {
    if (!isExtensionValid()) return;
    try {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) return;
        if (callback) callback();
      });
    } catch (e) {
      // Extension context invalidated
    }
  }

  // Load settings and current code
  loadData();

  // Event listeners
  autoPasteToggle.addEventListener('change', (e) => {
    safeStorageSet({ autoPasteEnabled: e.target.checked });
    showStatus(e.target.checked ? 'Auto-paste enabled' : 'Auto-paste disabled', 'success');
  });

  copyBtn.addEventListener('click', async () => {
    const code = codeValue.textContent;
    if (code && !code.includes('No code')) {
      try {
        await navigator.clipboard.writeText(code);
        showStatus('Code copied to clipboard!', 'success');
      } catch (err) {
        showStatus('Failed to copy code', 'error');
      }
    }
  });

  clearBtn.addEventListener('click', () => {
    safeStorageRemove(['currentCode', 'codeSource', 'codeTimestamp'], () => {
      codeValue.innerHTML = '<span class="code-empty">No code detected yet</span>';
      codeSource.textContent = '';
      copyBtn.disabled = true;
      showStatus('Cleared current code', 'success');
    });
  });

  function loadData() {
    safeStorageGet(['currentCode', 'codeSource', 'codeTimestamp', 'autoPasteEnabled', 'codeHistory'], (data) => {
      // Load auto-paste setting
      autoPasteToggle.checked = data.autoPasteEnabled !== false;

      // Load current code
      if (data.currentCode) {
        codeValue.textContent = data.currentCode;
        copyBtn.disabled = false;
        
        if (data.codeSource) {
          codeSource.textContent = `From: ${data.codeSource}`;
        }
        
        if (data.codeTimestamp) {
          const time = new Date(data.codeTimestamp);
          const ago = getTimeAgo(time);
          codeSource.textContent += ` (${ago})`;
        }
      }

      // Load history
      if (data.codeHistory && data.codeHistory.length > 0) {
        historySection.style.display = 'block';
        historyList.innerHTML = data.codeHistory.slice(0, 5).map(item => `
          <div class="history-item">
            <span class="history-code">${item.code}</span>
            <span class="history-time">${getTimeAgo(new Date(item.timestamp))}</span>
          </div>
        `).join('');
      }
    });
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  }

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  // Listen for storage changes
  if (isExtensionValid()) {
    try {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (!isExtensionValid()) return;
        if (namespace === 'local' && changes.currentCode) {
          loadData();
        }
      });
    } catch (e) {
      // Extension context invalidated
    }
  }
});

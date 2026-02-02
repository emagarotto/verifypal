document.addEventListener('DOMContentLoaded', () => {
  const codeValue = document.getElementById('codeValue');
  const codeSource = document.getElementById('codeSource');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const fetchBtn = document.getElementById('fetchBtn');
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

  fetchBtn.addEventListener('click', () => {
    if (!isExtensionValid()) return;
    
    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Checking email...';
    
    try {
      chrome.runtime.sendMessage({ type: 'FETCH_FROM_EMAIL' }, (response) => {
        if (chrome.runtime.lastError) {
          fetchBtn.disabled = false;
          fetchBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Fetch from Email
          `;
          showStatus('Error fetching', 'error');
          return;
        }
        
        if (response && response.success) {
          showStatus('Switching to email tab...', 'success');
          // Reload data after a short delay to pick up any new code
          setTimeout(() => {
            loadData();
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Fetch from Email
            `;
          }, 2000);
        } else {
          fetchBtn.disabled = false;
          fetchBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Fetch from Email
          `;
          showStatus('No email tab found. Open Gmail, Outlook, or Yahoo Mail first.', 'error');
        }
      });
    } catch (e) {
      fetchBtn.disabled = false;
      showStatus('Error', 'error');
    }
  });

  function loadData() {
    const TEN_MINUTES = 10 * 60 * 1000;
    
    safeStorageGet(['currentCode', 'codeSource', 'codeTimestamp', 'autoPasteEnabled', 'codeHistory'], (data) => {
      // Load auto-paste setting
      autoPasteToggle.checked = data.autoPasteEnabled !== false;

      // Load current code
      if (data.currentCode) {
        const isExpired = data.codeTimestamp && (Date.now() - data.codeTimestamp > TEN_MINUTES);
        
        if (isExpired) {
          codeValue.innerHTML = `<span style="text-decoration: line-through; opacity: 0.5;">${data.currentCode}</span>`;
          codeSource.textContent = 'Expired (older than 10 minutes)';
          codeSource.style.color = '#e53e3e';
          copyBtn.disabled = true;
        } else {
          codeValue.textContent = data.currentCode;
          copyBtn.disabled = false;
          codeSource.style.color = '';
          
          if (data.codeSource) {
            codeSource.textContent = `From: ${data.codeSource}`;
          }
          
          if (data.codeTimestamp) {
            const time = new Date(data.codeTimestamp);
            const ago = getTimeAgo(time);
            codeSource.textContent += ` (${ago})`;
          }
        }
      }

      // Load history - show expired status for old codes
      if (data.codeHistory && data.codeHistory.length > 0) {
        historySection.style.display = 'block';
        historyList.innerHTML = data.codeHistory.slice(0, 5).map((item, index) => {
          const isExpired = Date.now() - item.timestamp > TEN_MINUTES;
          const expiredClass = isExpired ? 'style="opacity: 0.5; text-decoration: line-through;"' : '';
          const expiredLabel = isExpired ? ' (expired)' : '';
          return `
            <div class="history-item">
              <span class="history-code" ${expiredClass}>${item.code}</span>
              <span class="history-time">${getTimeAgo(new Date(item.timestamp))}${expiredLabel}</span>
              <button class="history-copy-btn" data-code="${item.code}" title="Copy code">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          `;
        }).join('');
        
        // Add click handlers for copy buttons
        document.querySelectorAll('.history-copy-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const code = e.currentTarget.dataset.code;
            try {
              await navigator.clipboard.writeText(code);
              showStatus('Code copied!', 'success');
            } catch (err) {
              showStatus('Failed to copy', 'error');
            }
          });
        });
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

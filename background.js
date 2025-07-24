// Redactor Background Script

chrome.runtime.onInstalled.addListener(() => {
  // Set default enabled state and contrast mode
  chrome.storage.sync.set({
    nodoxxingEnabled: true,
    contrastModeEnabled: true,
    ignoreList: [],
    filterList: [],
    protectionMode: 'all' // 'all' or 'filtered'
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Toggle extension state
  chrome.storage.sync.get(['nodoxxingEnabled'], (result) => {
    const newState = !result.nodoxxingEnabled;
    chrome.storage.sync.set({
      nodoxxingEnabled: newState
    });
    
    // Update icon based on state
    chrome.action.setIcon({
      path: newState ? {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      } : {
        "16": "icons/icon16-disabled.png",
        "48": "icons/icon48-disabled.png", 
        "128": "icons/icon128-disabled.png"
      }
    });
  });
});

// Update icon when storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.nodoxxingEnabled) {
    const isEnabled = changes.nodoxxingEnabled.newValue;
    chrome.action.setIcon({
      path: isEnabled ? {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      } : {
        "16": "icons/icon16-disabled.png",
        "48": "icons/icon48-disabled.png",
        "128": "icons/icon128-disabled.png"
      }
    });
  }
});
// Redactor Background Script

chrome.runtime.onInstalled.addListener(() => {
  // Check if we need to migrate from old format
  chrome.storage.sync.get(['siteList', 'siteListMode', 'ignoreList', 'filterList', 'protectionMode'], (result) => {
    // If new format already exists, don't migrate
    if (result.ignoreList !== undefined || result.filterList !== undefined || result.protectionMode !== undefined) {
      return;
    }
    
    // If old format exists, migrate it
    if (result.siteList !== undefined && result.siteListMode !== undefined) {
      
      const newData = {
        ignoreList: [],
        filterList: [],
        protectionMode: 'all'
      };
      
      if (result.siteListMode === 'blacklist') {
        newData.ignoreList = result.siteList;
        newData.protectionMode = 'all'; // Protect all except ignored
      } else if (result.siteListMode === 'whitelist') {
        newData.filterList = result.siteList;
        newData.protectionMode = 'filtered'; // Only protect filtered sites
      } else if (result.siteListMode === 'disabled') {
        newData.protectionMode = 'all'; // Protect all sites
      }
      
      // Save migrated data
      chrome.storage.sync.set(newData, () => {
        // Clean up old format (optional - could be kept for rollback)
        // chrome.storage.sync.remove(['siteList', 'siteListMode']);
      });
    } else {
      // No existing data, set defaults for new installation
      chrome.storage.sync.set({
        nodoxxingEnabled: true,
        contrastModeEnabled: true,
        ignoreList: [],
        filterList: [],
        protectionMode: 'all'
      });
    }
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
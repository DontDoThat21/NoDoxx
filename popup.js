// Redactor Popup Script

document.addEventListener('DOMContentLoaded', () => {
  // Original elements
  const toggle = document.getElementById('enableToggle');
  const contrastToggle = document.getElementById('contrastToggle');
  const status = document.getElementById('status');
  const statusIndicator = status.querySelector('.status-indicator');
  const statusText = status.querySelector('span');
  
  // User strings elements
  const newStringInput = document.getElementById('newStringInput');
  const addStringBtn = document.getElementById('addStringBtn');
  const userStringsList = document.getElementById('userStringsList');

  // Tab elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Site list elements
  const protectionModeRadios = document.querySelectorAll('input[name="protectionMode"]');
  const currentSiteUrl = document.getElementById('currentSiteUrl');
  const addToIgnoreBtn = document.getElementById('addToIgnoreBtn');
  const addToFilterBtn = document.getElementById('addToFilterBtn');
  const newSiteInput = document.getElementById('newSiteInput');
  const addToIgnoreManualBtn = document.getElementById('addToIgnoreManualBtn');
  const addToFilterManualBtn = document.getElementById('addToFilterManualBtn');
  const ignoreList = document.getElementById('ignoreList');
  const filterList = document.getElementById('filterList');

  // Initialize tabs
  initTabs();
  
  // Get current tab URL
  getCurrentTabUrl();

  // Load current state
  chrome.storage.sync.get(['nodoxxingEnabled', 'userStrings', 'contrastModeEnabled', 'ignoreList', 'filterList', 'protectionMode'], (result) => {
    const isEnabled = result.nodoxxingEnabled !== false; // Default to enabled
    const contrastModeEnabled = result.contrastModeEnabled !== false; // Default to enabled
    const userStrings = result.userStrings || [];
    const ignoreListData = result.ignoreList || [];
    const filterListData = result.filterList || [];
    const protectionMode = result.protectionMode || 'all';
    
    toggle.checked = isEnabled;
    contrastToggle.checked = contrastModeEnabled;
    updateStatus(isEnabled);
    renderUserStrings(userStrings);
    
    // Set protection mode
    const protectionModeRadio = document.querySelector(`input[name="protectionMode"][value="${protectionMode}"]`);
    if (protectionModeRadio) {
      protectionModeRadio.checked = true;
    }
    
    renderIgnoreList(ignoreListData);
    renderFilterList(filterListData);
  });

  // Handle toggle change
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    chrome.storage.sync.set({
      nodoxxingEnabled: isEnabled
    });
    updateStatus(isEnabled);
  });

  // Handle contrast mode toggle change
  contrastToggle.addEventListener('change', () => {
    const contrastModeEnabled = contrastToggle.checked;
    chrome.storage.sync.set({
      contrastModeEnabled: contrastModeEnabled
    });
  });

  // Handle add string button
  addStringBtn.addEventListener('click', addUserString);
  
  // Handle enter key in input
  newStringInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addUserString();
    }
  });
  
  // Site list event handlers
  protectionModeRadios.forEach(radio => {
    radio.addEventListener('change', handleProtectionModeChange);
  });
  
  addToIgnoreBtn.addEventListener('click', () => addCurrentSiteToList('ignore'));
  addToFilterBtn.addEventListener('click', () => addCurrentSiteToList('filter'));
  addToIgnoreManualBtn.addEventListener('click', () => addSiteManually('ignore'));
  addToFilterManualBtn.addEventListener('click', () => addSiteManually('filter'));
  
  newSiteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // Default to adding to filter list when pressing Enter
      // This is the safer option as it allows protection
      addSiteManually('filter');
      showToast('Site added to filter list. Use the buttons above to choose the specific list.', 'info');
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.nodoxxingEnabled) {
      const isEnabled = changes.nodoxxingEnabled.newValue;
      toggle.checked = isEnabled;
      updateStatus(isEnabled);
    }
    
    if (changes.contrastModeEnabled) {
      const contrastModeEnabled = changes.contrastModeEnabled.newValue;
      contrastToggle.checked = contrastModeEnabled;
    }
    
    if (changes.userStrings) {
      const userStrings = changes.userStrings.newValue || [];
      renderUserStrings(userStrings);
    }
    
    if (changes.ignoreList) {
      const ignoreListData = changes.ignoreList.newValue || [];
      renderIgnoreList(ignoreListData);
      // Update current site buttons
      getCurrentTabUrl();
    }
    
    if (changes.filterList) {
      const filterListData = changes.filterList.newValue || [];
      renderFilterList(filterListData);
      // Update current site buttons
      getCurrentTabUrl();
    }
    
    if (changes.protectionMode) {
      const protectionMode = changes.protectionMode.newValue;
      const protectionModeRadio = document.querySelector(`input[name="protectionMode"][value="${protectionMode}"]`);
      if (protectionModeRadio) {
        protectionModeRadio.checked = true;
      }
    }
  });

  function updateStatus(isEnabled) {
    if (isEnabled) {
      status.classList.remove('inactive');
      statusIndicator.classList.remove('inactive');
      statusText.textContent = 'Active - Your data is protected';
    } else {
      status.classList.add('inactive');
      statusIndicator.classList.add('inactive');
      statusText.textContent = 'Inactive - Data is not protected';
    }
  }
  
  function addUserString() {
    const newString = newStringInput.value.trim();
    if (!newString) return;
    
    chrome.storage.sync.get(['userStrings'], (result) => {
      const userStrings = result.userStrings || [];
      
      // Check if string already exists
      if (userStrings.includes(newString)) {
        showToast('This string is already in the list.', 'warning');
        return;
      }
      
      // Add new string
      userStrings.push(newString);
      
      // Save to storage
      chrome.storage.sync.set({ userStrings });
      
      // Clear input
      newStringInput.value = '';
    });
  }
  
  function removeUserString(stringToRemove) {
    chrome.storage.sync.get(['userStrings'], (result) => {
      const userStrings = result.userStrings || [];
      const updatedStrings = userStrings.filter(str => str !== stringToRemove);
      
      chrome.storage.sync.set({ userStrings: updatedStrings });
    });
  }
  
  function renderUserStrings(userStrings) {
    userStringsList.innerHTML = '';
    
    if (userStrings.length === 0) {
      const emptyItem = document.createElement('li');
      const emptyText = document.createElement('span');
      emptyText.className = 'string-text';
      emptyText.style.fontStyle = 'italic';
      emptyText.style.color = '#888';
      emptyText.textContent = 'No custom strings added';
      emptyItem.appendChild(emptyText);
      userStringsList.appendChild(emptyItem);
      return;
    }
    
    userStrings.forEach(userString => {
      const listItem = document.createElement('li');
      
      const stringText = document.createElement('span');
      stringText.className = 'string-text';
      stringText.title = userString;
      stringText.textContent = userString;
      listItem.appendChild(stringText);
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.dataset.string = userString;
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        removeUserString(userString);
      });
      listItem.appendChild(removeBtn);
      
      userStringsList.appendChild(listItem);
    });
  }
  
  // Tab functionality
  function initTabs() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        switchTab(targetTab);
      });
    });
  }
  
  function switchTab(targetTab) {
    // Remove active class from all tabs and content
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to target tab and content
    const targetBtn = document.querySelector(`[data-tab="${targetTab}"]`);
    const targetContent = document.getElementById(`${targetTab}-tab`);
    
    if (targetBtn && targetContent) {
      targetBtn.classList.add('active');
      targetContent.classList.add('active');
    }
  }
  
  // Cached domain to avoid redundant API calls
  let cachedDomain = null;
  
  // Get current tab URL
  function getCurrentTabUrl() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        
        // Update cached domain if it has changed
        if (cachedDomain !== domain) {
          cachedDomain = domain;
          currentSiteUrl.textContent = domain;
          
          // Check if current site is already in either list
          chrome.storage.sync.get(['ignoreList', 'filterList'], (result) => {
            const ignoreListData = result.ignoreList || [];
            const filterListData = result.filterList || [];
            const isInIgnoreList = ignoreListData.some(site => site.url === domain);
            const isInFilterList = filterListData.some(site => site.url === domain);
            
            addToIgnoreBtn.disabled = isInIgnoreList;
            addToIgnoreBtn.textContent = isInIgnoreList ? 'In Ignore List' : 'Add to Ignore';
            
            addToFilterBtn.disabled = isInFilterList;
            addToFilterBtn.textContent = isInFilterList ? 'In Filter List' : 'Add to Filter';
          });
        }
      } else {
        cachedDomain = null;
        currentSiteUrl.textContent = 'Unable to detect';
        addToIgnoreBtn.disabled = true;
        addToIgnoreBtn.textContent = 'Unable to add';
        addToFilterBtn.disabled = true;
        addToFilterBtn.textContent = 'Unable to add';
      }
    });
  }
  
  // Site list functions
  function handleProtectionModeChange() {
    const selectedMode = document.querySelector('input[name="protectionMode"]:checked').value;
    chrome.storage.sync.set({ protectionMode: selectedMode });
  }
  
  function addCurrentSiteToList(listType) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        addSiteToList(domain, listType);
      }
    });
  }
  
  function addSiteManually(listType) {
    const siteUrl = newSiteInput.value.trim();
    if (!siteUrl) return;
    
    // Try to extract domain from URL
    let domain;
    try {
      if (siteUrl.startsWith('http://') || siteUrl.startsWith('https://')) {
        domain = new URL(siteUrl).hostname;
      } else {
        // Assume it's just a domain
        domain = siteUrl;
      }
    } catch (error) {
      // If URL parsing fails, notify the user and use the input as-is
      showToast('Failed to parse the URL. Using the input as-is. Please ensure it is a valid domain.', 'warning');
      domain = siteUrl;
    }
    
    addSiteToList(domain, listType);
    newSiteInput.value = '';
  }
  
  function addSiteToList(domain, listType) {
    const storageKey = listType === 'ignore' ? 'ignoreList' : 'filterList';
    const otherStorageKey = listType === 'ignore' ? 'filterList' : 'ignoreList';
    
    chrome.storage.sync.get([storageKey, otherStorageKey], (result) => {
      const currentList = result[storageKey] || [];
      const otherList = result[otherStorageKey] || [];
      
      // Check if site already exists in current list
      if (currentList.some(site => site.url === domain)) {
        showNotification(`This site is already in the ${listType} list.`, 'error');
        return;
      }
      
      // Remove from other list if it exists there
      const updatedOtherList = otherList.filter(site => site.url !== domain);
      
      // Add new site to current list
      const newSite = {
        url: domain,
        enabled: true,
        addedAt: Date.now()
      };
      
      currentList.push(newSite);
      
      // Update storage
      const updateData = {};
      updateData[storageKey] = currentList;
      updateData[otherStorageKey] = updatedOtherList;
      
      chrome.storage.sync.set(updateData);
      
      // Update current site buttons if this was the current site
      getCurrentTabUrl();
    });
  }
  
  function removeSiteFromList(domain, listType) {
    const storageKey = listType === 'ignore' ? 'ignoreList' : 'filterList';
    chrome.storage.sync.get([storageKey], (result) => {
      const currentList = result[storageKey] || [];
      const updatedList = currentList.filter(site => site.url !== domain);
      const updateData = {};
      updateData[storageKey] = updatedList;
      chrome.storage.sync.set(updateData);
      
      // Update current site buttons if this was the current site
      getCurrentTabUrl();
    });
  }
  
  function toggleSiteEnabled(domain, enabled, listType) {
    const storageKey = listType === 'ignore' ? 'ignoreList' : 'filterList';
    chrome.storage.sync.get([storageKey], (result) => {
      const currentList = result[storageKey] || [];
      const site = currentList.find(site => site.url === domain);
      if (site) {
        site.enabled = enabled;
        const updateData = {};
        updateData[storageKey] = currentList;
        chrome.storage.sync.set(updateData);
      }
    });
  }
  
  function renderIgnoreList(ignoreListData) {
    ignoreList.innerHTML = '';
    
    if (ignoreListData.length === 0) {
      const emptyItem = document.createElement('li');
      const emptyText = document.createElement('span');
      emptyText.className = 'site-url';
      emptyText.style.fontStyle = 'italic';
      emptyText.style.color = '#888';
      emptyText.textContent = 'No sites in ignore list';
      emptyItem.appendChild(emptyText);
      ignoreList.appendChild(emptyItem);
      return;
    }
    
    ignoreListData.forEach(site => {
      const listItem = document.createElement('li');
      
      const siteUrl = document.createElement('span');
      siteUrl.className = 'site-url';
      siteUrl.title = site.url;
      siteUrl.textContent = site.url;
      listItem.appendChild(siteUrl);
      
      const toggleContainer = document.createElement('div');
      toggleContainer.className = 'site-toggle';
      
      const toggleCheckbox = document.createElement('input');
      toggleCheckbox.type = 'checkbox';
      toggleCheckbox.checked = site.enabled;
      toggleCheckbox.addEventListener('change', () => {
        toggleSiteEnabled(site.url, toggleCheckbox.checked, 'ignore');
      });
      toggleContainer.appendChild(toggleCheckbox);
      listItem.appendChild(toggleContainer);
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        removeSiteFromList(site.url, 'ignore');
      });
      listItem.appendChild(removeBtn);
      
      ignoreList.appendChild(listItem);
    });
  }
  
  function renderFilterList(filterListData) {
    filterList.innerHTML = '';
    
    if (filterListData.length === 0) {
      const emptyItem = document.createElement('li');
      const emptyText = document.createElement('span');
      emptyText.className = 'site-url';
      emptyText.style.fontStyle = 'italic';
      emptyText.style.color = '#888';
      emptyText.textContent = 'No sites in filter list';
      emptyItem.appendChild(emptyText);
      filterList.appendChild(emptyItem);
      return;
    }
    
    filterListData.forEach(site => {
      const listItem = document.createElement('li');
      
      const siteUrl = document.createElement('span');
      siteUrl.className = 'site-url';
      siteUrl.title = site.url;
      siteUrl.textContent = site.url;
      listItem.appendChild(siteUrl);
      
      const toggleContainer = document.createElement('div');
      toggleContainer.className = 'site-toggle';
      
      const toggleCheckbox = document.createElement('input');
      toggleCheckbox.type = 'checkbox';
      toggleCheckbox.checked = site.enabled;
      toggleCheckbox.addEventListener('change', () => {
        toggleSiteEnabled(site.url, toggleCheckbox.checked, 'filter');
      });
      toggleContainer.appendChild(toggleCheckbox);
      listItem.appendChild(toggleContainer);
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        removeSiteFromList(site.url, 'filter');
      });
      listItem.appendChild(removeBtn);
      
      filterList.appendChild(listItem);
    });
  }
  
  // Simple notification function - replaced alert with toast system
  function showNotification(message, type = 'info') {
    showToast(message, type);
  }
  
  // Toast notification system to replace intrusive alert() dialogs
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 4000);
  }
});
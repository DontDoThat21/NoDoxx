// NoDoxxing Popup Script

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
  const siteModeRadios = document.querySelectorAll('input[name="siteMode"]');
  const currentSiteUrl = document.getElementById('currentSiteUrl');
  const addCurrentSiteBtn = document.getElementById('addCurrentSiteBtn');
  const newSiteInput = document.getElementById('newSiteInput');
  const addSiteBtn = document.getElementById('addSiteBtn');
  const sitesList = document.getElementById('sitesList');

  // Initialize tabs
  initTabs();
  
  // Get current tab URL
  getCurrentTabUrl();

  // Load current state
  chrome.storage.sync.get(['nodoxxingEnabled', 'userStrings', 'contrastModeEnabled', 'siteList', 'siteListMode'], (result) => {
    const isEnabled = result.nodoxxingEnabled !== false; // Default to enabled
    const contrastModeEnabled = result.contrastModeEnabled !== false; // Default to enabled
    const userStrings = result.userStrings || [];
    const siteList = result.siteList || [];
    const siteListMode = result.siteListMode || 'disabled';
    
    toggle.checked = isEnabled;
    contrastToggle.checked = contrastModeEnabled;
    updateStatus(isEnabled);
    renderUserStrings(userStrings);
    
    // Set site mode
    const siteModeRadio = document.querySelector(`input[name="siteMode"][value="${siteListMode}"]`);
    if (siteModeRadio) {
      siteModeRadio.checked = true;
    }
    
    renderSitesList(siteList);
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
  siteModeRadios.forEach(radio => {
    radio.addEventListener('change', handleSiteModeChange);
  });
  
  addCurrentSiteBtn.addEventListener('click', addCurrentSite);
  addSiteBtn.addEventListener('click', addSiteManually);
  
  newSiteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addSiteManually();
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
    
    if (changes.siteList) {
      const siteList = changes.siteList.newValue || [];
      renderSitesList(siteList);
      // Update current site button
      getCurrentTabUrl();
    }
    
    if (changes.siteListMode) {
      const siteListMode = changes.siteListMode.newValue;
      const siteModeRadio = document.querySelector(`input[name="siteMode"][value="${siteListMode}"]`);
      if (siteModeRadio) {
        siteModeRadio.checked = true;
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
        alert('This string is already in the list.');
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
  
  // Get current tab URL
  function getCurrentTabUrl() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        currentSiteUrl.textContent = domain;
        
        // Check if current site is already in list
        chrome.storage.sync.get(['siteList'], (result) => {
          const siteList = result.siteList || [];
          const isInList = siteList.some(site => site.url === domain);
          addCurrentSiteBtn.disabled = isInList;
          addCurrentSiteBtn.textContent = isInList ? 'Already added' : 'Add to list';
        });
      } else {
        currentSiteUrl.textContent = 'Unable to detect';
        addCurrentSiteBtn.disabled = true;
        addCurrentSiteBtn.textContent = 'Unable to add';
      }
    });
  }
  
  // Site list functions
  function handleSiteModeChange() {
    const selectedMode = document.querySelector('input[name="siteMode"]:checked').value;
    chrome.storage.sync.set({ siteListMode: selectedMode });
  }
  
  function addCurrentSite() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        addSiteToList(domain);
      }
    });
  }
  
  function addSiteManually() {
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
      alert('Failed to parse the URL. Using the input as-is. Please ensure it is a valid domain.');
      domain = siteUrl;
    }
    
    addSiteToList(domain);
    newSiteInput.value = '';
  }
  
  function addSiteToList(domain) {
    chrome.storage.sync.get(['siteList'], (result) => {
      const siteList = result.siteList || [];
      
      // Check if site already exists
      if (siteList.some(site => site.url === domain)) {
        alert('This site is already in the list.');
        return;
      }
      
      // Add new site
      const newSite = {
        url: domain,
        enabled: true,
        addedAt: Date.now()
      };
      
      siteList.push(newSite);
      chrome.storage.sync.set({ siteList });
      
      // Update current site button if this was the current site
      getCurrentTabUrl();
    });
  }
  
  function removeSiteFromList(domain) {
    chrome.storage.sync.get(['siteList'], (result) => {
      const siteList = result.siteList || [];
      const updatedSites = siteList.filter(site => site.url !== domain);
      chrome.storage.sync.set({ siteList: updatedSites });
      
      // Update current site button if this was the current site
      getCurrentTabUrl();
    });
  }
  
  function toggleSiteEnabled(domain, enabled) {
    chrome.storage.sync.get(['siteList'], (result) => {
      const siteList = result.siteList || [];
      const site = siteList.find(site => site.url === domain);
      if (site) {
        site.enabled = enabled;
        chrome.storage.sync.set({ siteList });
      }
    });
  }
  
  function renderSitesList(siteList) {
    sitesList.innerHTML = '';
    
    if (siteList.length === 0) {
      const emptyItem = document.createElement('li');
      const emptyText = document.createElement('span');
      emptyText.className = 'site-url';
      emptyText.style.fontStyle = 'italic';
      emptyText.style.color = '#888';
      emptyText.textContent = 'No sites added';
      emptyItem.appendChild(emptyText);
      sitesList.appendChild(emptyItem);
      return;
    }
    
    siteList.forEach(site => {
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
        toggleSiteEnabled(site.url, toggleCheckbox.checked);
      });
      toggleContainer.appendChild(toggleCheckbox);
      listItem.appendChild(toggleContainer);
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        removeSiteFromList(site.url);
      });
      listItem.appendChild(removeBtn);
      
      sitesList.appendChild(listItem);
    });
  }
});
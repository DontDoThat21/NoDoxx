// NoDoxxing Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableToggle');
  const contrastToggle = document.getElementById('contrastToggle');
  const status = document.getElementById('status');
  const statusIndicator = status.querySelector('.status-indicator');
  const statusText = status.querySelector('span');
  
  // User strings elements
  const newStringInput = document.getElementById('newStringInput');
  const addStringBtn = document.getElementById('addStringBtn');
  const userStringsList = document.getElementById('userStringsList');

  // Load current state
  chrome.storage.sync.get(['nodoxxingEnabled', 'userStrings', 'contrastModeEnabled'], (result) => {
    const isEnabled = result.nodoxxingEnabled !== false; // Default to enabled
    const contrastModeEnabled = result.contrastModeEnabled !== false; // Default to enabled
    const userStrings = result.userStrings || [];
    
    toggle.checked = isEnabled;
    contrastToggle.checked = contrastModeEnabled;
    updateStatus(isEnabled);
    renderUserStrings(userStrings);
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
});
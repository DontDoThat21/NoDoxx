// NoDoxxing Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableToggle');
  const status = document.getElementById('status');
  const statusIndicator = status.querySelector('.status-indicator');
  const statusText = status.querySelector('span');
  
  // User strings elements
  const newStringInput = document.getElementById('newStringInput');
  const addStringBtn = document.getElementById('addStringBtn');
  const userStringsList = document.getElementById('userStringsList');

  // Load current state
  chrome.storage.sync.get(['nodoxxingEnabled', 'userStrings'], (result) => {
    const isEnabled = result.nodoxxingEnabled !== false; // Default to enabled
    const userStrings = result.userStrings || [];
    
    toggle.checked = isEnabled;
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
      emptyItem.innerHTML = '<span class="string-text" style="font-style: italic; color: #888;">No custom strings added</span>';
      userStringsList.appendChild(emptyItem);
      return;
    }
    
    userStrings.forEach(userString => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <span class="string-text" title="${userString}">${userString}</span>
        <button class="remove-btn" data-string="${userString}">Remove</button>
      `;
      
      const removeBtn = listItem.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        removeUserString(userString);
      });
      
      userStringsList.appendChild(listItem);
    });
  }
});
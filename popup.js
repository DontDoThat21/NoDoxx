// NoDoxxing Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableToggle');
  const status = document.getElementById('status');
  const statusIndicator = status.querySelector('.status-indicator');
  const statusText = status.querySelector('span');

  // Load current state
  chrome.storage.sync.get(['nodoxxingEnabled'], (result) => {
    const isEnabled = result.nodoxxingEnabled !== false; // Default to enabled
    toggle.checked = isEnabled;
    updateStatus(isEnabled);
  });

  // Handle toggle change
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    chrome.storage.sync.set({
      nodoxxingEnabled: isEnabled
    });
    updateStatus(isEnabled);
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.nodoxxingEnabled) {
      const isEnabled = changes.nodoxxingEnabled.newValue;
      toggle.checked = isEnabled;
      updateStatus(isEnabled);
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
});
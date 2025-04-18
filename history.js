document.addEventListener('DOMContentLoaded', async () => {
  const emailListElement = document.getElementById('emailList');
  const themeToggleButton = document.getElementById('themeToggle');

  const getSavedTheme = async () => {
    try {
      const { darkMode } = await chrome.storage.local.get(['darkMode']);
      return darkMode === true;
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return false;
    }
  };

  const applyTheme = (isDarkMode) => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const isDarkMode = await getSavedTheme();
  applyTheme(isDarkMode);

  themeToggleButton.addEventListener('click', async () => {
    const currentDarkMode = document.body.classList.contains('dark-mode');
    const newDarkMode = !currentDarkMode;
    
    try {
      await chrome.storage.local.set({ darkMode: newDarkMode });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
    
    applyTheme(newDarkMode);
  });

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  function calculateTimeLeft(expiresAt) {
    return Math.max(0, expiresAt - Date.now());
  }

  function formatTimeLeft(seconds) {
    const hours = Math.floor(seconds / 3600000);
    const minutes = Math.floor((seconds % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  try {
    const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);

    if (inboxes.length === 0) {
      emailListElement.innerHTML = '<div class="no-emails">No previous email addresses found</div>';
      return;
    }

    inboxes.sort((a, b) => b.createdAt - a.createdAt);

    emailListElement.innerHTML = inboxes
      .map(inbox => {
        const timeLeft = inbox.expiresAt ? calculateTimeLeft(inbox.expiresAt) : null;
        const expiryWarning = timeLeft && timeLeft <= 3600 ? ' expiry-warning' : '';
        const expiryText = timeLeft ? `Expires in ${formatTimeLeft(timeLeft)}` : '';
        
        return `
          <div class="email-item${expiryWarning}">
            <span class="email-address">${inbox.address}</span>
            <span class="timestamp">${formatDate(inbox.createdAt)}</span>
            ${expiryText ? `<span class="email-expiry">${expiryText}</span>` : ''}
          </div>
        `;
      })
      .join('');

  } catch (error) {
    console.error('Error loading email history:', error);
    emailListElement.innerHTML = '<div class="no-emails">Error loading email history</div>';
  }
});
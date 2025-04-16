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

  try {
    const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);

    if (inboxes.length === 0) {
      emailListElement.innerHTML = '<div class="no-emails">No previous email addresses found</div>';
      return;
    }

    inboxes.sort((a, b) => b.createdAt - a.createdAt);

    emailListElement.innerHTML = inboxes
      .map(inbox => `
        <div class="email-item">
          <span class="email-address">${inbox.address}</span>
          <span class="timestamp">${formatDate(inbox.createdAt)}</span>
        </div>
      `)
      .join('');

  } catch (error) {
    console.error('Error loading email history:', error);
    emailListElement.innerHTML = '<div class="no-emails">Error loading email history</div>';
  }
});
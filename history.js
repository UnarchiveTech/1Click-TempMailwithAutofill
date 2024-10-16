document.addEventListener('DOMContentLoaded', async () => {
  const emailListElement = document.getElementById('emailList');
  const themeToggleButton = document.getElementById('themeToggle');

  // Check for saved theme preference
  const getSavedTheme = async () => {
    try {
      const { darkMode } = await chrome.storage.local.get(['darkMode']);
      return darkMode === true;
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return false;
    }
  };

  // Apply theme based on preference
  const applyTheme = (isDarkMode) => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Initialize theme
  const isDarkMode = await getSavedTheme();
  applyTheme(isDarkMode);

  // Theme toggle functionality
  themeToggleButton.addEventListener('click', async () => {
    const currentDarkMode = document.body.classList.contains('dark-mode');
    const newDarkMode = !currentDarkMode;
    
    // Save theme preference
    try {
      await chrome.storage.local.set({ darkMode: newDarkMode });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
    
    applyTheme(newDarkMode);
  });

  // Function to format date
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  try {
    // Get email history from storage
    const { emailHistory = [] } = await chrome.storage.local.get(['emailHistory']);

    if (emailHistory.length === 0) {
      emailListElement.innerHTML = '<div class="no-emails">No previous email addresses found</div>';
      return;
    }

    // Sort emails by timestamp, most recent first
    emailHistory.sort((a, b) => b.timestamp - a.timestamp);

    // Display emails with improved formatting
    emailListElement.innerHTML = emailHistory
      .map(entry => `
        <div class="email-item">
          <span class="email-address">${entry.email}</span>
          <span class="timestamp">${formatDate(entry.timestamp)}</span>
        </div>
      `)
      .join('');

  } catch (error) {
    console.error('Error loading email history:', error);
    emailListElement.innerHTML = '<div class="no-emails">Error loading email history</div>';
  }
});
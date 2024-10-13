document.addEventListener('DOMContentLoaded', async () => {
  const emailListElement = document.getElementById('emailList');

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
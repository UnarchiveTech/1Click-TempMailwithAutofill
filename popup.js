document.addEventListener('DOMContentLoaded', async () => {
  const inboxContainer = document.getElementById('inboxContainer');
  const inboxDropdown = document.getElementById('inboxDropdown');
  const dropdownSelected = inboxDropdown.querySelector('.dropdown-selected');
  const dropdownList = inboxDropdown.querySelector('.dropdown-list');
  const addInboxButton = document.getElementById('addInboxButton');
  const copyEmailButton = document.getElementById('copyEmailButton');
  const startSignupButton = document.getElementById('startSignup');
  const refreshMessagesButton = document.getElementById('refreshMessages');
  const themeToggleButton = document.getElementById('themeToggle');
  const messagesListElement = document.getElementById('messagesList');
  const messageDetailElement = document.getElementById('messageDetail');
  const messageDetailContentElement = document.getElementById('messageDetailContent');
  const backButton = document.getElementById('backButton');
  const latestOtpContainer = document.getElementById('latestOtpContainer');
  const latestOtpCode = document.getElementById('latestOtpCode');
  const copyOtpButton = document.getElementById('copyOtpButton');
  const otpContext = document.getElementById('otpContext');
  const historyButton = document.getElementById('historyButton');
  const reportIssueButton = document.getElementById('reportIssue');
  const loginInfoButton = document.getElementById('loginInfoButton');
  const loginInfoSection = document.querySelector('.login-info-section');
  const savedLoginInfo = document.getElementById('savedLoginInfo');
  const exportDataButton = document.getElementById('exportData');
  const importDataButton = document.getElementById('importData');
  const searchMessagesInput = document.getElementById('searchMessages');
  const otpFilterCheckbox = document.getElementById('otpFilter');
  const analyticsButton = document.getElementById('analyticsButton');
  const analyticsSection = document.querySelector('.analytics-section');
  const analyticsDashboard = document.getElementById('analyticsDashboard');
  const notificationsToggle = document.getElementById('notificationsToggle');
  const settingsButton = document.getElementById('settingsButton');
  const settingsSection = document.querySelector('.settings-section');
  const useCustomPasswordToggle = document.getElementById('useCustomPasswordToggle');
  const customPasswordInput = document.getElementById('customPasswordInput');
  const customPasswordContainer = document.getElementById('customPasswordContainer');
  const useCustomNameToggle = document.getElementById('useCustomNameToggle');
  const customNameContainer = document.getElementById('customNameContainer');
  const customFirstNameInput = document.getElementById('customFirstNameInput');
  const customLastNameInput = document.getElementById('customLastNameInput');
  const autoCopyToggle = document.getElementById('autoCopyToggle');
  let loginInfoViewActive = false;
  let analyticsViewActive = false;
  let settingsViewActive = false;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  const historySection = document.querySelector('.history-section');
  const emailHistoryList = document.getElementById('emailHistoryList');
  let historyViewActive = false;

  let currentFilters = {
    searchQuery: '',
    hasOTP: false
  };

  // Initialize notifications toggle
  async function initializeNotifications() {
    try {
      const { notificationSettings = { enabled: true } } = await chrome.storage.local.get(['notificationSettings']);
      const notificationsToggle = document.getElementById('notificationsToggle');
      notificationsToggle.setAttribute('data-enabled', notificationSettings.enabled);
      updateNotificationIcon(notificationsToggle, notificationSettings.enabled);
      if (notificationSettings.enabled) {
        await requestNotificationPermission();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      showToast('Failed to initialize notifications', true);
    }
  }

  // Request notification permission
  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      showToast('Notifications not supported in this browser', true);
      notificationsToggle.checked = false;
      await chrome.storage.local.set({ notificationSettings: { enabled: false } });
      return;
    }

    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          notificationsToggle.checked = false;
          await chrome.storage.local.set({ notificationSettings: { enabled: false } });
          showToast('Notifications permission denied', true);
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        showToast('Failed to request notification permission', true);
      }
    } else if (Notification.permission === 'denied') {
      notificationsToggle.checked = false;
      await chrome.storage.local.set({ notificationSettings: { enabled: false } });
      showToast('Notifications permission denied', true);
    }
  }

  function updateNotificationIcon(button, enabled) {
    button.setAttribute('data-enabled', enabled);
    button.querySelector('.notification-enabled').style.display = enabled ? 'inline' : 'none';
    button.querySelector('.notification-disabled').style.display = enabled ? 'none' : 'inline';
  }
  
  // Handle notifications toggle
  notificationsToggle.addEventListener('click', async () => {
    const currentEnabled = notificationsToggle.getAttribute('data-enabled') === 'true';
    const enabled = !currentEnabled;
    try {
      await chrome.storage.local.set({ notificationSettings: { enabled } });
      updateNotificationIcon(notificationsToggle, enabled);
      if (enabled) {
        await requestNotificationPermission();
        if (Notification.permission !== 'granted') {
          updateNotificationIcon(notificationsToggle, false);
          await chrome.storage.local.set({ notificationSettings: { enabled: false } });
          showToast('Notifications permission denied', true);
          return;
        }
      }
      showToast(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showToast('Failed to update notification settings', true);
      updateNotificationIcon(notificationsToggle, currentEnabled); // Revert icon
    }
  });

  loginInfoButton.addEventListener('click', () => {
    loginInfoViewActive = !loginInfoViewActive;
    
    if (loginInfoViewActive) {
      updateSavedLoginInfo();
      loginInfoSection.style.display = 'block';
      loginInfoSection.classList.add('fullscreen');
      historySection.style.display = 'none';
      analyticsSection.style.display = 'none';
      settingsSection.style.display = 'none';
      historyViewActive = false;
      analyticsViewActive = false;
      settingsViewActive = false;
      
      if (!document.getElementById('loginInfoBackButton')) {
        const backButton = document.createElement('button');
        backButton.id = 'loginInfoBackButton';
        backButton.className = 'back-button';
        backButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        `;
        backButton.addEventListener('click', () => {
          loginInfoViewActive = false;
          loginInfoSection.classList.remove('fullscreen');
          loginInfoSection.style.display = 'none';
          if (document.getElementById('loginInfoBackButton')) {
            document.getElementById('loginInfoBackButton').remove();
          }
        });
        loginInfoSection.insertBefore(backButton, loginInfoSection.firstChild);
      }
    } else {
      loginInfoSection.classList.remove('fullscreen');
      loginInfoSection.style.display = 'none';
      if (document.getElementById('loginInfoBackButton')) {
        document.getElementById('loginInfoBackButton').remove();
      }
    }
  });

  historyButton.addEventListener('click', () => {
    historyViewActive = !historyViewActive;
    
    if (historyViewActive) {
      updateEmailHistory();
      historySection.style.display = 'block';
      historySection.classList.add('fullscreen');
      loginInfoSection.style.display = 'none';
      analyticsSection.style.display = 'none';
      settingsSection.style.display = 'none';
      loginInfoViewActive = false;
      analyticsViewActive = false;
      settingsViewActive = false;
      
      if (!document.getElementById('historyBackButton')) {
        const backButton = document.createElement('button');
        backButton.id = 'historyBackButton';
        backButton.className = 'back-button';
        backButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        `;
        backButton.addEventListener('click', () => {
          historyViewActive = false;
          historySection.classList.remove('fullscreen');
          historySection.style.display = 'none';
          if (document.getElementById('historyBackButton')) {
            document.getElementById('historyBackButton').remove();
          }
        });
        historySection.insertBefore(backButton, historySection.firstChild);
      }
    } else {
      historySection.classList.remove('fullscreen');
      historySection.style.display = 'none';
      if (document.getElementById('historyBackButton')) {
        document.getElementById('historyBackButton').remove();
      }
    }
  });

  analyticsButton.addEventListener('click', () => {
    analyticsViewActive = !analyticsViewActive;
    
    if (analyticsViewActive) {
      updateAnalyticsDashboard();
      analyticsSection.style.display = 'block';
      analyticsSection.classList.add('fullscreen');
      loginInfoSection.style.display = 'none';
      historySection.style.display = 'none';
      settingsSection.style.display = 'none';
      loginInfoViewActive = false;
      historyViewActive = false;
      settingsViewActive = false;
      
      if (!document.getElementById('analyticsBackButton')) {
        const backButton = document.createElement('button');
        backButton.id = 'analyticsBackButton';
        backButton.className = 'back-button';
        backButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        `;
        backButton.addEventListener('click', () => {
          analyticsViewActive = false;
          analyticsSection.classList.remove('fullscreen');
          analyticsSection.style.display = 'none';
          if (document.getElementById('analyticsBackButton')) {
            document.getElementById('analyticsBackButton').remove();
          }
        });
        analyticsSection.insertBefore(backButton, analyticsSection.firstChild);
      }
    } else {
      analyticsSection.classList.remove('fullscreen');
      analyticsSection.style.display = 'none';
      if (document.getElementById('analyticsBackButton')) {
        document.getElementById('analyticsBackButton').remove();
      }
    }
  });

  settingsButton.addEventListener('click', () => {
    settingsViewActive = !settingsViewActive;
    
    if (settingsViewActive) {
      settingsSection.style.display = 'block';
      settingsSection.classList.add('fullscreen');
      loginInfoSection.style.display = 'none';
      historySection.style.display = 'none';
      analyticsSection.style.display = 'none';
      loginInfoViewActive = false;
      historyViewActive = false;
      analyticsViewActive = false;
      settingsViewActive = false;
      
      if (!document.getElementById('settingsBackButton')) {
        const backButton = document.createElement('button');
        backButton.id = 'settingsBackButton';
        backButton.className = 'back-button';
        backButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        `;
        backButton.addEventListener('click', () => {
          settingsViewActive = false;
          settingsSection.classList.remove('fullscreen');
          settingsSection.style.display = 'none';
          if (document.getElementById('settingsBackButton')) {
            document.getElementById('settingsBackButton').remove();
          }
        });
        settingsSection.insertBefore(backButton, settingsSection.firstChild);
      }
    } else {
      settingsSection.classList.remove('fullscreen');
      settingsSection.style.display = 'none';
      if (document.getElementById('settingsBackButton')) {
        document.getElementById('settingsBackButton').remove();
      }
    }
  });

  reportIssueButton.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://github.com/UnarchiveTech/1Click-TempMailwithAutofill/issues/new'
    });
  });

  exportDataButton.addEventListener('click', async () => {
    const result = await window.dataManager.exportData();
    if (result.success) {
      showToast('Data exported successfully');
    } else {
      showToast('Failed to export data: ' + result.error, true);
    }
  });

  importDataButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await window.dataManager.importData(file);
      if (result.success) {
        showToast('Data imported successfully');
        updateEmailHistory();
        updateSavedLoginInfo();
        await initializeInboxes();
      } else {
        showToast('Failed to import data: ' + result.error, true);
      }
    } catch (error) {
      showToast('Error importing data: ' + error.message, true);
    } finally {
      fileInput.value = '';
    }
  });

  const initializeTheme = async () => {
    try {
      const { darkMode } = await chrome.storage.local.get(['darkMode']);
      if (darkMode === true) {
        document.body.classList.add('dark-mode');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return false;
    }
  };

  let isDarkMode = await initializeTheme();

  themeToggleButton.addEventListener('click', async () => {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    try {
      await chrome.storage.local.set({ darkMode: isDarkMode });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  });

  function showToast(message, isError = false) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async function copyToClipboard(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      
      if (text === latestOtpCode.textContent) {
        const originalIcon = copyOtpButton.querySelector('svg:not(.check-icon)');
        const checkIcon = copyOtpButton.querySelector('.check-icon');
        originalIcon.style.display = 'none';
        checkIcon.style.display = 'inline';
        setTimeout(() => {
          originalIcon.style.display = 'inline';
          checkIcon.style.display = 'none';
        }, 2000);
      } else {
        showToast('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy', true);
    }
  }

  copyOtpButton.addEventListener('click', () => {
    const otpText = latestOtpCode.textContent;
    if (otpText && otpText !== '------') {
      copyToClipboard(otpText);
    }
  });

  copyEmailButton.addEventListener('click', () => {
    const emailText = dropdownSelected.textContent;
    if (emailText && emailText !== 'Select an inbox') {
      copyToClipboard(emailText);
    }
  });

  function timeAgo(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const secondsPast = (now - timestamp) / 1000;

    if (secondsPast < 60) {
      return `${Math.round(secondsPast)}s ago`;
    }
    if (secondsPast < 3600) {
      return `${Math.round(secondsPast / 60)}m ago`;
    }
    if (secondsPast <= 86400) {
      return `${Math.round(secondsPast / 3600)}h ago`;
    }
    const days = Math.round(secondsPast / 86400);
    return `${days}d ago`;
  }

  function updateLatestOtp(message) {
    if (message && message.otp) {
      latestOtpContainer.style.display = 'block';
      latestOtpCode.textContent = message.otp;
      
      const fromText = message.from_name ? `From: ${message.from_name}` : '';
      const timeText = timeAgo(message.received_at * 1000);
      otpContext.textContent = [fromText, timeText].filter(Boolean).join(' | ');

    } else {
      latestOtpContainer.style.display = 'none';
      latestOtpCode.textContent = '------';
      otpContext.textContent = '';
    }
  }

  function showMessageDetail(message) {
    (async () => {
      const width = 800;
      const height = 600;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const messageWindow = window.open('', '_blank', `popup=yes,width=${width},height=${height},left=${left},top=${top},titlebar=no,frame=no,toolbar=no,menubar=no,location=no,status=no,resizable=yes,chrome=no,dialog=yes`);
      if (!messageWindow) {
        showToast('Popup blocked. Please allow popups for this site.', true);
        return;
      }

      const { darkMode } = await chrome.storage.local.get(['darkMode']);

      messageWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;">
          <title>${message.subject || 'No Subject'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            :root {
              --bg-primary: #ffffff;
              --bg-secondary: #f7f7f8;
              --text-primary: #1a1a1a;
              --text-secondary: #5c5c5c;
              --border-color: #e5e7eb;
              --primary-color: #3B82F6;
              --primary-color-hover: #2563EB;
              --danger-color: #EF4444;
              --danger-color-hover: #DC2626;
              --otp-bg: #E0F2FE;
              --otp-text: #0284C7;
              --otp-border: #38BDF8;
            }
            .dark-mode {
              --bg-primary: #18181b;
              --bg-secondary: #27272a;
              --text-primary: #f4f4f5;
              --text-secondary: #a1a1aa;
              --border-color: #3f3f46;
              --primary-color: #60A5FA;
              --primary-color-hover: #3B82F6;
              --danger-color: #F87171;
              --danger-color-hover: #EF4444;
              --otp-bg: #1e293b;
              --otp-text: #7dd3fc;
              --otp-border: #38bdf8;
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              background-color: var(--bg-primary);
              color: var(--text-primary);
              display: flex;
              flex-direction: column;
              height: 100vh;
              overflow: hidden;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .main-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 20px;
              border-bottom: 1px solid var(--border-color);
              -webkit-app-region: drag;
              flex-shrink: 0;
            }
            .main-header h1 {
              font-size: 16px;
              margin: 0;
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .close-button {
              background: transparent;
              border: none;
              padding: 4px;
              cursor: pointer;
              color: var(--text-secondary);
              -webkit-app-region: no-drag;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background-color 0.2s, color 0.2s;
            }
            .close-button:hover {
              background-color: var(--bg-secondary);
              color: var(--text-primary);
            }
            .message-container {
              flex-grow: 1;
              overflow-y: auto;
              padding: 24px;
            }
            .message-header {
              border-bottom: 1px solid var(--border-color);
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .message-meta {
              font-size: 14px;
              color: var(--text-secondary);
              display: grid;
              grid-template-columns: 60px 1fr;
              gap: 8px 16px;
            }
            .meta-label {
              font-weight: 500;
              color: var(--text-primary);
            }
            .meta-value {
              word-break: break-all;
            }
            .otp-section {
              background-color: var(--otp-bg);
              padding: 20px;
              margin-bottom: 24px;
              border-radius: 12px;
              border: 1px solid var(--otp-border);
              text-align: center;
            }
            .otp-title {
              font-size: 16px;
              font-weight: 600;
              color: var(--otp-text);
              margin: 0 0 12px 0;
            }
            .otp-display {
              font-size: 32px;
              font-weight: 600;
              color: var(--text-primary);
              padding: 16px;
              letter-spacing: 4px;
              background-color: var(--bg-primary);
              border-radius: 8px;
              margin-bottom: 16px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              border: 1px solid var(--border-color);
            }
            .copy-otp-button {
              background-color: var(--primary-color);
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
              font-size: 14px;
              transition: background-color 0.2s;
            }
            .copy-otp-button:hover {
              background-color: var(--primary-color-hover);
            }
            .message-body {
              font-size: 15px;
              line-height: 1.7;
              color: var(--text-primary);
              user-select: text;
              -webkit-user-select: text;
              word-wrap: break-word;
            }
            .message-body a {
              color: var(--primary-color);
              text-decoration: none;
            }
            .message-body a:hover {
              text-decoration: underline;
            }
            ::-webkit-scrollbar {
              width: 10px;
            }
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            ::-webkit-scrollbar-thumb {
              background-color: var(--border-color);
              border-radius: 10px;
              border: 2px solid var(--bg-primary);
            }
            ::-webkit-scrollbar-thumb:hover {
              background-color: #a1a1aa;
            }
          </style>
          <script nonce="${nonce}">
            document.addEventListener('DOMContentLoaded', () => {
              if (${darkMode}) {
                document.body.classList.add('dark-mode');
              }
              const copyButton = document.querySelector('.copy-otp-button');
              if (copyButton) {
                copyButton.addEventListener('click', () => {
                  const otp = copyButton.dataset.otp;
                  navigator.clipboard.writeText(otp)
                    .then(() => {
                      copyButton.textContent = 'Copied!';
                      setTimeout(() => {
                        copyButton.textContent = 'Copy OTP';
                      }, 2000);
                    })
                    .catch(err => {
                      console.error('Failed to copy: ', err);
                    });
                });
              }
              document.querySelector('.close-button').addEventListener('click', () => window.close());
            });
          </script>
        </head>
        <body>
          <header class="main-header">
            <h1>${message.subject || 'No Subject'}</h1>
            <button class="close-button" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>
          <div class="message-container">
            <div class="message-header">
              <div class="message-meta">
                <span class="meta-label">From:</span>
                <span class="meta-value">${message.from_name || 'Unknown Sender'}</span>
                <span class="meta-label">Date:</span>
                <span class="meta-value">${new Date(message.received_at * 1000).toLocaleString()}</span>
              </div>
            </div>
            <div class="message-body">
              ${message.body_html || message.body_text || 'No content'}
            </div>
          </div>
        </body>
        </html>
      `);
      messageWindow.document.close();
    })();
  }

  function hideMessageDetail() {
    messageDetailElement.classList.remove('active');
    messageDetailContentElement.innerHTML = '';
  }

  function findLatestOtp(messages) {
    const sortedMessages = messages
      .filter(m => m.otp)
      .sort((a, b) => b.received_at - a.received_at);
    
    if (sortedMessages.length > 0) {
      const latestMessage = sortedMessages[0];
      return {
        otp: latestMessage.otp,
        from_name: latestMessage.from_name,
        received_at: latestMessage.received_at,
      };
    }
    return null;
  }

  function displayMessages(messages) {
    if (!messagesListElement) {
      updateLatestOtp(null);
      return;
    }
    const latestOtp = findLatestOtp(messages);
    updateLatestOtp(latestOtp);

    messagesListElement.innerHTML = '';
    if (messages.length === 0) {
      messagesListElement.innerHTML = '<div class="message-item">No emails found</div>';
      updateLatestOtp(null);
      return;
    }

    messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message-item';
      
      const otpBadge = message.otp ? `
        <span class="otp-badge" title="Click to copy OTP" data-otp="${message.otp}">
          OTP: ${message.otp}
        </span>
      ` : '';
      
      messageElement.innerHTML = `
        <div class="message-header">
          <span class="message-subject">${message.from_name || 'Unknown Sender'} - ${message.subject || 'No Subject'}</span>
          ${otpBadge}
        </div>
        <div class="message-meta">
          <span class="message-from">${message.from_name || 'Unknown Sender'}</span>
          <span class="message-time">${new Date(message.received_at * 1000).toLocaleString()}</span>
        </div>
      `;
      
      messageElement.addEventListener('click', () => showMessageDetail(message));
      
      const badge = messageElement.querySelector('.otp-badge');
      if (badge) {
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          const otp = badge.getAttribute('data-otp');
          copyToClipboard(otp);
        });
      }
      
      messagesListElement.appendChild(messageElement);
    });
  }

  async function checkMessages(inboxId) {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'checkEmails', 
        inboxId, 
        filters: currentFilters 
      });
      if (response.success) {
        displayMessages(response.messages);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error checking mail:', error);
      showToast('Failed to check mail', true);
    }
  }

  async function addEmailToHistory(email) {
    try {
      const { emailHistory = [] } = await chrome.storage.local.get(['emailHistory']);
      const newEntry = { email, timestamp: Date.now() };
      
      if (!emailHistory.some(entry => entry.email === email)) {
        emailHistory.push(newEntry);
        await chrome.storage.local.set({ emailHistory });
      }
    } catch (error) {
      console.error('Error updating email history:', error);
    }
  }

  async function updateEmailHistory() {
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      
      if (inboxes.length === 0) {
        emailHistoryList.innerHTML = '<div class="email-history-item">No previous email addresses</div>';
        return;
      }

      inboxes.sort((a, b) => b.createdAt - a.createdAt);
      
      const isFullView = historyViewActive;
      const emailsToShow = isFullView ? inboxes : inboxes.slice(0, 5);

      emailHistoryList.innerHTML = emailsToShow
        .map(inbox => {
          const timeLeft = inbox.expiresAt ? calculateTimeLeft(inbox.expiresAt) : null;
          const expiryWarning = timeLeft && timeLeft <= 3600 ? ' expiry-warning' : '';
          const expiryText = timeLeft ? `Expires in ${formatTimeLeft(timeLeft)}` : '';
          
          return `
            <div class="email-history-item${isFullView ? ' full-view' : ''}${expiryWarning}">
              <span class="email-history-address">${inbox.address}</span>
              <span class="email-history-timestamp">${new Date(inbox.createdAt).toLocaleString()}</span>
              ${expiryText ? `<span class="email-history-expiry">${expiryText}</span>` : ''}
            </div>
          `;
        })
        .join('');
        
      if (!isFullView && inboxes.length > 5) {
        const viewAllLink = document.createElement('div');
        viewAllLink.className = 'view-all-link';
        viewAllLink.textContent = `View all (${inboxes.length})`;
        viewAllLink.addEventListener('click', () => {
          historyButton.click();
        });
        emailHistoryList.appendChild(viewAllLink);
      }

    } catch (error) {
      console.error('Error loading email history:', error);
      emailHistoryList.innerHTML = '<div class="email-history-item">Error loading email history</div>';
    }
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

  async function deleteInbox(inboxId) {
    try {
      const { inboxes = [], activeInboxId } = await chrome.storage.local.get(['inboxes', 'activeInboxId']);
      const updatedInboxes = inboxes.filter(inbox => inbox.id !== inboxId);
      await chrome.storage.local.set({ inboxes: updatedInboxes });
      
      if (activeInboxId === inboxId) {
        const newActiveInbox = updatedInboxes.length > 0 ? updatedInboxes[0].id : null;
        await chrome.storage.local.set({ activeInboxId: newActiveInbox });
      }
      
      await updateInboxDisplay();
      if (updatedInboxes.length > 0 && activeInboxId === inboxId) {
        checkMessages(updatedInboxes[0].id);
      } else if (updatedInboxes.length === 0) {
        dropdownSelected.textContent = 'Select an inbox';
        copyEmailButton.style.display = 'none';
        messagesListElement.innerHTML = '<div class="message-item">No mail yet</div>';
        updateLatestOtp(null);
      }
      showToast('Inbox deleted');
    } catch (error) {
      console.error('Error deleting inbox:', error);
      showToast('Failed to delete inbox', true);
    }
  }

  async function updateInboxDisplay() {
    try {
      const { inboxes = [], activeInboxId: currentActiveInboxId } = await chrome.storage.local.get(['inboxes', 'activeInboxId']);
      
      const now = Date.now();
      const validInboxes = inboxes.filter(inbox => inbox.expiresAt && inbox.expiresAt > now);
      let activeInboxId = currentActiveInboxId;

      if (validInboxes.length === 0) {
        const newInboxResponse = await chrome.runtime.sendMessage({ type: 'createInbox' });
        if (newInboxResponse.success) {
          const newInbox = newInboxResponse.inbox;
          validInboxes.push(newInbox);
          
          const allStoredInboxes = [...validInboxes];
          await chrome.storage.local.set({ inboxes: allStoredInboxes, activeInboxId: newInbox.id });
          activeInboxId = newInbox.id;
          await addEmailToHistory(newInbox.address);
        } else {
          throw new Error(newInboxResponse.error);
        }
      }

      dropdownList.innerHTML = '';

      let activeInbox = validInboxes.find(inbox => inbox.id === activeInboxId);
      if (!activeInbox) {
        activeInboxId = validInboxes.length > 0 ? validInboxes[0].id : null;
        await chrome.storage.local.set({ activeInboxId });
        activeInbox = validInboxes.length > 0 ? validInboxes[0] : null;
      }

      validInboxes.forEach(inbox => {
        const li = document.createElement('li');
        li.setAttribute('data-id', inbox.id);
        const timeLeft = inbox.expiresAt ? calculateTimeLeft(inbox.expiresAt) : null;
        const expiryText = timeLeft ? `Expires in ${formatTimeLeft(timeLeft)}` : '';
        li.innerHTML = `
          <div class="inbox-item-details">
            <span class="inbox-address">${inbox.address}</span>
            ${expiryText ? `<span class="inbox-expiry">${expiryText}</span>` : ''}
          </div>
          <button class="delete-button" title="Delete Inbox">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-12 0v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6"/>
            </svg>
          </button>
        `;
        if (inbox.id === activeInboxId) {
          dropdownSelected.textContent = inbox.address;
          copyEmailButton.style.display = 'inline-flex';
        }
        dropdownList.appendChild(li);

        const deleteButton = li.querySelector('.delete-button');
        deleteButton.addEventListener('click', async (e) => {
          e.stopPropagation();
          await deleteInbox(inbox.id);
        });

        li.addEventListener('click', async () => {
          await chrome.storage.local.set({ activeInboxId: inbox.id });
          dropdownSelected.textContent = inbox.address;
          copyEmailButton.style.display = 'inline-flex';
          dropdownList.style.display = 'none';
          await checkMessages(inbox.id);
        });
      });

      if (activeInbox) {
        dropdownSelected.textContent = activeInbox.address;
        copyEmailButton.style.display = 'inline-flex';
        await checkMessages(activeInbox.id);
      } else {
        dropdownSelected.textContent = 'Select an inbox';
        copyEmailButton.style.display = 'none';
      }
    } catch (error) {
      console.error('Error updating inbox display:', error);
      showToast('Failed to load inboxes', true);
    }
  }

  async function initializeInboxes() {
    await updateInboxDisplay();
    await updateEmailHistory();
    await updateAnalyticsDashboard();
    await initializeNotifications();
    await loadPasswordSettings();
    await loadNameSettings();
    await loadAutoCopySettings();
  }

  inboxDropdown.addEventListener('click', () => {
    dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
  });

  addInboxButton.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'createInbox' });
      if (response.success) {
        await updateInboxDisplay();
        await checkMessages(response.inbox.id);
        await updateAnalyticsDashboard();
        showToast('New inbox created');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error creating inbox:', error);
      showToast('Failed to create inbox', true);
    }
  });

  refreshMessagesButton.addEventListener('click', async () => {
    try {
      const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
      if (activeInboxId) {
        await checkMessages(activeInboxId);
        await updateAnalyticsDashboard();
        showToast('Messages refreshed');
      } else {
        showToast('No inbox selected', true);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
      showToast('Failed to refresh messages', true);
    }
  });

  // Debounce function to limit rapid search updates
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedCheckMessages = debounce(async (inboxId) => {
    await checkMessages(inboxId);
  }, 300);

  searchMessagesInput.addEventListener('input', async () => {
    currentFilters.searchQuery = searchMessagesInput.value.trim();
    const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
    if (activeInboxId) {
      debouncedCheckMessages(activeInboxId);
    }
  });

  otpFilterCheckbox.addEventListener('change', async () => {
    currentFilters.hasOTP = otpFilterCheckbox.checked;
    const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
    if (activeInboxId) {
      await checkMessages(activeInboxId);
    }
  });

  startSignupButton.addEventListener('click', async () => {
    try {
      const { activeInboxId, inboxes = [] } = await chrome.storage.local.get(['activeInboxId', 'inboxes']);
      if (!activeInboxId) {
        showToast('No inbox selected', true);
        return;
      }
      const activeInbox = inboxes.find(inbox => inbox.id === activeInboxId);
      if (!activeInbox) {
        showToast('Invalid inbox', true);
        return;
      }
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'startSignup', 
          email: activeInbox.address 
        });
        showToast('Autofill started');
      } else {
        showToast('No active tab found', true);
      }
    } catch (error) {
      console.error('Error starting signup:', error);
      showToast('Failed to start autofill', true);
    }
  });

  backButton.addEventListener('click', () => {
    hideMessageDetail();
  });

  async function updateSavedLoginInfo() {
    try {
      const { loginInfo = {} } = await chrome.storage.local.get(['loginInfo']);
      
      if (Object.keys(loginInfo).length === 0) {
        savedLoginInfo.innerHTML = '<div class="login-info-item">No saved login information</div>';
        return;
      }

      const sortedDomains = Object.keys(loginInfo).sort();
      const isFullView = loginInfoViewActive;
      const domainsToShow = isFullView ? sortedDomains : sortedDomains.slice(0, 3);

      savedLoginInfo.innerHTML = domainsToShow
        .map(domain => {
          const entries = loginInfo[domain] || [];
          const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
          
          const credentialsHtml = sortedEntries
            .map(entry => `
              <div class="login-info-entry">
                <div class="login-info-timestamp">${new Date(entry.timestamp).toLocaleString()}</div>
                <div class="login-info-credentials">
                  ${entry.username ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Username:</span>
                      <span class="login-info-value">${entry.username}</span>
                      <button class="login-info-copy" data-value="${entry.username}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.email ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Email:</span>
                      <span class="login-info-value">${entry.email}</span>
                      <button class="login-info-copy" data-value="${entry.email}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.phone ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Phone:</span>
                      <span class="login-info-value">${entry.phone}</span>
                      <button class="login-info-copy" data-value="${entry.phone}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.website ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Website:</span>
                      <span class="login-info-value">${entry.website}</span>
                      <button class="login-info-copy" data-value="${entry.website}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.password ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Password:</span>
                      <span class="login-info-value">${entry.password}</span>
                      <button class="login-info-copy" data-value="${entry.password}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `)
            .join('');

          return `
            <div class="login-info-item">
              <div class="login-info-domain">${domain}</div>
              ${credentialsHtml}
            </div>
          `;
        })
        .join('');

      if (!isFullView && sortedDomains.length > 3) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'view-all-button';
        viewAllButton.textContent = `View all (${sortedDomains.length})`;
        viewAllButton.addEventListener('click', () => {
          loginInfoButton.click();
        });
        savedLoginInfo.appendChild(viewAllButton);
      }

      const copyButtons = savedLoginInfo.querySelectorAll('.login-info-copy');
      copyButtons.forEach(button => {
        button.addEventListener('click', () => {
          const value = button.getAttribute('data-value');
          copyToClipboard(value);
        });
      });
    } catch (error) {
      console.error('Error loading login info:', error);
      savedLoginInfo.innerHTML = '<div class="login-info-item">Error loading login information</div>';
    }
  }

  async function fetchAnalyticsWithRetry(maxRetries = 3, delay = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'getAnalytics' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });

        if (!response) {
          throw new Error('No response received from background script');
        }

        if (response.success && response.analytics) {
          console.log('Analytics fetched successfully:', response.analytics);
          return response.analytics;
        } else {
          throw new Error(response.error || 'No analytics data received');
        }
      } catch (error) {
        console.warn(`Analytics fetch attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async function updateAnalyticsDashboard() {
    try {
      const analytics = await fetchAnalyticsWithRetry();
      
      const createdAt = analytics.createdAt ? new Date(analytics.createdAt).toLocaleDateString() : 'N/A';
      const inboxesCreated = analytics.inboxesCreated || 0;
      const emailsReceived = analytics.emailsReceived || 0;
      const otpsDetected = analytics.otpsDetected || 0;
      const notificationsSent = analytics.notificationsSent || 0;

      analyticsDashboard.innerHTML = `
        <div class="analytics-item">
          <span class="analytics-label">Tracking Since:</span>
          <span class="analytics-value">${createdAt}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Inboxes Created:</span>
          <span class="analytics-value">${inboxesCreated}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Emails Received:</span>
          <span class="analytics-value">${emailsReceived}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">OTPs Detected:</span>
          <span class="analytics-value">${otpsDetected}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Notifications Sent:</span>
          <span class="analytics-value">${notificationsSent}</span>
        </div>
      `;
    } catch (error) {
      console.error('Error loading analytics:', error);
      analyticsDashboard.innerHTML = '<div class="analytics-item">Failed to load analytics. Please try again.</div>';
      showToast('Failed to load analytics', true);
    }
  }

  async function loadPasswordSettings() {
    const { passwordSettings = {} } = await chrome.storage.local.get('passwordSettings');
    const { useCustom = false, customPassword = '' } = passwordSettings;
    
    useCustomPasswordToggle.checked = useCustom;
    customPasswordInput.value = customPassword;
    
    if (useCustom) {
      customPasswordContainer.classList.add('visible');
    } else {
      customPasswordContainer.classList.remove('visible');
    }
  }

  useCustomPasswordToggle.addEventListener('change', async (event) => {
    const useCustom = event.target.checked;
    if (useCustom) {
      customPasswordContainer.classList.add('visible');
    } else {
      customPasswordContainer.classList.remove('visible');
    }
    const { passwordSettings = {} } = await chrome.storage.local.get('passwordSettings');
    await chrome.storage.local.set({ 
      passwordSettings: { ...passwordSettings, useCustom }
    });
  });

  customPasswordInput.addEventListener('input', debounce(async (event) => {
    const customPassword = event.target.value;
    const { passwordSettings = {} } = await chrome.storage.local.get('passwordSettings');
    await chrome.storage.local.set({ 
      passwordSettings: { ...passwordSettings, customPassword }
    });
  }, 300));

  async function loadNameSettings() {
    const { nameSettings = {} } = await chrome.storage.local.get('nameSettings');
    const { useCustom = false, firstName = '', lastName = '' } = nameSettings;
    
    useCustomNameToggle.checked = useCustom;
    customFirstNameInput.value = firstName;
    customLastNameInput.value = lastName;
    
    if (useCustom) {
      customNameContainer.classList.add('visible');
    } else {
      customNameContainer.classList.remove('visible');
    }
  }

  useCustomNameToggle.addEventListener('change', async (event) => {
    const useCustom = event.target.checked;
    if (useCustom) {
      customNameContainer.classList.add('visible');
    } else {
      customNameContainer.classList.remove('visible');
    }
    const { nameSettings = {} } = await chrome.storage.local.get('nameSettings');
    await chrome.storage.local.set({ 
      nameSettings: { ...nameSettings, useCustom }
    });
  });

  customFirstNameInput.addEventListener('input', debounce(async (event) => {
    const firstName = event.target.value;
    const { nameSettings = {} } = await chrome.storage.local.get('nameSettings');
    await chrome.storage.local.set({ 
      nameSettings: { ...nameSettings, firstName }
    });
  }, 300));

  customLastNameInput.addEventListener('input', debounce(async (event) => {
    const lastName = event.target.value;
    const { nameSettings = {} } = await chrome.storage.local.get('nameSettings');
    await chrome.storage.local.set({ 
      nameSettings: { ...nameSettings, lastName }
    });
  }, 300));

  async function loadAutoCopySettings() {
    const { autoCopy = false } = await chrome.storage.local.get('autoCopy');
    autoCopyToggle.checked = autoCopy;
  }

  autoCopyToggle.addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    await chrome.storage.local.set({ autoCopy: enabled });
    showToast(`Auto-copy credentials ${enabled ? 'enabled' : 'disabled'}`);
  });

  await initializeInboxes();
});

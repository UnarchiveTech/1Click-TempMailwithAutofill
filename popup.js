document.addEventListener('DOMContentLoaded', async () => {
  const tempEmailElement = document.getElementById('tempEmail');
  const startSignupButton = document.getElementById('startSignup');
  const refreshEmailButton = document.getElementById('refreshEmail');
  const themeToggleButton = document.getElementById('themeToggle');
  const refreshMessagesButton = document.getElementById('refreshMessages');
  const statusElement = document.getElementById('status');
  const messagesListElement = document.getElementById('messagesList');
  const messageDetailElement = document.getElementById('messageDetail');
  const messageDetailContentElement = document.getElementById('messageDetailContent');
  const backButton = document.getElementById('backButton');
  const latestOtpContainer = document.getElementById('latestOtpContainer');
  const latestOtpCode = document.getElementById('latestOtpCode');
  const copyOtpButton = document.getElementById('copyOtpButton');
  const historyButton = document.createElement('button');
  historyButton.id = 'historyButton';
  historyButton.className = 'icon-button';
  historyButton.title = 'View Email History';
  historyButton.innerHTML = '<img src="icons/history.svg" alt="History" width="16" height="16">';
  document.querySelector('#emailContainer').appendChild(historyButton);

  // Add click handler for history button
  historyButton.addEventListener('click', () => {
    chrome.windows.create({
      url: 'history.html',
      type: 'popup',
      width: 600,
      height: 600
    });
  });

  // Theme toggle functionality
  let isDarkMode = false;
  themeToggleButton.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
    document.body.style.color = isDarkMode ? '#ffffff' : '#000000';
    const elements = document.querySelectorAll('.temp-email, .message-item, .message-content');
    elements.forEach(el => {
      el.style.backgroundColor = isDarkMode ? '#2d2d2d' : '#f5f5f5';
    });
    
    // Update OTP container theme
    if (latestOtpContainer.style.display !== 'none') {
      latestOtpContainer.style.backgroundColor = isDarkMode ? '#0d47a1' : '#e3f2fd';
      latestOtpContainer.style.borderColor = isDarkMode ? '#90caf9' : '#2196F3';
      document.querySelector('.latest-otp-display').style.backgroundColor = isDarkMode ? '#1a237e' : 'white';
      document.querySelector('.latest-otp-title').style.color = isDarkMode ? '#90caf9' : '#1565C0';
      latestOtpCode.style.color = isDarkMode ? '#e3f2fd' : '#1565C0';
    }
  });

  // Function to update status
  function updateStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.className = `status ${isError ? 'error' : 'success'}`;
  }

  // Function to copy text to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      updateStatus('OTP copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
      updateStatus('Failed to copy OTP', true);
    }
  }

  // Add click handler for copy OTP button
  copyOtpButton.addEventListener('click', () => {
    const otpText = latestOtpCode.textContent;
    if (otpText && otpText !== '------') {
      copyToClipboard(otpText);
    }
  });

  // Function to update latest OTP display
  function updateLatestOtp(otp) {
    if (otp) {
      latestOtpContainer.style.display = 'block';
      latestOtpCode.textContent = otp;
      
      // Apply theme if dark mode is active
      if (isDarkMode) {
        latestOtpContainer.style.backgroundColor = '#0d47a1';
        latestOtpContainer.style.borderColor = '#90caf9';
        document.querySelector('.latest-otp-display').style.backgroundColor = '#1a237e';
        document.querySelector('.latest-otp-title').style.color = '#90caf9';
        latestOtpCode.style.color = '#e3f2fd';
      } else {
        // Ensure light mode styling is applied
        latestOtpContainer.style.backgroundColor = '#e3f2fd';
        latestOtpContainer.style.borderColor = '#2196F3';
        document.querySelector('.latest-otp-display').style.backgroundColor = 'white';
        document.querySelector('.latest-otp-title').style.color = '#1565C0';
        latestOtpCode.style.color = '#1565C0';
      }
    } else {
      latestOtpContainer.style.display = 'none';
      latestOtpCode.textContent = '------';
    }
  }

  // Function to show message detail
  function showMessageDetail(message) {
    const width = 800;
    const height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    // Generate a more secure nonce with sufficient entropy
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  
    const messageWindow = window.open('', '_blank', `popup=yes,width=${width},height=${height},left=${left},top=${top},titlebar=no,frame=no,toolbar=no,menubar=no,location=no,status=no,resizable=no,chrome=no,dialog=yes`);
    if (!messageWindow) {
      updateStatus('Popup blocked. Please allow popups for this site.', true);
      return;
    }
  
    const otpSection = message.otp ? `
      <div class="otp-section">
        <h2>OTP Code Detected</h2>
        <div class="otp-display">${message.otp}</div>
        <button class="copy-otp-button" data-otp="${message.otp}">Copy OTP</button>
      </div>
    ` : '';
  
    messageWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'">
        <title>${message.subject || 'No Subject'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            height: 100vh;
            box-sizing: border-box;
            overflow: hidden;
            user-select: none;
            -webkit-user-select: none;
            border: none;
            -webkit-app-region: drag;
          }
          .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #ff4444;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            line-height: 1;
            padding: 0;
            z-index: 1000;
            -webkit-app-region: no-drag;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }
          .header {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
            position: relative;
          }
          .message-time {
            color: #666;
            font-size: 0.9em;
            margin: 5px 0;
          }
          .message-content {
            margin-top: 20px;
            overflow-y: auto;
            max-height: calc(100vh - 120px);
            user-select: text;
            -webkit-user-select: text;
          }
          .close-button {
            position: absolute;
            top: -10px;
            right: -10px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #ff4444;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            line-height: 1;
            padding: 0;
            z-index: 1000;
          }
          .close-button:hover {
            background: #ff0000;
          }
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          .otp-section {
            background: #f0f8ff;
            padding: 15px;
            margin: 10px 0 20px 0;
            border-radius: 8px;
            border: 2px solid #4a90e2;
            text-align: center;
          }
          .otp-display {
            font-size: 28px;
            font-weight: bold;
            color: #4a90e2;
            text-align: center;
            padding: 15px;
            letter-spacing: 3px;
            background: white;
            border-radius: 4px;
            margin: 10px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .copy-otp-button {
            background: #4a90e2;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
          }
          .copy-otp-button:hover {
            background: #3a7bc8;
          }
          .otp-badge {
            background: #4a90e2;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 8px;
          }
        </style>
        <script nonce="${nonce}">
          document.addEventListener('DOMContentLoaded', () => {
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
                    alert('Failed to copy OTP');
                  });
              });
            }

            const closeButton = document.querySelector('.close-button');
            if (closeButton) {
              closeButton.addEventListener('click', () => window.close());
            }
          });
        </script>
      </head>
      <body>
        ${otpSection}
        <div class="message-content">
          <h3>${message.subject || 'No Subject'}</h3>
          <p><strong>From:</strong> ${message.from_name || 'Unknown Sender'}</p>
          <p><strong>Date:</strong> ${new Date(message.received_at * 1000).toLocaleString()}</p>
          <div class="message-body">${message.body_html || message.body_text || 'No content'}</div>
        </div>
        <button class="close-button">×</button>
      </body>
      </html>
    `);
    messageWindow.document.close();
  }

  // Function to hide message detail
  function hideMessageDetail() {
    messageDetailElement.classList.remove('active');
    messageDetailContentElement.innerHTML = '';
  }

  // Function to find latest OTP from messages
  function findLatestOtp(messages) {
    if (!messages || messages.length === 0) return null;
    
    // Sort messages by received time, newest first
    const sortedMessages = [...messages].sort((a, b) => b.received_at - a.received_at);
    
    // Find the first message with an OTP
    const messageWithOtp = sortedMessages.find(message => {
      // Check if message has an OTP property and it's not empty
      return message.otp && message.otp.trim().length > 0;
    });
    
    // Return the OTP if found, otherwise null
    return messageWithOtp ? messageWithOtp.otp : null;
  }

  // Function to display messages
  function displayMessages(messages) {
    messagesListElement.innerHTML = '';
    if (messages.length === 0) {
      messagesListElement.innerHTML = '<div class="message-item">No mail yet</div>';
      updateLatestOtp(null); // Hide OTP container if no messages
      return;
    }
  
    // Find and display latest OTP
    const latestOtp = findLatestOtp(messages);
    if (latestOtp) {
      updateLatestOtp(latestOtp); // This will show the OTP container if an OTP is found
    }
  
    // Sort messages by received time, newest first
    const sortedMessages = [...messages].sort((a, b) => b.received_at - a.received_at);
  
    sortedMessages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message-item';
      
      // Create a more prominent OTP badge if OTP exists
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
      
      // Add click handler for the message
      messageElement.addEventListener('click', () => showMessageDetail(message));
      
      // Add click handler for OTP badge to copy OTP
      const badge = messageElement.querySelector('.otp-badge');
      if (badge) {
        badge.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering the message click
          const otp = badge.getAttribute('data-otp');
          copyToClipboard(otp);
        });
      }
      
      messagesListElement.appendChild(messageElement);
    });
  }

  // Function to check for new messages
  async function checkMessages() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'checkEmails' });
      if (response.success) {
        displayMessages(response.messages);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error checking mail:', error);
      updateStatus('Failed to check mail', true);
    }
  }

  // Function to add email to history
  async function addEmailToHistory(email) {
    try {
      const { emailHistory = [] } = await chrome.storage.local.get(['emailHistory']);
      const newEntry = { email, timestamp: Date.now() };
      
      // Add new email to history, avoiding duplicates
      if (!emailHistory.some(entry => entry.email === email)) {
        emailHistory.push(newEntry);
        await chrome.storage.local.set({ emailHistory });
      }
    } catch (error) {
      console.error('Error updating email history:', error);
    }
  }

  // Function to initialize temporary email
  async function updateEmailHistory() {
      const emailHistoryList = document.getElementById('emailHistoryList');
      try {
        const { emailHistory = [] } = await chrome.storage.local.get(['emailHistory']);
        
        if (emailHistory.length === 0) {
          emailHistoryList.innerHTML = '<div class="email-history-item">No previous email addresses</div>';
          return;
        }
  
        // Sort emails by timestamp, most recent first
        emailHistory.sort((a, b) => b.timestamp - a.timestamp);
  
        // Display emails
        emailHistoryList.innerHTML = emailHistory
          .map(entry => `
            <div class="email-history-item">
              <span class="email-history-address">${entry.email}</span>
              <span class="email-history-timestamp">${new Date(entry.timestamp).toLocaleString()}</span>
            </div>
          `)
          .join('');
  
      } catch (error) {
        console.error('Error loading email history:', error);
        emailHistoryList.innerHTML = '<div class="email-history-item">Error loading email history</div>';
      }
    }
  
    async function initializeEmail() {
      try {
        // First check if we already have an email stored
        const { tempEmail } = await chrome.storage.local.get(['tempEmail']);
        if (tempEmail) {
          tempEmailElement.textContent = tempEmail;
          // Start checking for messages
          checkMessages();
          // Update email history
          updateEmailHistory();
          // Set up periodic message checking
          setInterval(checkMessages, 10000); // Check every 10 seconds
          return;
        }

      // If no email exists, request a new inbox from the background script
      const response = await chrome.runtime.sendMessage({ type: 'createInbox' });
      if (response.success) {
        tempEmailElement.textContent = response.email;
        await addEmailToHistory(response.email);
        // Start checking for messages
        checkMessages();
        // Set up periodic message checking
        setInterval(checkMessages, 10000); // Check every 10 seconds
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      tempEmailElement.textContent = 'Error generating email';
      updateStatus('Failed to generate temporary email', true);
    }
  }

  // Initialize email on load
  await initializeEmail();

  // Handle refresh email button click
  refreshEmailButton.addEventListener('click', async () => {
    tempEmailElement.textContent = 'Generating...';
    try {
      // Force creation of a new inbox instead of checking storage
      const response = await chrome.runtime.sendMessage({ type: 'createInbox', forceNew: true });
      if (response.success) {
        tempEmailElement.textContent = response.email;
        await addEmailToHistory(response.email);
        updateStatus('Email refreshed successfully');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      tempEmailElement.textContent = 'Error refreshing email';
      updateStatus('Failed to refresh temporary email: ' + error.message, true);
    }
  });

  // Handle refresh messages button click
  refreshMessagesButton.addEventListener('click', async () => {
    await checkMessages();
    updateStatus('Mail refreshed successfully');
  });

  // Handle back button click
  backButton.addEventListener('click', hideMessageDetail);

  // Handle start signup button click
  startSignupButton.addEventListener('click', async () => {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Inject content script with error handling
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (err) {
        // If script is already injected, this error can be ignored
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }

      // Send message to content script with timeout
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out')), 5000)
      );

      const messagePromise = chrome.tabs.sendMessage(tab.id, { action: 'startSignup' });
      const response = await Promise.race([messagePromise, timeout]);

      if (!response) {
        throw new Error('No response received from content script');
      }

      updateStatus('Signup process started successfully');
    } catch (error) {
      if (error.message.includes('Connection timed out')) {
        updateStatus('Connection timed out. Please refresh the page and try again', true);
      } else if (error.message.includes('could not establish connection')) {
        updateStatus('Please refresh the page and try again', true);
      } else {
        updateStatus(`Failed to start signup process: ${error.message}`, true);
      }
      console.error('Error starting signup:', error);
    }
  });
});
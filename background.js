const API_BASE_URL = 'https://burner.kiwi/api/v2';

chrome.runtime.onInstalled.addListener(() => {
  console.log('OneClickAutofill with TempMail extension installed');
  initializeAnalytics();
  setupPeriodicEmailCheck();
});

// Initialize analytics storage
async function initializeAnalytics() {
  try {
    const { analytics = {} } = await chrome.storage.local.get(['analytics']);
    if (!analytics.createdAt) {
      analytics.createdAt = Date.now();
      analytics.inboxesCreated = 0;
      analytics.emailsReceived = 0;
      analytics.otpsDetected = 0;
      analytics.notificationsSent = 0;
      await chrome.storage.local.set({ analytics });
      console.log('Analytics initialized:', analytics);
    }
  } catch (error) {
    console.error('Error initializing analytics:', error);
  }
}

// Setup periodic email checking using Chrome Alarms
function setupPeriodicEmailCheck() {
  chrome.alarms.create('checkEmails', {
    periodInMinutes: 0.5 // Check every 30 seconds
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'checkEmails') {
      try {
        const { inboxes = [], notificationSettings = { enabled: true } } = await chrome.storage.local.get(['inboxes', 'notificationSettings']);
        if (!notificationSettings.enabled || inboxes.length === 0) {
          console.log('Notifications disabled or no inboxes to check');
          return;
        }

        for (const inbox of inboxes) {
          await checkNewEmails(inbox.id, {});
        }
      } catch (error) {
        console.error('Error in periodic email check:', error);
      }
    }
  });
}

// Create a new temporary email inbox
async function createInbox() {
  try {
    const response = await fetch(`${API_BASE_URL}/inbox`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Failed to create inbox');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errors?.msg || 'Failed to create inbox');
    }

    const { email, token } = data.result;
    const inbox = {
      id: email.id,
      address: email.address,
      token,
      createdAt: Date.now()
    };

    // Store the new inbox
    const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
    inboxes.push(inbox);
    await chrome.storage.local.set({ inboxes });

    // Update analytics
    const { analytics = {} } = await chrome.storage.local.get(['analytics']);
    analytics.inboxesCreated = (analytics.inboxesCreated || 0) + 1;
    await chrome.storage.local.set({ analytics });

    return inbox;
  } catch (error) {
    console.error('Error creating inbox:', error);
    throw error;
  }
}

// Function to extract OTP from email content
function extractOTP(subject, body) {
  if (!subject && !body) {
    console.log('No subject or body provided');
    return null;
  }

  let content = '';
  if (subject) {
    content += subject + ' ';
  }
  if (body) {
    content += body;
  }

  console.log('Checking content for OTP:', content.substring(0, 100) + '...');

  const normalizedContent = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return extractOTPFromText(normalizedContent);
}

// Helper function to extract OTP from text
function extractOTPFromText(content) {
  const patterns = [
    /(?:OTP|one[- ]?time[- ]?(?:password|code|pin)|verification[- ]?code|security[- ]?code|auth(?:entication)?[- ]?code)[^0-9]*?([0-9]{4,8})/i,
    /your(?:\s+[a-z]+)*\s+(?:code|OTP|pin)\s+(?:is|:)\s*([0-9]{4,8})/i,
    /(?:use|enter|verify with|code)[^0-9]*?([0-9]{3,4}[- ]?[0-9]{3,4})/i,
    /\b(?:code|pin|otp)\s*[:=]\s*([0-9]{4,8})\b/i,
    /\b([0-9]{4,8})\b(?=(?:[^0-9]|$).*?(?:valid|expires|verify|authentication|code|otp))/i,
    /\b([0-9]{3}[- ][0-9]{3}|[0-9]{4}[- ][0-9]{4}|[0-9]{4}[- ][0-9]{3})\b/,
    /\b([0-9]{4,8})\b(?![0-9])/
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches && matches[1]) {
      const otp = matches[1].replace(/[- ]/g, '');
      if (/^[0-9]{4,8}$/.test(otp)) {
        console.log('Valid OTP found:', otp);
        return otp;
      }
    }
  }

  const numbers = content.match(/\b\d{4,8}\b/g) || [];
  for (const num of numbers) {
    const context = content.substring(
      Math.max(0, content.indexOf(num) - 50),
      Math.min(content.length, content.indexOf(num) + 50)
    ).toLowerCase();

    if (context.includes('otp') || 
        context.includes('code') || 
        context.includes('pin') || 
        context.includes('verify') || 
        context.includes('authentication')) {
      console.log('OTP found in context:', num);
      return num;
    }
  }

  console.log('No OTP found in content');
  return null;
}

// Check for new messages in a specific inbox
async function checkNewEmails(inboxId, filters = {}) {
  try {
    const { inboxes = [], notificationSettings = { enabled: true } } = await chrome.storage.local.get(['inboxes', 'notificationSettings']);
    const inbox = inboxes.find(i => i.id === inboxId);
    if (!inbox || !inbox.token) {
      throw new Error('Inbox or token not found');
    }

    const response = await fetch(`${API_BASE_URL}/inbox/${inboxId}/messages`, {
      headers: {
        'X-Burner-Key': inbox.token
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errors?.msg || 'Failed to fetch messages');
    }

    let messages = data.result || [];
    console.log(`Fetched ${messages.length} messages`);

    // Check for new messages by comparing with stored messages
    const { lastMessageTimestamps = {} } = await chrome.storage.local.get(['lastMessageTimestamps']);
    const lastTimestamp = lastMessageTimestamps[inboxId] || 0;
    const newMessages = messages.filter(msg => msg.received_at * 1000 > lastTimestamp);

    // Update last message timestamp
    if (messages.length > 0) {
      lastMessageTimestamps[inboxId] = Math.max(...messages.map(msg => msg.received_at * 1000));
      await chrome.storage.local.set({ lastMessageTimestamps });
    }

    // Send notifications for new messages
    if (notificationSettings.enabled && newMessages.length > 0) {
      newMessages.forEach(msg => {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: `New Email in ${inbox.address}`,
          message: `${msg.from_name || 'Unknown Sender'}: ${msg.subject || 'No Subject'}`,
          priority: 0
        });
      });

      // Update analytics for notifications sent
      const { analytics = {} } = await chrome.storage.local.get(['analytics']);
      analytics.notificationsSent = (analytics.notificationsSent || 0) + newMessages.length;
      await chrome.storage.local.set({ analytics });
    }

    // Update analytics for emails received
    const { analytics = {} } = await chrome.storage.local.get(['analytics']);
    analytics.emailsReceived = (analytics.emailsReceived || 0) + messages.length;
    
    // Apply filters
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      console.log('Applying search query:', query);
      messages = messages.filter(msg => {
        const subjectMatch = msg.subject && msg.subject.toLowerCase().includes(query);
        const fromMatch = msg.from_name && msg.from_name.toLowerCase().includes(query);
        const bodyMatch = msg.body_plain && msg.body_plain.toLowerCase().includes(query);
        return subjectMatch || fromMatch || bodyMatch;
      });
      console.log(`After search filter: ${messages.length} messages`);
    }

    // Process messages for OTP and apply OTP filter
    let otpCount = 0;
    messages = messages.map(msg => {
      const otp = extractOTP(msg.subject || '', msg.body_plain || '');
      if (otp) otpCount++;
      return {
        ...msg,
        otp
      };
    });

    // Update OTP analytics
    analytics.otpsDetected = (analytics.otpsDetected || 0) + otpCount;
    await chrome.storage.local.set({ analytics });

    if (filters.hasOTP) {
      console.log('Applying OTP filter');
      messages = messages.filter(msg => msg.otp && msg.otp.trim().length > 0);
      console.log(`After OTP filter: ${messages.length} messages`);
    }

    return messages;
  } catch (error) {
    console.error('Error checking emails:', error);
    throw error;
  }
}

// Delete an inbox
async function deleteInbox(inboxId) {
  try {
    const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
    const updatedInboxes = inboxes.filter(i => i.id !== inboxId);
    await chrome.storage.local.set({ inboxes: updatedInboxes });
    return { success: true };
  } catch (error) {
    console.error('Error deleting inbox:', error);
    return { success: false, error: error.message };
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.type === 'createInbox') {
    createInbox()
      .then(inbox => {
        console.log('Inbox created:', inbox);
        sendResponse({ success: true, inbox });
      })
      .catch(error => {
        console.error('Create inbox failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }

  if (message.type === 'checkEmails') {
    checkNewEmails(message.inboxId, message.filters)
      .then(messages => {
        console.log('Emails fetched:', messages.length);
        sendResponse({ success: true, messages });
      })
      .catch(error => {
        console.error('Check emails failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'deleteInbox') {
    deleteInbox(message.inboxId)
      .then(result => {
        console.log('Delete inbox result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Delete inbox failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'getInboxes') {
    chrome.storage.local.get(['inboxes'])
      .then(({ inboxes = [] }) => {
        console.log('Inboxes retrieved:', inboxes);
        sendResponse({ success: true, inboxes });
      })
      .catch(error => {
        console.error('Get inboxes failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'getAnalytics') {
    chrome.storage.local.get(['analytics'])
      .then(({ analytics = {} }) => {
        console.log('Analytics retrieved:', analytics);
        sendResponse({ success: true, analytics });
      })
      .catch(error => {
        console.error('Get analytics failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // Handle unknown message types
  console.warn('Unknown message type:', message.type);
  sendResponse({ success: false, error: 'Unknown message type' });
  return false;
});
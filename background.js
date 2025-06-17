const API_BASE_URL = 'https://burner.kiwi/api/v2';

chrome.runtime.onInstalled.addListener(() => {
  console.log('1Click: Temp Mail with Autofill extension installed');
  initializeAnalytics();
  setupPeriodicEmailCheck();
  setupInboxExpiryCheck();
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

// Setup periodic inbox expiry checking
function setupInboxExpiryCheck() {
  chrome.alarms.create('checkInboxExpiry', {
    periodInMinutes: 1 // Check every 1 minute
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'checkInboxExpiry') {
      try {
        const { inboxes = [], notificationSettings = { enabled: true } } = await chrome.storage.local.get(['inboxes', 'notificationSettings']);
        if (!notificationSettings.enabled || inboxes.length === 0) {
          console.log('Notifications disabled or no inboxes to check for expiry');
          return;
        }

        const now = Date.now();
        for (const inbox of inboxes) {
          if (inbox.expiresAt && inbox.expiresAt <= now) {
            await deleteInbox(inbox.id);
            if (notificationSettings.enabled) {
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Inbox Expired',
                message: `The inbox ${inbox.address} has expired and was removed.`,
                priority: 1
              });
            }
            continue;
          }

          const timeLeft = inbox.expiresAt ? inbox.expiresAt - now : null;
          if (timeLeft && timeLeft <= 3600000 && !inbox.expiryNotified) {
            if (notificationSettings.enabled) {
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Inbox Expiring Soon',
                message: `The inbox ${inbox.address} will expire in less than 1 hour.`,
                priority: 1
              });
            }
            inbox.expiryNotified = true;
            await chrome.storage.local.set({ inboxes });
          }
        }
      } catch (error) {
        console.error('Error in periodic inbox expiry check:', error);
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
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiry
      expiryNotified: false
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

// Function to extract OTP from email content based on a prioritized set of rules.
function extractOTP(subject, body) {
  // Rule 7: Normalize Input
  const normalizedSubject = subject ? subject.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  // For the body, we need a more careful normalization to preserve line breaks.
  let normalizedBody = body || '';
  if (normalizedBody) {
      // First, remove style and script blocks completely to avoid CSS rules being mistaken for OTPs.
      normalizedBody = normalizedBody.replace(/<(style|script)[\s\S]*?>[\s\S]*?<\/(style|script)>/gi, '');
      // A more robust HTML-to-text conversion.
      // 1. Replace block-level elements that create line breaks with a newline character.
      normalizedBody = normalizedBody.replace(/<br\s*\/?>|<p.*?>|<div.*?>|<h[1-6].*?>/gi, '\n');
      // 2. Strip all remaining HTML tags.
      normalizedBody = normalizedBody.replace(/<[^>]+>/g, ' ');
      // 3. Decode HTML entities like &nbsp;
      normalizedBody = normalizedBody.replace(/&nbsp;/gi, ' ');
      // 4. Consolidate whitespace and newlines for cleaner matching.
      normalizedBody = normalizedBody.replace(/[ \t]+/g, ' ').trim(); // First, trim and consolidate horizontal spaces.
      normalizedBody = normalizedBody.replace(/(\r\n|\r|\n){2,}/g, '\n'); // Then, consolidate newlines.
  }

  // For debugging, as requested by the user.
  console.log("--- OTP Extraction Debug ---");
  console.log("Original Body:", body);
  console.log("Normalized Body:", normalizedBody);
  console.log("--------------------------");

  // Rule 4: Check Subject Line Separately
  let otp = findOtpInText(normalizedSubject, true);
  if (otp) {
    console.log('OTP found in subject:', otp);
    return otp;
  }

  // If not in subject, check body
  otp = findOtpInText(normalizedBody, false);
  if (otp) {
    console.log('OTP found in body:', otp);
    return otp;
  }
  
  console.log('No OTP found matching the specified rules.');
  return null;
}

function findOtpInText(text, isSubject) {
  if (!text) return null;
  
  const lowerCaseText = text.toLowerCase();
  
  // Rule 2 & 1: Define patterns with contextual keywords and OTP length.
  // Patterns are ordered by confidence to implement Rule 6 (Position/Priority).
  const patterns = [
      // 1. VERY HIGH confidence: An alphanumeric code (that isn't just letters) on its own line.
      /^\s*(?![a-zA-Z]{4,8}$)([a-zA-Z0-9]{4,8})\s*$/m,

      // 2. High confidence: keyword, colon, then code.
      /(?:code|otp|pin|password|verification)[\s\S]{0,75}:\s*\b(?![a-zA-Z]{4,8}\b)([a-zA-Z0-9]{4,8})\b/i,

      // 3. High confidence: keyword, "is" or "below", then code.
      /(?:your|this|the)?\s*(?:code|otp|pin|password|verification)\s*(?:is|below)[\s\S]{0,50}\b(?![a-zA-Z]{4,8}\b)([a-zA-Z0-9]{4,8})\b/i,

      // 4. Fallback: a numeric code near a keyword.
      /(?:one\s*time\s*password|verification\s*code|otp|code|pin)[\s\S]{0,50}\b(\d{3,8})\b/i,
  ];

  // For subjects, a standalone code is more likely an OTP.
  if (isSubject) {
      patterns.push(/\b(?![a-zA-Z]{3,8}\b)([a-zA-Z0-9]{3,8})\b/);
  }

  for (const pattern of patterns) {
    const match = text.match(pattern);
    // The captured group is at index 1 or 2 depending on the regex.
    const capturedOtp = match ? (match[1] || match[2]) : null;
    if (capturedOtp) {
      const potentialOtp = capturedOtp.replace(/[- ]/g, '');
      // Rule 5: Further rejection of false positives.
      if (potentialOtp.length >= 3 && potentialOtp.length <= 8) {
        return potentialOtp;
      }
    }
  }

  // Broader search if expiration language is present.
  const hasExpirationLanguage = /(valid for|expires in|expire)/.test(lowerCaseText);
  if (hasExpirationLanguage) {
      const match = text.match(/\b(?![a-zA-Z]{3,8}\b)([a-zA-Z0-9]{3,8})\b/);
      if (match && match[0]) {
          return match[0];
      }
  }

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

    // Process messages for OTP
    let otpCount = 0;
    messages = messages.map(msg => {
      // Use the HTML body if available, as it often has better structure for parsing.
      const otp = extractOTP(msg.subject || '', msg.body_html || msg.body_plain || '');
      if (otp) otpCount++;
      return {
        ...msg,
        otp,
      };
    });

    // Check for new messages by comparing with stored messages
    const { lastMessageTimestamps = {} } = await chrome.storage.local.get(['lastMessageTimestamps']);
    const lastTimestamp = lastMessageTimestamps[inboxId] || 0;
    const newMessages = messages.filter(msg => msg.received_at * 1000 > lastTimestamp);

    // Send OTP from new messages to the active tab
    if (newMessages.length > 0) {
      const latestNewMessageWithOtp = newMessages
        .filter(msg => msg.otp)
        .sort((a, b) => b.received_at - a.received_at)[0];
      
      if (latestNewMessageWithOtp) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0 && tabs[0].id) {
            console.log(`Sending OTP ${latestNewMessageWithOtp.otp} to tab ${tabs[0].id}`);
            chrome.tabs.sendMessage(tabs[0].id, { 
              type: 'fillOTP', 
              otp: latestNewMessageWithOtp.otp 
            });
          }
        });
      }
    }

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

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'autofill-form') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'startSignup'
        });
      }
    } catch (error) {
      console.error('Error handling command:', error);
    }
  }
});
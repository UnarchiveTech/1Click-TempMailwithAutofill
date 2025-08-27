const API_BASE_URL = 'https://api.guerrillamail.com/ajax.php';

// Helper function to manage all API calls to Guerrilla Mail.
// It handles the session ID (sid) and standard parameters automatically.
async function guerrillaApiCall(func, params = {}, method = 'GET') {
  const { guerrillaSid } = await chrome.storage.local.get('guerrillaSid');
  const urlParams = new URLSearchParams({
    f: func,
    ip: '127.0.0.1',
    agent: '1ClickExt',
    ...params,
  });

  if (guerrillaSid) {
    urlParams.append('sid_token', guerrillaSid);
  }

  const response = await fetch(`${API_BASE_URL}?${urlParams.toString()}`, {
    method: method,
  });

  if (!response.ok) {
    throw new Error(`API call failed with status ${response.status}`);
  }

  // Guerrilla Mail uses a session token that we must manage manually.
  // It can be returned in the JSON body, so we extract and save it.
  const data = await response.json();
  if (data.sid_token) {
    await chrome.storage.local.set({ guerrillaSid: data.sid_token });
  }

  return data;
}


chrome.runtime.onInstalled.addListener(() => {
  console.log('1Click: Temp Mail with Autofill extension installed');
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
          return; // Don't run if notifications are off or no inboxes exist.
        }

        // Check each inbox for new mail.
        for (const inbox of inboxes) {
          await checkNewEmailsForNotification(inbox.address);
        }
      } catch (error) {
        console.error('Error in periodic email check:', error);
      }
    }
  });
}

async function createInbox(emailUser = null) {
  try {
    // Get email data from Guerrilla Mail API
    const data = emailUser
      ? await guerrillaApiCall('set_email_user', { email_user: emailUser })
      : await guerrillaApiCall('get_email_address');

    // Create inbox object
    const inbox = {
      id: data.email_addr,
      address: data.email_addr,
      createdAt: Date.now(),
      expiresAt: (data.email_timestamp + 3600) * 1000, // 60 minutes expiration (for mails only, email address dont expire)
    };

    const { inboxes = [], seenEmailIds = {} } = await chrome.storage.local.get(['inboxes', 'seenEmailIds']);

    // Check if inbox already exists to avoid duplicates
    const existingInbox = inboxes.find(existingInbox => existingInbox.address === inbox.address);

    if (!existingInbox) {
      inboxes.push(inbox);
      seenEmailIds[inbox.address] = [];

      // Update analytics
      const { analytics = {} } = await chrome.storage.local.get(['analytics']);
      analytics.inboxesCreated = (analytics.inboxesCreated || 0) + 1;
      await chrome.storage.local.set({ analytics });
    }

    await chrome.storage.local.set({ inboxes, seenEmailIds });

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
async function checkNewEmailsForNotification(inboxAddress) {
  try {
    // Set the session to the correct email address
    const emailUser = inboxAddress.split('@')[0];
    await guerrillaApiCall('set_email_user', { email_user: emailUser });

    // Fetch the basic list of emails
    const listData = await guerrillaApiCall('get_email_list', { offset: 0 });
    const messages = listData.list || [];

    // Get the list of email IDs we've already seen for this inbox
    const { seenEmailIds = {} } = await chrome.storage.local.get('seenEmailIds');
    const previouslySeenIds = new Set(seenEmailIds[inboxAddress] || []);
    
    // Find messages that are not in our "seen" list
    const newMessages = messages.filter(msg => !previouslySeenIds.has(msg.mail_id));

    if (newMessages.length > 0) {
      newMessages.forEach(msg => {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: `New Email in ${inboxAddress}`,
          message: `${msg.mail_from}: ${msg.mail_subject}`,
          priority: 0
        });
      });

      // Update analytics for notifications sent
      const { analytics = {} } = await chrome.storage.local.get(['analytics']);
      analytics.notificationsSent = (analytics.notificationsSent || 0) + newMessages.length;
      await chrome.storage.local.set({ analytics });
    }

    // Update the "seen" list with all current email IDs for the next check
    seenEmailIds[inboxAddress] = messages.map(msg => msg.mail_id);
    await chrome.storage.local.set({ seenEmailIds });
    
  } catch (error) {
    // Errors in background checks should be silent to avoid console spam
  }
}

async function fetchEmails(inboxAddress, filters = {}) {
  try {
    // === STEP 1: Initialize Guerrilla Mail session ===
    const emailUser = inboxAddress.split('@[')[0];
    // Set the active email for this session - required before fetching emails
    await guerrillaApiCall('set_email_user', { email_user: emailUser });

    // === STEP 2: Get basic email list ===
    // Fetch the list of emails (this only gives us basic info like IDs)
    const listData = await guerrillaApiCall('get_email_list', { offset: 0 });
    const messages = listData.list || [];

    const { seenEmailIds = {} } = await chrome.storage.local.get('seenEmailIds');
    seenEmailIds[inboxAddress] = messages.map(msg => msg.mail_id);
    await chrome.storage.local.set({ seenEmailIds });

    // === STEP 3: Fetch detailed email content ===
    // For each email, we need to make a separate API call to get the full content
    // This is necessary because the list API only returns minimal information
    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        // Get full email content including subject and body
        const emailData = await guerrillaApiCall('fetch_email', { email_id: msg.mail_id });
        // Extract OTP code from subject and body if present
        const otp = extractOTP(emailData.mail_subject, emailData.mail_body);

        // Transform Guerrilla Mail format to our standardized format
        return {
          id: emailData.mail_id,
          from_name: emailData.mail_from,
          subject: emailData.mail_subject,
          body_html: emailData.mail_body,
          body_plain: emailData.mail_excerpt,
          received_at: emailData.mail_timestamp,
          otp: otp, // Will be null if no OTP found
        };
      })
    );

    // === STEP 4: Auto-fill OTP functionality ===
    const messagesWithOtp = detailedMessages.filter(msg => msg.otp);

    if (messagesWithOtp.length > 0) {
      // Sort by timestamp (newest first) and get the most recent OTP
      const latestOtpMessage = messagesWithOtp.sort((a, b) => b.received_at - a.received_at)[0];

      // Send OTP to the active tab's content script for auto-filling
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Ensure we have a valid tab before sending message
        if (tabs.length > 0 && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'fillOTP',
            otp: latestOtpMessage.otp
          });
        }
      });
    }

    // === STEP 5: Update usage analytics ===
    const { analytics = {} } = await chrome.storage.local.get(['analytics']);
    analytics.emailsReceived = (analytics.emailsReceived || 0) + detailedMessages.length;
    analytics.otpsDetected = (analytics.otpsDetected || 0) + messagesWithOtp.length;
    await chrome.storage.local.set({ analytics });

    // === STEP 6: Apply user-specified filters ===
    let filteredMessages = detailedMessages;

    // Filter by search query if provided
    if (filters.searchQuery) {
      const searchQuery = filters.searchQuery.toLowerCase();
      filteredMessages = filteredMessages.filter(msg =>
        (msg.subject && msg.subject.toLowerCase().includes(searchQuery)) ||
        (msg.from_name && msg.from_name.toLowerCase().includes(searchQuery)) ||
        (msg.body_plain && msg.body_plain.toLowerCase().includes(searchQuery))
      );
    }

    // Filter to only show messages with OTP codes if requested
    if (filters.hasOTP) {
      filteredMessages = filteredMessages.filter(msg => msg.otp);
    }

    return filteredMessages;

  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

// Delete an inbox
async function deleteInbox(inboxAddress) {
  try {
    await guerrillaApiCall('forget_me', { email_addr: inboxAddress });

    // Reset the session state by getting a new address. This fixes a bug
    // where the API would temporarily "lose" the first email of other inboxes
    // after a delete operation.
    await guerrillaApiCall('get_email_address');

    const { inboxes = [], seenEmailIds = {} } = await chrome.storage.local.get(['inboxes', 'seenEmailIds']);
    const updatedInboxes = inboxes.filter(i => i.address !== inboxAddress);
    // Clean up the seen IDs for the deleted inbox.
    delete seenEmailIds[inboxAddress];
    await chrome.storage.local.set({ inboxes: updatedInboxes, seenEmailIds });
    return { success: true };
  } catch (error) {
    console.error('Error deleting inbox:', error);
    return { success: false, error: error.message };
  }
}

// Main handler for updating session credentials and auto-copying to clipboard
async function handleUpdateSessionCredentials(message, sender) {
  // Ensure the message comes from a valid tab (security check)
  if (!sender.tab || !sender.tab.id) {
    throw new Error('Credentials can only be updated from a valid browser tab');
  }

  // Retrieve existing session credentials to merge with new data
  // This allows partial updates without losing existing fields
  const { sessionCredentials = {} } = await chrome.storage.session.get('sessionCredentials');

  const { autoCopy = false } = await chrome.storage.local.get('autoCopy');

  // Merge existing credentials with new ones (new values override existing)
  const updatedCredentials = { ...sessionCredentials, ...message.credentials };

  // Save the merged credentials back to session storage
  await chrome.storage.session.set({ sessionCredentials: updatedCredentials });

  // Only copy to clipboard if the user has enabled auto-copy feature
  // This respects user preferences and avoids unwanted clipboard modifications
  if (autoCopy) {
    const clipboardText = buildCredentialsStringForSession(updatedCredentials);
    await writeToClipboard(sender.tab.id, clipboardText);
  }

  return { success: true };
}

// Helper function to format credentials into a user-friendly clipboard format
// We maintain a specific order to ensure consistency across all credential entries
function buildCredentialsStringForSession(credentials) {
  // Define the order we want fields to appear - website first for context,
  // then the most commonly needed fields (email/username, password)
  const fieldOrder = ['website', 'email', 'username', 'password', 'name', 'phone'];

  const fieldLabels = {
    website: 'Website',
    email: 'Email',
    username: 'Username',
    password: 'Password',
    name: 'Name',
    phone: 'Phone'
  };

  const formattedFields = fieldOrder.map(fieldKey => {
    const fieldValue = credentials[fieldKey];

    // Skip fields that are empty, null, or undefined
    if (!fieldValue) {
      return null;
    }

    // Create the formatted line: "Website: example.com"
    const fieldLabel = fieldLabels[fieldKey];
    return `${fieldLabel}: ${fieldValue}`;
  });

  // Remove any null entries (fields that had no values)
  const validFields = formattedFields.filter(Boolean);

  return validFields.join('\n');
}

// Helper function to safely copy text to clipboard in the active tab
// We use content script injection because clipboard access requires user interaction context
async function writeToClipboard(tabId, text) {
  if (!text) return;

  try {
    // Inject a function into the active tab to access its clipboard API
    // This is necessary because background scripts can't directly access clipboard
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (textToCopy) => navigator.clipboard.writeText(textToCopy),
      args: [text]
    });
  } catch (error) {
    console.error('Failed to copy credentials to clipboard:', error);
    // We don't throw here to prevent breaking the main flow
    // The user will just miss the clipboard copy feature
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.type === 'createInbox') {
    // Generate a random username for the new inbox if not provided.
    const user = message.user || Math.random().toString(36).substring(2, 10);
    createInbox(user)
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
    fetchEmails(message.inboxId, message.filters)
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
  
  if (message.type === 'clearSessionCredentials') {
    chrome.storage.session.remove('sessionCredentials')
      .then(() => sendResponse({ success: true }))
      .catch(error => {
      console.error('Failed to clear session credentials:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'updateSessionCredentials') {
    handleUpdateSessionCredentials(message, sender)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('Error updating session credentials:', error);
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

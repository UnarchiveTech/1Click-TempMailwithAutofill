const API_BASE_URL = 'https://burner.kiwi/api/v2';

chrome.runtime.onInstalled.addListener(() => {
  console.log('OneClickAutofill with TempMail extension installed');
});

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

    return inbox;
  } catch (error) {
    console.error('Error creating inbox:', error);
    throw error;
  }
}

// Function to extract OTP from email content
function extractOTP(subject, body) {
  if (subject) {
    console.log('Checking subject for OTP:', subject);
    const normalizedSubject = subject.replace(/<[^>]+>/g, ' ')
                                   .replace(/\s+/g, ' ')
                                   .trim();
    const subjectOTP = extractOTPFromText(normalizedSubject);
    if (subjectOTP) {
      console.log('OTP found in subject:', subjectOTP);
      return subjectOTP;
    }
  }

  if (!body) {
    console.log('No email body provided');
    return null;
  }

  console.log('Full email body:', body);
  console.log('Extracting OTP from body:', body.substring(0, 100) + '...');

  const content = body.replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();

  console.log('Normalized content:', content.substring(0, 100) + '...');

  return extractOTPFromText(content);
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
    console.log('Trying pattern:', pattern);
    const matches = content.match(pattern);
    if (matches) {
      console.log('Pattern matched:', matches);
      if (matches[1]) {
        const otp = matches[1].replace(/[- ]/g, '');
        console.log('Extracted potential OTP:', otp);
        if (/^[0-9]{4,8}$/.test(otp)) {
          console.log('Valid OTP found:', otp);
          return otp;
        } else {
          console.log('Invalid OTP format, continuing search...');
        }
      }
    }
  }

  console.log('No OTP found with primary patterns, trying fallback detection...');
  const numbers = content.match(/\b\d{4,8}\b/g) || [];
  console.log('Found potential OTP numbers:', numbers);

  for (const num of numbers) {
    const context = content.substring(
      Math.max(0, content.indexOf(num) - 50),
      Math.min(content.length, content.indexOf(num) + 50)
    ).toLowerCase();

    console.log(`Checking context for number ${num}:`, context.substring(0, 30) + '...');

    if (context.includes('otp') || 
        context.includes('code') || 
        context.includes('pin') || 
        context.includes('verify') || 
        context.includes('authentication')) {
      console.log('OTP found in context:', num);
      return num;
    }
  }

  console.log('No OTP found in email content');
  return null;
}

// Check for new messages in a specific inbox
async function checkNewEmails(inboxId) {
  try {
    const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
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

    const messages = data.result || [];
    console.log(`Processing ${messages.length} messages for OTP extraction`);

    return messages.map(msg => {
      console.log('Processing message:', msg.subject || 'No Subject');
      console.log('Full message text:', msg.body_plain || 'No content');
      const otp = extractOTP(msg.subject || '', msg.body_plain || '');
      console.log('Extracted OTP result:', otp);
      return {
        ...msg,
        otp
      };
    });
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
  if (message.type === 'createInbox') {
    createInbox()
      .then(inbox => sendResponse({ success: true, inbox }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'checkEmails') {
    checkNewEmails(message.inboxId)
      .then(messages => sendResponse({ success: true, messages }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'deleteInbox') {
    deleteInbox(message.inboxId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'getInboxes') {
    chrome.storage.local.get(['inboxes'])
      .then(({ inboxes = [] }) => sendResponse({ success: true, inboxes }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
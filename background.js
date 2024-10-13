// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('OneClickAutofill with TempMail extension installed');
});


const API_BASE_URL = 'https://burner.kiwi/api/v2';

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
    
    // Store the email and token
    await chrome.storage.local.set({
      tempEmail: email.address,
      emailId: email.id,
      emailToken: token
    });

    return email.address;
  } catch (error) {
    console.error('Error creating inbox:', error);
    throw error;
  }
}

// Function to extract OTP from email content
function extractOTP(content) {
  // Enhanced OTP patterns with more comprehensive detection
  const patterns = [
    // Pattern for explicit OTP mentions
    /(?:OTP|one[ -]?time[ -]?(?:password|code)|verification[ -]?code|security[ -]?code|auth(?:entication)?[ -]?code)[^0-9]*([0-9]{4,8})/i,
    
    // Pattern for codes in specific formats (4-8 digits)
    /\b([0-9]{4,8})\b/,
    
    // Pattern for codes with separators
    /\b([0-9]{3,4}[- ][0-9]{3,4})\b/,
    
    // Pattern for codes in context
    /code(?:\s+is)?[^0-9]*([0-9]{4,8})/i,
    
    // Fallback pattern for any numeric sequence that might be an OTP
    /([0-9]{4,8})(?:[^0-9]|$)/
  ];

  // Try each pattern in order of specificity
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      // Clean up the OTP (remove any spaces or dashes)
      return match[1].replace(/[- ]/g, '');
    }
  }
  
  // If no match found with the primary patterns, try a more aggressive approach
  // Look for any 4-8 digit number that appears isolated
  const aggressiveMatch = content.match(/\b(\d{4,8})\b/);
  if (aggressiveMatch && aggressiveMatch[1]) {
    return aggressiveMatch[1];
  }
  
  return null;
}

// Check for new messages in the inbox
async function checkNewEmails() {
  try {
    const { emailId, emailToken } = await chrome.storage.local.get(['emailId', 'emailToken']);
    if (!emailId || !emailToken) {
      throw new Error('Email credentials not found');
    }

    const response = await fetch(`${API_BASE_URL}/inbox/${emailId}/messages`, {
      headers: {
        'X-Burner-Key': emailToken
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errors?.msg || 'Failed to fetch messages');
    }

    // Process messages to extract OTP
    const messages = data.result || [];
    return messages.map(msg => ({
      ...msg,
      otp: extractOTP(msg.text || '')
    }));
  } catch (error) {
    console.error('Error checking emails:', error);
    throw error;
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'createInbox') {
    // If forceNew is true, we'll create a new inbox regardless of existing email
    createInbox()
      .then(email => sendResponse({ success: true, email }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'checkEmails') {
    checkNewEmails()
      .then(messages => {
        sendResponse({ success: true, messages });
      })
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
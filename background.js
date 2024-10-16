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
function extractOTP(subject, body) {
  // First check if subject is provided and contains an OTP
  if (subject) {
    console.log('Checking subject for OTP:', subject);
    
    // Normalize subject
    const normalizedSubject = subject.replace(/<[^>]+>/g, ' ')
                                   .replace(/\s+/g, ' ')
                                   .trim();
    
    // Try to extract OTP from subject
    const subjectOTP = extractOTPFromText(normalizedSubject);
    if (subjectOTP) {
      console.log('OTP found in subject:', subjectOTP);
      return subjectOTP;
    }
  }
  
  // If no OTP found in subject or subject not provided, check body
  if (!body) {
    console.log('No email body provided');
    return null;
  }
  
  // Log the full email body for debugging
  console.log('Full email body:', body);
  console.log('Extracting OTP from body:', body.substring(0, 100) + '...');
  
  // Normalize content: convert HTML to text and clean up whitespace
  const content = body.replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
  
  console.log('Normalized content:', content.substring(0, 100) + '...');
  
  return extractOTPFromText(content);
}

// Helper function to extract OTP from text (subject or body)
function extractOTPFromText(content) {
  // Enhanced OTP patterns with more comprehensive detection
  const patterns = [
    // Common OTP indicators with numbers
    /(?:OTP|one[- ]?time[- ]?(?:password|code|pin)|verification[- ]?code|security[- ]?code|auth(?:entication)?[- ]?code)[^0-9]*?([0-9]{4,8})/i,
    
    // OTP with explicit labeling
    /your(?:\s+[a-z]+)*\s+(?:code|OTP|pin)\s+(?:is|:)\s*([0-9]{4,8})/i,
    
    // OTP in specific formats with context
    /(?:use|enter|verify with|code)[^0-9]*?([0-9]{3,4}[- ]?[0-9]{3,4})/i,
    
    // OTP with common prefixes/suffixes
    /\b(?:code|pin|otp)\s*[:=]\s*([0-9]{4,8})\b/i,
    
    // Numbers in typical OTP formats (4-8 digits)
    /\b([0-9]{4,8})\b(?=(?:[^0-9]|$).*?(?:valid|expires|verify|authentication|code|otp))/i,
    
    // Numbers with separators in OTP context
    /\b([0-9]{3}[- ][0-9]{3}|[0-9]{4}[- ][0-9]{4}|[0-9]{4}[- ][0-9]{3})\b/,
    
    // Fallback: isolated numbers that look like OTPs
    /\b([0-9]{4,8})\b(?![0-9])/
  ];

  // Try each pattern in order of specificity
  for (const pattern of patterns) {
    console.log('Trying pattern:', pattern);
    const matches = content.match(pattern);
    if (matches) {
      console.log('Pattern matched:', matches);
      if (matches[1]) {
        // Clean up the OTP (remove spaces, dashes)
        const otp = matches[1].replace(/[- ]/g, '');
        console.log('Extracted potential OTP:', otp);
        
        // Validate the cleaned OTP
        if (/^[0-9]{4,8}$/.test(otp)) {
          console.log('Valid OTP found:', otp);
          return otp;
        } else {
          console.log('Invalid OTP format, continuing search...');
        }
      }
    }
  }

  // If no valid OTP found with primary patterns
  // Look for any isolated number that could be an OTP
  console.log('No OTP found with primary patterns, trying fallback detection...');
  const numbers = content.match(/\b\d{4,8}\b/g) || [];
  console.log('Found potential OTP numbers:', numbers);
  
  for (const num of numbers) {
    // Check if the number appears in a context that suggests it's an OTP
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
    console.log(`Processing ${messages.length} messages for OTP extraction`);
    
    return messages.map(msg => {
      console.log('Processing message:', msg.subject || 'No Subject');
      // Log the full message text for debugging
      console.log('Full message text:', msg.body_plain || 'No content');
      // Pass both subject and body to extractOTP function
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
// Function to identify signup form
function findSignupForm() {
  // Generic form detection with improved selectors
  const forms = Array.from(document.querySelectorAll('form'));
  const signupForms = forms.filter(form => {
    const formText = form.textContent.toLowerCase();
    const action = (form.getAttribute('action') || '').toLowerCase();
    const isSignupForm = 
      formText.includes('sign up') || 
      formText.includes('register') || 
      formText.includes('create account') ||
      action.includes('register') || 
      action.includes('signup');

    if (!isSignupForm) return false;

    const inputs = form.querySelectorAll('input');
    const hasEmailField = Array.from(inputs).some(input => 
      input.type === 'email' || 
      input.name.toLowerCase().includes('email') ||
      input.id.toLowerCase().includes('email') ||
      input.placeholder?.toLowerCase().includes('email')
    );
    const hasPasswordField = Array.from(inputs).some(input => 
      input.type === 'password' || 
      input.name.toLowerCase().includes('password') ||
      input.id.toLowerCase().includes('password') ||
      input.placeholder?.toLowerCase().includes('password')
    );
    
    // Accept forms with both email and password fields
    return hasEmailField && hasPasswordField;
  });

  if (signupForms.length > 0) {
    return Promise.resolve(signupForms[0]);
  }

  // If no signup form found, look for any form with email and password fields
  for (const form of forms) {
    const inputs = form.querySelectorAll('input');
    const hasEmailField = Array.from(inputs).some(input => 
      input.type === 'email' || 
      input.name.toLowerCase().includes('email') ||
      input.id.toLowerCase().includes('email') ||
      input.placeholder?.toLowerCase().includes('email')
    );
    const hasPasswordField = Array.from(inputs).some(input => 
      input.type === 'password' || 
      input.name.toLowerCase().includes('password') ||
      input.id.toLowerCase().includes('password') ||
      input.placeholder?.toLowerCase().includes('password')
    );
    
    if (hasEmailField && hasPasswordField) {
      return Promise.resolve(form);
    }
  }

  // NEW: Look for email-only signup forms (like newsletter signups or simple registrations)
  for (const form of forms) {
    const formText = form.textContent.toLowerCase();
    const action = (form.getAttribute('action') || '').toLowerCase();
    const formClasses = (form.getAttribute('class') || '').toLowerCase();
    
    // Check if form appears to be a signup/subscription form
    const isLikelySignupForm = 
      formText.includes('sign up') || 
      formText.includes('subscribe') || 
      formText.includes('newsletter') || 
      formText.includes('join') ||
      action.includes('subscribe') || 
      action.includes('signup') ||
      formClasses.includes('signup') ||
      formClasses.includes('subscribe');
    
    if (!isLikelySignupForm) continue;
    
    const inputs = form.querySelectorAll('input');
    const hasEmailField = Array.from(inputs).some(input => 
      input.type === 'email' || 
      input.name.toLowerCase().includes('email') ||
      input.id.toLowerCase().includes('email') ||
      input.placeholder?.toLowerCase().includes('email')
    );
    
    // Check if form has a submit button or input
    const hasSubmitButton = form.querySelector('button[type="submit"], input[type="submit"], button:not([type]), [role="button"]');
    
    if (hasEmailField && hasSubmitButton) {
      return Promise.resolve(form);
    }
  }

  // As a last resort, look for any form with just an email field
  for (const form of forms) {
    const inputs = form.querySelectorAll('input');
    const hasEmailField = Array.from(inputs).some(input => 
      input.type === 'email' || 
      input.name.toLowerCase().includes('email') ||
      input.id.toLowerCase().includes('email') ||
      input.placeholder?.toLowerCase().includes('email')
    );
    
    if (hasEmailField) {
      return Promise.resolve(form);
    }
  }

  return Promise.resolve(null);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSignup') {
    (async () => {
      try {
        const form = await findSignupForm();
        if (!form) {
          chrome.runtime.sendMessage({ 
            status: 'No signup form found on this page', 
            isError: true 
          });
          return;
        }

        const success = await fillSignupForm(form);
        if (success) {
          // Check if it was an email-only form
          const hasPasswordField = form.querySelector('input[type="password"], input[name*="password"], input[id*="password"]');
          const message = hasPasswordField ? 
            'Form filled successfully. Please review and submit.' : 
            'Email-only form filled successfully. Please review and submit.';
            
          chrome.runtime.sendMessage({ 
            status: message, 
            isError: false 
          });
        } else {
          chrome.runtime.sendMessage({ 
            status: 'Failed to fill form', 
            isError: true 
          });
        }
      } catch (error) {
        chrome.runtime.sendMessage({ 
          status: 'Error during signup process: ' + error.message, 
          isError: true 
        });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});

// Function to generate random name
function generateRandomName() {
  const firstNames = [
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

// Function to fill signup form
async function fillSignupForm(form) {
  try {
    // Get temporary email from storage
    const { tempEmail } = await chrome.storage.local.get('tempEmail');
    if (!tempEmail) {
      throw new Error('No temporary email found');
    }

    // Generate random username and name
    function generateUsername() {
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const allChars = letters + numbers;
      const length = Math.floor(Math.random() * (15 - 8 + 1)) + 8; // Random length between 8-15
      let username = '';
      
      // Start with a letter
      username += letters[Math.floor(Math.random() * letters.length)];
      
      // Fill the middle part with a mix of letters, numbers, and occasional hyphens
      for (let i = 1; i < length - 1; i++) {
        // Add hyphen with 10% chance, but only if previous char isn't a hyphen
        if (i > 1 && username[i-1] !== '-' && Math.random() < 0.1) {
          username += '-';
        } else {
          // 70% chance for letter, 30% for number
          const useNumber = Math.random() < 0.3;
          username += useNumber ? 
            numbers[Math.floor(Math.random() * numbers.length)] : 
            letters[Math.floor(Math.random() * letters.length)];
        }
      }
      
      // End with alphanumeric (no hyphen)
      username += allChars[Math.floor(Math.random() * allChars.length)];
      
      return username;
    }

    const randomUsername = generateUsername();
    const randomName = generateRandomName();

    // Generic form filling
    const emailInput = form.querySelector('input[type="email"], input[name*="email"], input[id*="email"]');
    
    // Improved username field detection
    const usernameInput = form.querySelector(
      'input[name*="username"], input[id*="username"], ' +
      'input[name*="userid"], input[id*="userid"], ' +
      'input[name*="login"], input[id*="login"], ' +
      'input[placeholder*="username" i], input[placeholder*="user id" i], ' +
      'input[placeholder*="login" i]'
    );

    // Improved name field detection
    const nameInput = form.querySelector(
      'input[name*="fullname"], input[id*="fullname"], ' +
      'input[name*="firstname"], input[id*="firstname"], ' +
      'input[name*="name"]:not([name*="username"]), ' +
      'input[id*="name"]:not([id*="username"]), ' +
      'input[placeholder*="full name" i], input[placeholder*="first name" i], ' +
      'input[placeholder*="name" i]:not([placeholder*="username" i])'
    );

    // Fill username if field exists
    if (usernameInput) {
      usernameInput.value = randomUsername;
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Fill name if field exists
    if (nameInput) {
      nameInput.value = randomName;
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (emailInput) {
      emailInput.value = tempEmail;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Generate and fill password
    function generatePassword() {
      const length = Math.floor(Math.random() * (42 - 8 + 1)) + 8; // Random length between 8-42
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      // Ensure at least one of each required character type
      let password = [
        lowercase[Math.floor(Math.random() * lowercase.length)],
        uppercase[Math.floor(Math.random() * uppercase.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        special[Math.floor(Math.random() * special.length)]
      ];
      
      // Fill the rest with random characters
      const allChars = lowercase + uppercase + numbers + special;
      for (let i = password.length; i < length; i++) {
        password.push(allChars[Math.floor(Math.random() * allChars.length)]);
      }
      
      // Shuffle the password array
      return password
        .sort(() => Math.random() - 0.5)
        .join('');
    }
    
    const password = generatePassword();
    const passwordInputs = form.querySelectorAll('input[type="password"], input[name*="password"], input[id*="password"]');
    
    // Fill all password fields (including confirm password)
    passwordInputs.forEach(input => {
      input.value = password;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Check terms checkbox if exists
    const termsCheckbox = form.querySelector('input[type="checkbox"][name*="terms"], input[type="checkbox"][id*="terms"], input[type="checkbox"][name*="agree"], input[type="checkbox"][id*="agree"]');
    if (termsCheckbox && !termsCheckbox.checked) {
      termsCheckbox.click();
    }

    // Save credentials
    await chrome.storage.local.set({ 
      credentials: { 
        email: tempEmail,
        username: usernameInput ? randomUsername : null,
        name: nameInput ? randomName : null,
        password: password,
        domain: window.location.hostname
      }
    });

    return true;
  } catch (error) {
    console.error('Error filling form:', error);
    return false;
  }
}
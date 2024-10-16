// Global variables to track injected buttons
let autoFillButtonsInjected = false;
let injectedButtons = [];

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

// Function to create and inject auto-fill buttons into form fields
function injectAutoFillButtons(form) {
  // Don't inject if already injected
  if (autoFillButtonsInjected) return;
  
  // Clear any previously injected buttons
  removeInjectedButtons();
  
  // Find all relevant input fields
  const inputFields = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[name*="email"], input[id*="email"], input[name*="username"], input[id*="username"], input[name*="name"]:not([name*="username"]), input[id*="name"]:not([id*="username"])');
  
  // Create buttons for each field
  inputFields.forEach(inputField => {
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'autofill-button-container';
    buttonContainer.style.cssText = `
      position: absolute;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.85;
      transition: opacity 0.2s;
    `;
    
    // Add hover effect to container for better visibility
    buttonContainer.onmouseover = () => {
      buttonContainer.style.opacity = '1';
    };
    buttonContainer.onmouseout = () => {
      buttonContainer.style.opacity = '0.85';
    };
    
    // Create the button (icon only)
    const autoFillButton = document.createElement('button');
    autoFillButton.className = 'autofill-button';
    autoFillButton.title = 'Auto-fill this field';
    autoFillButton.style.cssText = `
      background-color: #4285F4;
      color: white;
      border: none;
      border-radius: 50%;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      transition: background-color 0.2s, transform 0.1s;
      box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3);
    `;
    
    // Add hover effect
    autoFillButton.onmouseover = () => {
      autoFillButton.style.backgroundColor = '#3367D6';
    };
    autoFillButton.onmouseout = () => {
      autoFillButton.style.backgroundColor = '#4285F4';
    };
    
    // Add active effect
    autoFillButton.onmousedown = () => {
      autoFillButton.style.transform = 'scale(0.98)';
    };
    autoFillButton.onmouseup = () => {
      autoFillButton.style.transform = 'scale(1)';
    };
    
    // Add icon to button (icon only)
    autoFillButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;
    
    // Add click handler based on input type
    autoFillButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        // Determine field type
        const isEmail = inputField.type === 'email' || 
                       inputField.name.toLowerCase().includes('email') || 
                       inputField.id.toLowerCase().includes('email') || 
                       inputField.placeholder?.toLowerCase().includes('email');
        
        const isPassword = inputField.type === 'password' || 
                         inputField.name.toLowerCase().includes('password') || 
                         inputField.id.toLowerCase().includes('password') || 
                         inputField.placeholder?.toLowerCase().includes('password');
        
        const isUsername = inputField.name.toLowerCase().includes('username') || 
                         inputField.id.toLowerCase().includes('username') || 
                         inputField.name.toLowerCase().includes('userid') || 
                         inputField.id.toLowerCase().includes('userid') || 
                         inputField.name.toLowerCase().includes('login') || 
                         inputField.id.toLowerCase().includes('login') || 
                         inputField.placeholder?.toLowerCase().includes('username') || 
                         inputField.placeholder?.toLowerCase().includes('user id') || 
                         inputField.placeholder?.toLowerCase().includes('login');
        
        const isName = inputField.name.toLowerCase().includes('fullname') || 
                     inputField.id.toLowerCase().includes('fullname') || 
                     inputField.name.toLowerCase().includes('firstname') || 
                     inputField.id.toLowerCase().includes('firstname') || 
                     (inputField.name.toLowerCase().includes('name') && !inputField.name.toLowerCase().includes('username')) || 
                     (inputField.id.toLowerCase().includes('name') && !inputField.id.toLowerCase().includes('username')) || 
                     inputField.placeholder?.toLowerCase().includes('full name') || 
                     inputField.placeholder?.toLowerCase().includes('first name') || 
                     (inputField.placeholder?.toLowerCase().includes('name') && !inputField.placeholder?.toLowerCase().includes('username'));
        
        // Fill the field based on its type
        if (isEmail) {
          const { tempEmail } = await chrome.storage.local.get('tempEmail');
          if (!tempEmail) {
            throw new Error('No temporary email found');
          }
          inputField.value = tempEmail;
          showTooltip(autoFillButton, 'Email filled', false);
        } else if (isPassword) {
          const password = generatePassword();
          inputField.value = password;
          showTooltip(autoFillButton, 'Password generated', false);
        } else if (isUsername) {
          const username = generateUsername();
          inputField.value = username;
          showTooltip(autoFillButton, 'Username generated', false);
        } else if (isName) {
          const name = generateRandomName();
          inputField.value = name;
          showTooltip(autoFillButton, 'Name generated', false);
        } else {
          // Generic text field
          const username = generateUsername();
          inputField.value = username;
          showTooltip(autoFillButton, 'Field filled', false);
        }
        
        // Trigger input events
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
        
      } catch (error) {
        console.error('Error filling field:', error);
        showTooltip(autoFillButton, 'Error: ' + error.message, true);
      }
    });
    
    // Add button to container
    buttonContainer.appendChild(autoFillButton);
    
    // Position the button at the end of the input field
    positionButtonAtEndOfField(buttonContainer, inputField);
    
    // Add to document body
    document.body.appendChild(buttonContainer);
    
    // Add to injected buttons array for tracking
    injectedButtons.push(buttonContainer);
  });
  
  // Add a "Fill All" button at the top of the form
  addFillAllButton(form);
  
  autoFillButtonsInjected = true;
}

// Function to position button at the end of an input field
function positionButtonAtEndOfField(buttonContainer, inputField) {
  const updatePosition = () => {
    const rect = inputField.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.top = (rect.top + scrollTop + (rect.height - 24) / 2) + 'px';
    buttonContainer.style.left = (rect.right + scrollLeft - 30) + 'px';
  };
  
  // Initial positioning
  updatePosition();
  
  // Update position on window resize
  window.addEventListener('resize', updatePosition);
  
  // Update position on scroll
  window.addEventListener('scroll', updatePosition);
}

// Function to show tooltip
function showTooltip(element, message, isError) {
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'autofill-tooltip';
  tooltip.textContent = message;
  tooltip.style.cssText = `
    position: absolute;
    background-color: ${isError ? '#EA4335' : '#34A853'};
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10001;
    max-width: 250px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: opacity 0.3s;
    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
  `;
  
  // Position tooltip above the element
  const rect = element.getBoundingClientRect();
  tooltip.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
  tooltip.style.left = (rect.left + rect.width / 2 - 125) + 'px';
  
  // Add to document
  document.body.appendChild(tooltip);
  
  // Remove after 3 seconds
  setTimeout(() => {
    tooltip.style.opacity = '0';
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 300);
  }, 3000);
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

// Function to remove all injected buttons
function removeInjectedButtons() {
  injectedButtons.forEach(button => {
    if (button.parentNode) {
      button.parentNode.removeChild(button);
    }
  });
  injectedButtons = [];
}

// Function to add a "Fill All" button at the top of the form
function addFillAllButton(form) {
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'autofill-button-container fill-all-container';
  buttonContainer.style.cssText = `
    position: absolute;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.85;
    transition: opacity 0.2s;
  `;
  
  // Add hover effect to container
  buttonContainer.onmouseover = () => {
    buttonContainer.style.opacity = '1';
  };
  buttonContainer.onmouseout = () => {
    buttonContainer.style.opacity = '0.85';
  };
  
  // Create the button
  const fillAllButton = document.createElement('button');
  fillAllButton.className = 'autofill-button fill-all-button';
  fillAllButton.title = 'Auto-fill all fields';
  fillAllButton.style.cssText = `
    background-color: #4285F4;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 6px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
    transition: background-color 0.2s, transform 0.1s;
    box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3);
  `;
  
  // Add hover effect
  fillAllButton.onmouseover = () => {
    fillAllButton.style.backgroundColor = '#3367D6';
  };
  fillAllButton.onmouseout = () => {
    fillAllButton.style.backgroundColor = '#4285F4';
  };
  
  // Add active effect
  fillAllButton.onmousedown = () => {
    fillAllButton.style.transform = 'scale(0.98)';
  };
  fillAllButton.onmouseup = () => {
    fillAllButton.style.transform = 'scale(1)';
  };
  
  // Add icon and text
  fillAllButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 4px;">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 8h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H9c-.55 0-1-.45-1-1s.45-1 1-1h3V7c0-.55.45-1 1-1s1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1z"/>
    </svg>
    Fill All
  `;
  
  // Add click handler
  fillAllButton.addEventListener('click', async () => {
    try {
      const success = await fillSignupForm(form);
      if (success) {
        // Check if it was an email-only form
        const hasPasswordField = form.querySelector('input[type="password"], input[name*="password"], input[id*="password"]');
        const message = hasPasswordField ? 
          'Form filled successfully. Please review and submit.' : 
          'Email-only form filled successfully. Please review and submit.';
          
        // Show success message as tooltip
        showTooltip(fillAllButton, message, false);
      } else {
        showTooltip(fillAllButton, 'Failed to fill form', true);
      }
    } catch (error) {
      console.error('Error filling form:', error);
      showTooltip(fillAllButton, 'Error: ' + error.message, true);
    }
  });
  
  // Add button to container
  buttonContainer.appendChild(fillAllButton);
  
  // Position at the top of the form
  const formRect = form.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.top = (formRect.top + scrollTop - 40) + 'px';
  buttonContainer.style.left = (formRect.left + scrollLeft + 10) + 'px';
  
  // Add to document body
  document.body.appendChild(buttonContainer);
  
  // Add to injected buttons array for tracking
  injectedButtons.push(buttonContainer);
  
  return buttonContainer;
}

// Function to scan page for forms and inject buttons
async function scanForFormsAndInjectButtons() {
  try {
    const form = await findSignupForm();
    if (form) {
      injectAutoFillButtons(form);
    }
  } catch (error) {
    console.error('Error scanning for forms:', error);
  }
}

// Run scan when page is fully loaded
window.addEventListener('load', () => {
  // Slight delay to ensure all dynamic content is loaded
  setTimeout(scanForFormsAndInjectButtons, 1000);
});

// Also scan when DOM content changes significantly
const observer = new MutationObserver((mutations) => {
  // Check if mutations might have added a form
  const mightHaveAddedForm = mutations.some(mutation => {
    return mutation.addedNodes.length > 0 && 
           Array.from(mutation.addedNodes).some(node => 
             node.nodeName === 'FORM' || 
             (node.nodeType === 1 && node.querySelector('form, input[type="email"]'))
           );
  });
  
  if (mightHaveAddedForm && !autoFillButtonsInjected) {
    scanForFormsAndInjectButtons();
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Function to fill signup form
async function fillSignupForm(form) {
  try {
    // Get temporary email from storage
    const { tempEmail } = await chrome.storage.local.get('tempEmail');
    if (!tempEmail) {
      throw new Error('No temporary email found');
    }

    // Generate random username and name
    // Function to generate username
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

    // Function to generate password
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

    // Save credentials to history instead of overwriting
    const { credentialsHistory = [] } = await chrome.storage.local.get(['credentialsHistory']);
    
    // Create new credential entry
    const newCredential = { 
      email: tempEmail,
      username: usernameInput ? randomUsername : null,
      name: nameInput ? randomName : null,
      password: password,
      domain: window.location.hostname,
      timestamp: Date.now()
    };
    
    // Add to history (at the beginning for most recent first)
    credentialsHistory.unshift(newCredential);
    
    // Save updated history
    await chrome.storage.local.set({ credentialsHistory });

    return true;
  } catch (error) {
    console.error('Error filling form:', error);
    return false;
  }
}
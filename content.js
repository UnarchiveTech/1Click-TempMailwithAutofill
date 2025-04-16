let autoFillButtonsInjected = false;
let injectedButtons = [];

function findSignupForm() {
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
    
    return hasEmailField && hasPasswordField;
  });

  if (signupForms.length > 0) {
    return Promise.resolve(signupForms[0]);
  }

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

  for (const form of forms) {
    const formText = form.textContent.toLowerCase();
    const action = (form.getAttribute('action') || '').toLowerCase();
    const formClasses = (form.getAttribute('class') || '').toLowerCase();
    
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
    
    const hasSubmitButton = form.querySelector('button[type="submit"], input[type="submit"], button:not([type]), [role="button"]');
    
    if (hasEmailField && hasSubmitButton) {
      return Promise.resolve(form);
    }
  }

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

function injectAutoFillButtons(form) {
  if (autoFillButtonsInjected) return;
  removeInjectedButtons();

  const inputFields = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[name*="email"], input[id*="email"], input[name*="username"], input[id*="username"], input[name*="name"]:not([name*="username"]), input[id*="name"]:not([id*="username"])');

  inputFields.forEach(inputField => {
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

    buttonContainer.onmouseover = () => {
      buttonContainer.style.opacity = '1';
    };
    buttonContainer.onmouseout = () => {
      buttonContainer.style.opacity = '0.85';
    };

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

    autoFillButton.onmouseover = () => {
      autoFillButton.style.backgroundColor = '#3367D6';
    };
    autoFillButton.onmouseout = () => {
      autoFillButton.style.backgroundColor = '#4285F4';
    };

    autoFillButton.onmousedown = () => {
      autoFillButton.style.transform = 'scale(0.98)';
    };
    autoFillButton.onmouseup = () => {
      autoFillButton.style.transform = 'scale(1)';
    };

    autoFillButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;

    autoFillButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      try {
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

        if (isEmail) {
          const { activeInboxId, inboxes = [] } = await chrome.storage.local.get(['activeInboxId', 'inboxes']);
          const inbox = inboxes.find(i => i.id === activeInboxId);
          if (!inbox) {
            throw new Error('No active inbox found');
          }
          inputField.value = inbox.address;
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
          const username = generateUsername();
          inputField.value = username;
          showTooltip(autoFillButton, 'Field filled', false);
        }

        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));

      } catch (error) {
        console.error('Error filling field:', error);
        showTooltip(autoFillButton, 'Error: ' + error.message, true);
      }
    });

    buttonContainer.appendChild(autoFillButton);
    positionButtonAtEndOfField(buttonContainer, inputField);
    document.body.appendChild(buttonContainer);
    injectedButtons.push(buttonContainer);
  });

  addFillAllButton(form);
  autoFillButtonsInjected = true;
}

function positionButtonAtEndOfField(buttonContainer, inputField) {
  const updatePosition = () => {
    const rect = inputField.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    buttonContainer.style.position = 'absolute';
    buttonContainer.style.top = (rect.top + scrollTop + (rect.height - 24) / 2) + 'px';
    buttonContainer.style.left = (rect.right + scrollLeft - 30) + 'px';
  };

  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);
}

function showTooltip(element, message, isError) {
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

  const rect = element.getBoundingClientRect();
  tooltip.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
  tooltip.style.left = (rect.left + rect.width / 2 - 125) + 'px';

  document.body.appendChild(tooltip);

  setTimeout(() => {
    tooltip.style.opacity = '0';
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 300);
  }, 3000);
}

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
    return true;
  }
});

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

function removeInjectedButtons() {
  injectedButtons.forEach(button => {
    if (button.parentNode) {
      button.parentNode.removeChild(button);
    }
  });
  injectedButtons = [];
}

function addFillAllButton(form) {
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

  buttonContainer.onmouseover = () => {
    buttonContainer.style.opacity = '1';
  };
  buttonContainer.onmouseout = () => {
    buttonContainer.style.opacity = '0.85';
  };

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

  fillAllButton.onmouseover = () => {
    fillAllButton.style.backgroundColor = '#3367D6';
  };
  fillAllButton.onmouseout = () => {
    fillAllButton.style.backgroundColor = '#4285F4';
  };

  fillAllButton.onmousedown = () => {
    fillAllButton.style.transform = 'scale(0.98)';
  };
  fillAllButton.onmouseup = () => {
    fillAllButton.style.transform = 'scale(1)';
  };

  fillAllButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 4px;">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 8h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H9c-.55 0-1-.45-1-1s.45-1 1-1h3V7c0-.55.45-1 1-1s1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1z"/>
    </svg>
    Fill All
  `;

  fillAllButton.addEventListener('click', async () => {
    try {
      const success = await fillSignupForm(form);
      if (success) {
        const hasPasswordField = form.querySelector('input[type="password"], input[name*="password"], input[id*="password"]');
        const message = hasPasswordField ? 
          'Form filled successfully. Please review and submit.' : 
          'Email-only form filled successfully. Please review and submit.';
          
        showTooltip(fillAllButton, message, false);
      } else {
        showTooltip(fillAllButton, 'Failed to fill form', true);
      }
    } catch (error) {
      console.error('Error filling form:', error);
      showTooltip(fillAllButton, 'Error: ' + error.message, true);
    }
  });

  buttonContainer.appendChild(fillAllButton);

  const formRect = form.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  buttonContainer.style.position = 'absolute';
  buttonContainer.style.top = (formRect.top + scrollTop - 40) + 'px';
  buttonContainer.style.left = (formRect.left + scrollLeft + 10) + 'px';

  document.body.appendChild(buttonContainer);
  injectedButtons.push(buttonContainer);

  return buttonContainer;
}

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

window.addEventListener('load', () => {
  setTimeout(scanForFormsAndInjectButtons, 1000);
});

const observer = new MutationObserver((mutations) => {
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

observer.observe(document.body, {
  childList: true,
  subtree: true
});

async function fillSignupForm(form) {
  try {
    const { activeInboxId, inboxes = [] } = await chrome.storage.local.get(['activeInboxId', 'inboxes']);
    const inbox = inboxes.find(i => i.id === activeInboxId);
    if (!inbox) {
      throw new Error('No active inbox found');
    }

    function generateUsername() {
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const allChars = letters + numbers;
      const length = Math.floor(Math.random() * (15 - 8 + 1)) + 8;
      let username = '';
      
      username += letters[Math.floor(Math.random() * letters.length)];
      
      for (let i = 1; i < length - 1; i++) {
        if (i > 1 && username[i-1] !== '-' && Math.random() < 0.1) {
          username += '-';
        } else {
          const useNumber = Math.random() < 0.3;
          username += useNumber ? 
            numbers[Math.floor(Math.random() * numbers.length)] : 
            letters[Math.floor(Math.random() * letters.length)];
        }
      }
      
      username += allChars[Math.floor(Math.random() * allChars.length)];
      
      return username;
    }

    const randomUsername = generateUsername();
    const randomName = generateRandomName();

    const emailInput = form.querySelector('input[type="email"], input[name*="email"], input[id*="email"]');

    const usernameInput = form.querySelector(
      'input[name*="username"], input[id*="username"], ' +
      'input[name*="userid"], input[id*="userid"], ' +
      'input[name*="login"], input[id*="login"], ' +
      'input[placeholder*="username" i], input[placeholder*="user id" i], ' +
      'input[placeholder*="login" i]'
    );

    const nameInput = form.querySelector(
      'input[name*="fullname"], input[id*="fullname"], ' +
      'input[name*="firstname"], input[id*="firstname"], ' +
      'input[name*="name"]:not([name*="username"]), ' +
      'input[id*="name"]:not([id*="username"]), ' +
      'input[placeholder*="full name" i], input[placeholder*="first name" i], ' +
      'input[placeholder*="name" i]:not([placeholder*="username" i])'
    );

    if (usernameInput) {
      usernameInput.value = randomUsername;
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (nameInput) {
      nameInput.value = randomName;
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (emailInput) {
      emailInput.value = inbox.address;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function generatePassword() {
      const length = Math.floor(Math.random() * (42 - 8 + 1)) + 8;
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      let password = [
        lowercase[Math.floor(Math.random() * lowercase.length)],
        uppercase[Math.floor(Math.random() * uppercase.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        special[Math.floor(Math.random() * special.length)]
      ];
      
      const allChars = lowercase + uppercase + numbers + special;
      for (let i = password.length; i < length; i++) {
        password.push(allChars[Math.floor(Math.random() * allChars.length)]);
      }
      
      return password
        .sort(() => Math.random() - 0.5)
        .join('');
    }
    
    const password = generatePassword();
    const passwordInputs = form.querySelectorAll('input[type="password"], input[name*="password"], input[id*="password"]');
    
    passwordInputs.forEach(input => {
      input.value = password;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const termsCheckbox = form.querySelector('input[type="checkbox"][name*="terms"], input[type="checkbox"][id*="terms"], input[type="checkbox"][name*="agree"], input[type="checkbox"][id*="agree"]');
    if (termsCheckbox && !termsCheckbox.checked) {
      termsCheckbox.click();
    }

    const { credentialsHistory = [] } = await chrome.storage.local.get(['credentialsHistory']);
    
    const newCredential = { 
      email: inbox.address,
      username: usernameInput ? randomUsername : null,
      name: nameInput ? randomName : null,
      password: password,
      domain: window.location.hostname,
      timestamp: Date.now(),
      inboxId: activeInboxId
    };
    
    credentialsHistory.unshift(newCredential);
    
    await chrome.storage.local.set({ credentialsHistory });

    return true;
  } catch (error) {
    console.error('Error filling form:', error);
    return false;
  }
}
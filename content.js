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

  const inputFields = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[type="checkbox"], select, [name*="email"], [id*="email"], [name*="username"], [id*="username"], [name*="name"]:not([name*="username"]), [id*="name"]:not([id*="username"]), [name*="phone"], [id*="phone"], [name*="mobile"], [id*="mobile"]');

  inputFields.forEach(inputField => {
    const isSelect = inputField.tagName.toLowerCase() === 'select';
    const isCheckbox = inputField.type === 'checkbox';

    const isEmail = inputField.type === 'email' || 
                   inputField.name.toLowerCase().includes('email') || 
                   inputField.id.toLowerCase().includes('email') || 
                   inputField.placeholder?.toLowerCase().includes('email');

    const isPassword = inputField.type === 'password' || 
                     inputField.name.toLowerCase().includes('password') || 
                     inputField.id.toLowerCase().includes('password') || 
                     inputField.placeholder?.toLowerCase().includes('password');

    const isPhone = inputField.type === 'tel' ||
                  inputField.name.toLowerCase().includes('phone') ||
                  inputField.id.toLowerCase().includes('phone') ||
                  inputField.name.toLowerCase().includes('mobile') ||
                  inputField.id.toLowerCase().includes('mobile') ||
                  inputField.placeholder?.toLowerCase().includes('phone') ||
                  inputField.placeholder?.toLowerCase().includes('mobile');

    const isUsername = inputField.name.toLowerCase().includes('username') || 
                     inputField.id.toLowerCase().includes('username') || 
                     inputField.name.toLowerCase().includes('userid') || 
                     inputField.id.toLowerCase().includes('userid') || 
                     inputField.name.toLowerCase().includes('login') || 
                     inputField.id.toLowerCase().includes('login') || 
                     inputField.placeholder?.toLowerCase().includes('username') || 
                     inputField.placeholder?.toLowerCase().includes('user id') || 
                     inputField.placeholder?.toLowerCase().includes('login');

    const isFirstName = inputField.name.toLowerCase().includes('firstname') ||
                      inputField.id.toLowerCase().includes('firstname') ||
                      inputField.name.toLowerCase().includes('fname') ||
                      inputField.id.toLowerCase().includes('fname') ||
                      inputField.placeholder?.toLowerCase().includes('first name');

    const isLastName = inputField.name.toLowerCase().includes('lastname') ||
                     inputField.id.toLowerCase().includes('lastname') ||
                     inputField.name.toLowerCase().includes('lname') ||
                     inputField.id.toLowerCase().includes('lname') ||
                     inputField.placeholder?.toLowerCase().includes('last name');

    const isFullName = (
        inputField.name.toLowerCase().includes('fullname') ||
        inputField.id.toLowerCase().includes('fullname') ||
        inputField.placeholder?.toLowerCase().includes('full name') ||
        (
            (inputField.name.toLowerCase().includes('name') || inputField.id.toLowerCase().includes('name') || inputField.placeholder?.toLowerCase().includes('name')) &&
            !inputField.name.toLowerCase().includes('username') && !inputField.id.toLowerCase().includes('username') && !inputField.placeholder?.toLowerCase().includes('username') &&
            !isFirstName && !isLastName
        )
    );

    const isWebsite = inputField.type === 'url' ||
                    inputField.name.toLowerCase().includes('website') ||
                    inputField.id.toLowerCase().includes('website') ||
                    inputField.placeholder?.toLowerCase().includes('website') ||
                    inputField.name.toLowerCase().includes('url') ||
                    inputField.id.toLowerCase().includes('url') ||
                    inputField.placeholder?.toLowerCase().includes('url');

    let iconSvg;
    if (isEmail) {
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      `;
    } else if (isPassword) {
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      `;
    } else if (isPhone) {
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
        </svg>
      `;
    } else if (isFirstName || isLastName || isFullName || isUsername) {
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      `;
    } else if (isSelect) {
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12.5,2.17L11.83,2.83L13.67,4.67L12,5.5L9.5,4L10.25,7H5.5L4,9.5L7,10.25L4,13.25L5.5,14H8.5L9,17L12,14.5L15,17L15.5,14H18.5L20,13.25L17,10.25L20,9.5L18.5,7H13.75L14.5,4L13,2.5L12.5,2.17M12,7.29L11,10L12,12.71L13,10L12,7.29Z" />
        </svg>
      `;
    } else if (isWebsite) {
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      `;
    } else if (isCheckbox) {
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      `;
    } else {
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2.5l-2.8 5.7-6.2.9 4.5 4.4-1.1 6.2L12 16.5l5.1 3.2-1.1-6.2 4.5-4.4-6.2-.9z"/>
        </svg>
      `;
    }

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

    autoFillButton.innerHTML = iconSvg;

    autoFillButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        if (isEmail) {
          const { activeInboxId, inboxes = [] } = await chrome.storage.local.get(['activeInboxId', 'inboxes']);
          const inbox = inboxes.find(i => i.id === activeInboxId);
          if (!inbox) {
            throw new Error('No active inbox found');
          }
          inputField.value = inbox.address;
          showTooltip(autoFillButton, 'Email filled', false);
        } else if (isPassword) {
          const password = await getPasswordToFill();
          inputField.value = password;
          showTooltip(autoFillButton, 'Password generated', false);
        } else if (isPhone) {
          const phone = generatePhoneNumber();
          inputField.value = phone;
          showTooltip(autoFillButton, 'Phone number generated', false);
        } else if (isUsername) {
          const username = generateUsername();
          inputField.value = username;
          showTooltip(autoFillButton, 'Username generated', false);
        } else if (isFirstName || isLastName || isFullName) {
          const names = await getNamesToFill();
          let nameToFill;
          let fieldType = 'Name';

          if (isFirstName) {
            nameToFill = names.firstName;
            fieldType = 'First Name';
          } else if (isLastName) {
            nameToFill = names.lastName;
            fieldType = 'Last Name';
          } else { // isFullName
            nameToFill = names.fullName;
            fieldType = 'Full Name';
          }
          inputField.value = nameToFill;
          showTooltip(autoFillButton, `${fieldType} filled`, false);
        } else if (isSelect) {
          fillSelectElement(inputField);
          showTooltip(autoFillButton, 'Option selected', false);
        } else if (isWebsite) {
          const placeholder = inputField.placeholder;
          let website;
          if (placeholder && (placeholder.startsWith('http') || placeholder.startsWith('www'))) {
            website = placeholder;
          } else {
            website = generateWebsiteUrl();
          }
          inputField.value = website;
          showTooltip(autoFillButton, 'Website filled', false);
        } else if (isCheckbox) {
          inputField.checked = !inputField.checked;
          showTooltip(autoFillButton, 'Checkbox toggled', false);
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

  if (message.type === 'fillOTP') {
    fillOtp(message.otp);
    sendResponse({ success: true });
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

function generatePhoneNumber() {
  const areaCode = Math.floor(Math.random() * (999 - 200 + 1) + 200);
  const firstPart = Math.floor(Math.random() * (999 - 100 + 1) + 100);
  const secondPart = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);
  return `${areaCode}-${firstPart}-${secondPart}`;
}

function generateWebsiteUrl() {
  const domains = ['com', 'net', 'org', 'io', 'co', 'ai', 'dev'];
  const name = Math.random().toString(36).substring(2, 12);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `https://www.${name}.${domain}`;
}

async function fillSignupForm(form) {
  try {
    const { activeInboxId, inboxes = [] } = await chrome.storage.local.get(['activeInboxId', 'inboxes']);
    const inbox = inboxes.find(i => i.id === activeInboxId);
    if (!inbox) {
      throw new Error('No active inbox found');
    }

    const randomUsername = generateUsername();
    const names = await getNamesToFill();
    const { fullName, firstName, lastName } = names;

    const emailInput = form.querySelector('input[type="email"], input[name*="email"], input[id*="email"]');

    const usernameInput = form.querySelector(
      'input[name*="username"], input[id*="username"], ' +
      'input[name*="userid"], input[id*="userid"], ' +
      'input[name*="login"], input[id*="login"], ' +
      'input[placeholder*="username" i], input[placeholder*="user id" i], ' +
      'input[placeholder*="login" i]'
    );

    const phoneInput = form.querySelector('input[type="tel"], input[name*="phone"], input[id*="phone"], input[name*="mobile"], input[id*="mobile"], input[placeholder*="phone"], input[placeholder*="mobile"]');
    const websiteInput = form.querySelector('input[type="url"], input[name*="website"], input[id*="website"], input[placeholder*="website"], input[name*="url"], input[id*="url"], input[placeholder*="url"]');
    const firstNameInput = form.querySelector('input[name*="firstname" i], input[id*="firstname" i], input[name*="fname" i], input[id*="fname" i], input[placeholder*="first name" i]');
    const lastNameInput = form.querySelector('input[name*="lastname" i], input[id*="lastname" i], input[name*="lname" i], input[id*="lname" i], input[placeholder*="last name" i]');
    const fullNameInput = form.querySelector('input[name*="fullname" i], input[id*="fullname" i], input[name*="name"]:not([name*="user"]):not([name*="first"]):not([name*="last"]), input[id*="name"]:not([id*="user"]):not([id*="first"]):not([name*="last"]), input[placeholder*="full name" i], input[placeholder*="name" i]:not([placeholder*="user"]):not([placeholder*="first"]):not([placeholder*="last"])');

    if (usernameInput) {
      usernameInput.value = randomUsername;
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    let nameFilled = false;
    if (firstNameInput && lastNameInput) {
      firstNameInput.value = firstName;
      firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      firstNameInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      lastNameInput.value = lastName;
      lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      lastNameInput.dispatchEvent(new Event('change', { bubbles: true }));
      nameFilled = true;
    } else if (fullNameInput) {
      fullNameInput.value = fullName;
      fullNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      fullNameInput.dispatchEvent(new Event('change', { bubbles: true }));
      nameFilled = true;
    }

    const selectElements = form.querySelectorAll('select');
    selectElements.forEach(select => {
      fillSelectElement(select);
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    if (emailInput) {
      emailInput.value = inbox.address;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const randomPhone = generatePhoneNumber();
    if (phoneInput) {
      phoneInput.value = randomPhone;
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    let randomWebsite = null;
    if (websiteInput) {
      const placeholder = websiteInput.placeholder;
      if (placeholder && (placeholder.startsWith('http') || placeholder.startsWith('www'))) {
        randomWebsite = placeholder;
      } else {
        randomWebsite = generateWebsiteUrl();
      }
      websiteInput.value = randomWebsite;
      websiteInput.dispatchEvent(new Event('input', { bubbles: true }));
      websiteInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    const password = await getPasswordToFill();
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
      name: nameFilled ? fullName : null,
      phone: phoneInput ? randomPhone : null,
      website: websiteInput ? randomWebsite : null,
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

function fillSelectElement(selectElement) {
  const options = Array.from(selectElement.options);
  const validOptions = options.filter(option => 
    !option.disabled && 
    option.value && 
    option.value.trim() !== '' && 
    !/select|choose|pick/i.test(option.textContent)
  );

  if (validOptions.length > 0) {
    const randomOption = validOptions[Math.floor(Math.random() * validOptions.length)];
    selectElement.value = randomOption.value;
  }
}

function findOtpInputs() {
    // First, look for the standard autocomplete attribute
    const oneTimeCodeInput = document.querySelector('input[autocomplete="one-time-code"]');
    if (oneTimeCodeInput) {
        return [oneTimeCodeInput];
    }

    const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="number"], input:not([type])');
    let otpInputs = [];

    // Heuristics to find OTP inputs
    const keywords = ['otp', 'verification', 'code', 'pin', '2fa', 'two-factor', 'totp', 'mfa'];
    
    const visibleInputs = Array.from(inputs).filter(input => {
        if (input.type === 'hidden' || input.disabled || input.readOnly) return false;
        const rect = input.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    });

    for (const input of visibleInputs) {
        const id = (input.id || '').toLowerCase();
        const name = (input.name || '').toLowerCase();
        const placeholder = (input.placeholder || '').toLowerCase();
        const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
        const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();

        for (const keyword of keywords) {
            if (id.includes(keyword) || name.includes(keyword) || placeholder.includes(keyword) || ariaLabel.includes(keyword) || autocomplete.includes(keyword)) {
                otpInputs.push(input);
                break; 
            }
        }
    }
    
    if (otpInputs.length > 0) {
        return otpInputs;
    }
    
    // Look for a group of inputs that are likely for OTPs (e.g., 6 single-digit inputs)
    const allInputs = Array.from(document.querySelectorAll('input'));
    let potentialOtpGroup = [];
    for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        if (input.type !== 'text' && input.type !== 'tel' && input.type !== 'number') {
            if (potentialOtpGroup.length >= 4 && potentialOtpGroup.length <= 8) {
                return potentialOtpGroup;
            }
            potentialOtpGroup = [];
            continue;
        };
        if (input.maxLength === 1 && (input.nextElementSibling?.tagName === 'INPUT' || input.previousElementSibling?.tagName === 'INPUT')) {
            potentialOtpGroup.push(input);
        } else {
            if (potentialOtpGroup.length >= 4 && potentialOtpGroup.length <= 8) {
                return potentialOtpGroup;
            }
            potentialOtpGroup = [];
        }
    }
    if (potentialOtpGroup.length >= 4 && potentialOtpGroup.length <= 8) {
        return potentialOtpGroup;
    }

    return [];
}

function fillOtp(otp) {
    const inputs = findOtpInputs();
    if (inputs.length === 0) {
        console.log('No OTP input field found.');
        return;
    }

    if (inputs.length === 1) {
        // Single input field for the whole OTP
        const input = inputs[0];
        input.value = otp;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        showTooltip(input, 'OTP Filled!', false);
    } else if (inputs.length > 1 && inputs.length >= otp.length) {
        // Multiple input fields, one for each digit
        for (let i = 0; i < otp.length; i++) {
            const input = inputs[i];
            if(input) {
                input.value = otp[i];
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        showTooltip(inputs[inputs.length - 1], 'OTP Filled!', false);
    } else {
        console.log('Found OTP inputs, but could not decide how to fill.', { numInputs: inputs.length, otpLength: otp.length });
    }
}

async function getPasswordToFill() {
  const { passwordSettings = {} } = await chrome.storage.local.get(['passwordSettings']);
  if (passwordSettings.useCustom && passwordSettings.customPassword) {
    return passwordSettings.customPassword;
  }
  return generatePassword();
}

async function getNamesToFill() {
  const { nameSettings = {} } = await chrome.storage.local.get(['nameSettings']);
  if (nameSettings.useCustom && nameSettings.firstName && nameSettings.lastName) {
    return {
      firstName: nameSettings.firstName,
      lastName: nameSettings.lastName,
      fullName: `${nameSettings.firstName} ${nameSettings.lastName}`
    };
  }
  const randomFullName = generateRandomName();
  const [randomFirstName, randomLastName] = randomFullName.split(' ');
  return {
    firstName: randomFirstName,
    lastName: randomLastName,
    fullName: randomFullName
  };
}
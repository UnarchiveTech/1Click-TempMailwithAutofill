// Mail Provider Types
type MailProvider = 'guerrilla' | 'burner';

interface ProviderConfig {
  name: string;
  displayName: string;
  apiUrl: string;
  type: 'guerrilla' | 'burner';
}

interface BurnerInstance {
  id: string;
  name: string;
  displayName: string;
  apiUrl: string;
  isCustom?: boolean;
}

// Predefined Burner.kiwi instances
const PREDEFINED_BURNER_INSTANCES: BurnerInstance[] = [
  {
    id: 'alphac',
    name: 'alphac',
    displayName: 'Alphac Mail',
    apiUrl: 'https://alphac.qzz.io/api/v2'
  },
  {
    id: 'raceco',
    name: 'raceco',
    displayName: 'Raceco Mail',
    apiUrl: 'https://raceco.dpdns.org/api/v2'
  },
  {
    id: 'burnerkiwi',
    name: 'burner.kiwi',
    displayName: 'Burner.Kiwi',
    apiUrl: 'https://burner.kiwi/api/v2'
  }
];

const PROVIDERS: Record<MailProvider, ProviderConfig> = {
  guerrilla: {
    name: 'guerrilla',
    displayName: 'Guerrilla Mail',
    apiUrl: 'https://api.guerrillamail.com/ajax.php',
    type: 'guerrilla'
  },
  burner: {
    name: 'burner',
    displayName: 'Burner.kiwi',
    apiUrl: '', // Will be set based on selected instance
    type: 'burner'
  }
};

interface Analytics {
  createdAt?: number;
  inboxesCreated?: number;
  emailsReceived?: number;
  otpsDetected?: number;
  notificationsSent?: number;
}

interface Inbox {
  id: string;
  address: string;
  token?: string; // For raceco
  sidToken?: string; // For guerrilla - each inbox has its own sid_token
  lastSequence?: number; // For guerrilla - track last sequence number to fetch only new emails
  provider: MailProvider;
  createdAt: number;
  expiresAt: number;
  expiryNotified?: boolean;
  autoExtend?: boolean; // For per-inbox auto-extend setting
}

interface Message {
  id: string;
  subject?: string;
  body_html?: string;
  body_plain?: string;
  from_name?: string;
  received_at: number;
  otp?: string;
}

interface NotificationSettings {
  enabled: boolean;
}

interface SessionCredentials {
  website?: string;
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  phone?: string;
}

interface EmailFilters {
  searchQuery?: string;
  hasOTP?: boolean;
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log('1Click: Temp Mail with Autofill extension installed');
  
  // Perform hard reset on install or enable (fresh start)
  if (details.reason === 'install' || details.reason === 'enable') {
    console.log('Fresh installation detected - performing hard reset');
    performHardReset().then(() => {
      initializeAnalytics();
      setupPeriodicEmailCheck();
      setupInboxExpiryCheck();
      initializeDefaultProvider();
    });
  } else {
    // Normal update - just initialize
    initializeAnalytics();
    setupPeriodicEmailCheck();
    setupInboxExpiryCheck();
    initializeDefaultProvider();
  }
});

// Perform hard reset - clear all stored data
async function performHardReset(): Promise<void> {
  try {
    console.log('Starting hard reset - clearing all extension data');
    
    // Clear all storage keys used by the extension
    const storageKeys = [
      'inboxes',
      'activeInboxId',
      'analytics',
      'selectedProvider',
      'selectedBurnerInstance',
      'customBurnerInstances',
      'notificationSettings',
      'storedEmails',
      'archivedEmails',
      'seenEmailIds',
      'lastMessageTimestamps',
      'emailHistory',
      'credentialsHistory',
      'darkMode',
      'passwordSettings',
      'nameSettings',
      'autoCopy',
      'loginInfo',
      'forceNewSessions',
      'forceNewSessionsTimestamp',
      'firstTimeOpened'
    ];
    
    // Remove all keys
    await chrome.storage.local.remove(storageKeys);
    
    // Also clear any remaining data by getting all keys and removing them
    const allData = await chrome.storage.local.get(null);
    const remainingKeys = Object.keys(allData);
    if (remainingKeys.length > 0) {
      await chrome.storage.local.remove(remainingKeys);
      console.log(`Cleared ${remainingKeys.length} additional storage keys:`, remainingKeys);
    }
    
    console.log('Hard reset completed - all extension data cleared');
  } catch (error) {
    console.error('Error during hard reset:', error);
  }
}

// Initialize default provider if not set
async function initializeDefaultProvider(): Promise<void> {
  try {
    const { selectedProvider } = await chrome.storage.local.get(['selectedProvider']);
    if (!selectedProvider) {
      await chrome.storage.local.set({ selectedProvider: 'burner' });
      console.log('Set default provider to burner');
    }
    
    // Also initialize default burner instance if not set
    const { selectedBurnerInstance } = await chrome.storage.local.get(['selectedBurnerInstance']);
    if (!selectedBurnerInstance) {
      await chrome.storage.local.set({ selectedBurnerInstance: PREDEFINED_BURNER_INSTANCES[1].id });
      console.log('Set default burner instance to:', PREDEFINED_BURNER_INSTANCES[1].id);
    }
    // Verify storage
    const { selectedBurnerInstance: storedInstance } = await chrome.storage.local.get(['selectedBurnerInstance']);
    console.log('Stored selectedBurnerInstance:', storedInstance);
  } catch (error) {
    console.error('Error initializing default provider:', error);
  }
}

// Initialize analytics storage
async function initializeAnalytics(): Promise<void> {
  try {
    const { analytics = {} }: { analytics: Analytics } = await chrome.storage.local.get(['analytics']);
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
function setupPeriodicEmailCheck(): void {
  chrome.alarms.create('checkEmails', {
    periodInMinutes: 0.5 // Check every 30 seconds
  });
  
  // Setup daily cleanup of old stored emails
  chrome.alarms.create('cleanupStoredEmails', {
    periodInMinutes: 1440 // Run once per day (24 hours)
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
    } else if (alarm.name === 'cleanupStoredEmails') {
      try {
        await cleanupOldStoredEmails();
      } catch (error) {
        console.error('Error in stored emails cleanup:', error);
      }
    }
  });
}

// Auto-renew Guerrilla Mail inbox by extending its expiry
async function autoRenewGuerrillaInbox(inbox: Inbox): Promise<void> {
  try {
    if (!inbox.sidToken) {
      throw new Error('No sidToken available for renewal');
    }
    
    const currentUser = inbox.address.split('@')[0];
    
    // Step 1: Get a new email address to obtain a fresh sidToken
    const newEmailResponse = await guerrillaApiCall('get_email_address');
    if (!newEmailResponse.sid_token) {
      throw new Error('Failed to get fresh sidToken for renewal');
    }
    
    const newSidToken = newEmailResponse.sid_token;
    
    // Step 2: Use the new sidToken to set the original email address
    const setUserResponse = await guerrillaApiCall('set_email_user', 
      { email_user: currentUser }, 
      'POST', 
      newSidToken
    );
    
    if (!setUserResponse.email_addr || setUserResponse.email_addr !== inbox.address) {
      throw new Error('Failed to restore original email address during renewal');
    }
    
    // Step 3: Update the inbox with new sidToken and extended expiry
    const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
    const inboxIndex = inboxes.findIndex(i => i.id === inbox.id);
    
    if (inboxIndex !== -1) {
      inboxes[inboxIndex] = {
        ...inboxes[inboxIndex],
        sidToken: newSidToken,
        expiresAt: (setUserResponse.email_timestamp + 3600) * 1000, // Extend by 1 hour
        expiryNotified: false // Reset notification flag
      };
      
      await chrome.storage.local.set({ inboxes });
      console.log('Successfully auto-renewed Guerrilla Mail inbox:', inbox.address);
    } else {
      throw new Error('Inbox not found in storage during renewal');
    }
  } catch (error) {
    console.error('Error auto-renewing Guerrilla Mail inbox:', error);
    throw error;
  }
}

// Setup periodic inbox expiry checking
function setupInboxExpiryCheck(): void {
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
        let updatedInboxes = [...inboxes];
        
        for (let i = 0; i < updatedInboxes.length; i++) {
          const inbox = updatedInboxes[i];
          if (inbox.expiresAt && inbox.expiresAt <= now) {
            // Check if auto-extend is enabled for this specific inbox
            if (inbox.autoExtend && inbox.provider === 'guerrilla') {
              try {
                console.log('Auto-renewing expired Guerrilla Mail address:', inbox.address);
                await autoRenewGuerrillaInbox(inbox);
                
                // Update the inbox in the array with new expiry time
                const { inboxes: refreshedInboxes = [] } = await chrome.storage.local.get(['inboxes']);
                const refreshedInbox = refreshedInboxes.find(i => i.id === inbox.id);
                if (refreshedInbox) {
                  updatedInboxes[i] = refreshedInbox;
                }
                
                if (notificationSettings.enabled) {
                  chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Inbox Auto-Renewed',
                    message: `The inbox ${inbox.address} has been automatically renewed.`,
                    priority: 1
                  });
                }
                continue;
              } catch (error) {
                console.error('Failed to auto-renew inbox:', inbox.address, error);
                // Fall through to normal expiry handling if auto-renewal fails
              }
            }
            
            await deleteInbox(inbox.id, true); // Preserve emails when inbox expires automatically
            if (notificationSettings.enabled) {
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Inbox Expired',
                message: `The inbox ${inbox.address} has expired. Emails have been archived for future access.`,
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
            updatedInboxes[i] = { ...inbox, expiryNotified: true };
          }
        }
        
        await chrome.storage.local.set({ inboxes: updatedInboxes });
      } catch (error) {
        console.error('Error in periodic inbox expiry check:', error);
      }
    }
  });
}

// Guerrilla Mail API helper
async function guerrillaApiCall(func: string, params: Record<string, any> = {}, method: string = 'GET', sidToken?: string): Promise<any> {
  console.log('=== GUERRILLA API CALL START ===');
  console.log('Function:', func);
  console.log('Input params:', params);
  
  // Use only the provided sidToken - no global fallback
  const currentSidToken = sidToken;
  if (currentSidToken) {
    console.log('Using provided sidToken:', currentSidToken);
  } else {
    console.log('No sidToken provided - this is expected for get_email_address');
  }
  
  // Build URL parameters based on function type
  const urlParams = new URLSearchParams({ f: func });
  
  // Only add ip and agent for get_email_address and set_email_user
  if (func === 'get_email_address' || func === 'set_email_user') {
    urlParams.append('ip', '127.0.0.1');
    urlParams.append('agent', '1ClickExt');
    console.log('Added ip and agent for', func);
  }
  
  // Add sid_token if available (but not for get_email_address which returns sid_token)
  if (currentSidToken && func !== 'get_email_address') {
    urlParams.append('sid_token', currentSidToken);
    console.log('Added sid_token to request:', currentSidToken);
  } else {
    console.log('No sid_token sent for', func, '- either not available or not needed');
  }
  
  // Add other parameters
  Object.entries(params).forEach(([key, value]) => {
    urlParams.append(key, value);
    console.log(`Added param ${key}:`, value);
  });

  console.log('Final API URL:', `${PROVIDERS.guerrilla.apiUrl}?${urlParams.toString()}`);

  // Check if we should force new sessions (after hard reset)
  const storage = await chrome.storage.local.get(['forceNewSessions']);
  const shouldForceNewSession = storage.forceNewSessions === true;
  
  // Use credentials: 'omit' for fresh sessions, and add cache-busting for get_email_address
  const fetchOptions: RequestInit = {
    method: method,
    credentials: shouldForceNewSession ? 'omit' : 'include',
    cache: shouldForceNewSession ? 'no-cache' : 'default',
  };
  
  // Add headers to break persistent connections when forcing new sessions
  if (shouldForceNewSession) {
    fetchOptions.headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }
  
  // Add multiple cache-busting and session-breaking parameters when forcing new sessions
  if (shouldForceNewSession && func === 'get_email_address') {
    urlParams.append('_t', Date.now().toString());
    urlParams.append('_r', Math.random().toString(36).substring(7));
    urlParams.append('_fresh', '1');
    console.log('Added cache-busting and session-breaking parameters for fresh session');
  }
  
  if (shouldForceNewSession) {
    console.log('Using credentials: omit and no-cache to force fresh session (post hard reset)');
  } else {
    console.log('Using credentials: include for normal session management');
  }

  const response = await fetch(`${PROVIDERS.guerrilla.apiUrl}?${urlParams.toString()}`, fetchOptions);

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    console.error('HTTP error! status:', response.status);
    throw new Error(`API call failed with status ${response.status}`);
  }

  // Guerrilla Mail uses a session token that we must manage manually.
  // It can be returned in the JSON body, so we extract and save it.
  const data = await response.json();
  
  console.log('=== DETAILED API RESPONSE ===');
  console.log('Function called:', func);
  console.log('Raw API response:', JSON.stringify(data, null, 2));
  console.log('Response keys:', Object.keys(data));
  
  if (data.sid_token) {
    console.log('New sid_token received (will be stored with specific inbox):', data.sid_token);
    // Note: sid_token is now stored per-inbox, not globally
  } else {
    console.log('No sid_token in response');
  }

  if (data.error) {
    console.error('API returned error:', data.error);
    console.error('Error details:', JSON.stringify(data, null, 2));
  }
  
  // Log specific response fields based on function
  if (func === 'get_email_address') {
    console.log('EMAIL ADDRESS CREATION:');
    console.log('- Email:', data.email_addr);
    console.log('- SID Token:', data.sid_token);
    console.log('- Timestamp:', data.email_timestamp);
  } else if (func === 'check_email') {
    console.log('EMAIL LIST CHECK:');
    console.log('- Count:', data.count);
    console.log('- List length:', data.list ? data.list.length : 0);
    console.log('- Email list:', data.list);
  } else if (func === 'fetch_email') {
    console.log('EMAIL FETCH:');
    console.log('- Mail ID:', data.mail_id);
    console.log('- Subject:', data.mail_subject);
    console.log('- From:', data.mail_from);
    console.log('- Timestamp:', data.mail_timestamp);
    console.log('- Body length:', data.mail_body ? data.mail_body.length : 0);
  }
  
  console.log('=== END DETAILED API RESPONSE ===');
  
  // Keep forceNewSessions flag for multiple calls, but set a timestamp to auto-clear after 5 minutes
  if (shouldForceNewSession && response.ok) {
    const storage = await chrome.storage.local.get(['forceNewSessionsTimestamp']);
    const now = Date.now();
    
    if (!storage.forceNewSessionsTimestamp) {
      // Set timestamp on first successful call
      await chrome.storage.local.set({ forceNewSessionsTimestamp: now });
      console.log('Set forceNewSessions timestamp for auto-cleanup');
    } else if (now - storage.forceNewSessionsTimestamp > 5 * 60 * 1000) {
      // Clear after 5 minutes
      console.log('Clearing forceNewSessions flag after 5 minutes');
      await chrome.storage.local.remove(['forceNewSessions', 'forceNewSessionsTimestamp']);
    }
  }
  
  console.log('=== GUERRILLA API CALL END ===');
  
  return data;
}

// Burner.kiwi instance management
async function getBurnerInstances(): Promise<BurnerInstance[]> {
  const { customBurnerInstances = [] } = await chrome.storage.local.get(['customBurnerInstances']);
  const instances = [...PREDEFINED_BURNER_INSTANCES, ...customBurnerInstances];
  console.log('Burner instances:', instances.map(i => ({ id: i.id, name: i.name })));
  return instances;
}

async function addCustomBurnerInstance(instance: Omit<BurnerInstance, 'id' | 'isCustom'>): Promise<void> {
  const { customBurnerInstances = [] } = await chrome.storage.local.get(['customBurnerInstances']);
  const newInstance: BurnerInstance = {
    ...instance,
    id: `custom_${Date.now()}`,
    isCustom: true
  };
  customBurnerInstances.push(newInstance);
  await chrome.storage.local.set({ customBurnerInstances });
}

async function removeCustomBurnerInstance(instanceId: string): Promise<void> {
  const { customBurnerInstances = [] } = await chrome.storage.local.get(['customBurnerInstances']);
  const filtered = customBurnerInstances.filter((instance: BurnerInstance) => instance.id !== instanceId);
  await chrome.storage.local.set({ customBurnerInstances: filtered });
}

async function getSelectedBurnerInstance(): Promise<BurnerInstance | null> {
  const { selectedBurnerInstance } = await chrome.storage.local.get(['selectedBurnerInstance']);
  console.log('Retrieved selectedBurnerInstance:', selectedBurnerInstance);
  if (!selectedBurnerInstance || typeof selectedBurnerInstance !== 'string') {
    console.log('Invalid or missing selectedBurnerInstance, resetting to default');
    await chrome.storage.local.set({ selectedBurnerInstance: PREDEFINED_BURNER_INSTANCES[1].id });
    return PREDEFINED_BURNER_INSTANCES[1];
  }
  
  const instances = await getBurnerInstances();
  console.log('Available instances:', instances.map(i => ({ id: i.id, name: i.name })));
  const selected = instances.find(instance => instance.id === selectedBurnerInstance) || null;
  if (!selected) {
    console.log('No matching instance found, resetting to default');
    await chrome.storage.local.set({ selectedBurnerInstance: PREDEFINED_BURNER_INSTANCES[1].id });
    return PREDEFINED_BURNER_INSTANCES[1];
  }
  console.log('Selected instance:', selected);
  return selected;
}

// Set a specific burner instance by ID
async function setBurnerInstance(instanceId: string): Promise<void> {
  console.log('Setting burner instance to:', instanceId);
  const instances = await getBurnerInstances();
  const instance = instances.find(i => i.id === instanceId);
  if (!instance) {
    throw new Error(`Burner instance with ID '${instanceId}' not found`);
  }
  await chrome.storage.local.set({ selectedBurnerInstance: instanceId });
  console.log('Successfully set burner instance to:', instance.displayName);
}

// Create inbox based on selected provider
async function createInbox(provider?: MailProvider, emailUser?: string): Promise<Inbox> {
  try {
    const { selectedProvider = 'burner' } = await chrome.storage.local.get(['selectedProvider']);
    const activeProvider = provider || selectedProvider;

    let inbox: Inbox;

    if (activeProvider === 'guerrilla') {
      console.log('=== CREATING GUERRILLA INBOX ===');
      console.log('Email user provided:', emailUser);
      
      // Check if we have existing inboxes and if this might be a session persistence issue
      const { inboxes: existingInboxes = [] } = await chrome.storage.local.get(['inboxes']);
      const hasExistingGuerrillaInboxes = existingInboxes.some((i: Inbox) => i.provider === 'guerrilla');
      
      if (hasExistingGuerrillaInboxes) {
        console.log('Found existing Guerrilla inboxes, forcing fresh session to avoid duplicates');
        // Force fresh session by using no-cache credentials
        forceNoCache = true;
      }
      
      // Get email data from Guerrilla Mail API - always use get_email_address
      // Each call to get_email_address creates a new email address with unique sid_token
      const data = await guerrillaApiCall('get_email_address');
      console.log('=== API RESPONSE FOR get_email_address ===');
      console.log('Full response data:', JSON.stringify(data, null, 2));
      console.log('Email address:', data.email_addr);
      console.log('SID Token:', data.sid_token);
      console.log('Email timestamp:', data.email_timestamp);
      console.log('=== END API RESPONSE ===');

      console.log('Email data received:', data);
      
      if (!data.email_addr) {
        console.error('Missing email_addr in response:', data);
        throw new Error('Failed to get email address from Guerrilla Mail API');
      }

      console.log('Creating inbox object with email:', data.email_addr);
      console.log('Storing sid_token with inbox:', data.sid_token);
      // Create inbox object
      inbox = {
        id: data.email_addr,
        address: data.email_addr,
        provider: 'guerrilla',
        sidToken: data.sid_token, // Store the sid_token with this specific inbox
        createdAt: Date.now(),
        expiresAt: (data.email_timestamp + 3600) * 1000, // 60 minutes expiration (for mails only, email address dont expire)
        autoExtend: true // Enable auto-extend by default for Guerrilla Mail
      };

      
      console.log('Created inbox object:', inbox);
    } else if (activeProvider === 'burner') {
      console.log('Attempting to create Burner.kiwi inbox');
      const selectedInstance = await getSelectedBurnerInstance();
      console.log('Selected instance result:', selectedInstance);
      if (!selectedInstance) {
        console.error('No Burner.kiwi instance selected');
        throw new Error('No Burner.kiwi instance selected. Please select an instance first.');
      }
      console.log('Selected instance:', selectedInstance.displayName);
      console.log('API URL:', selectedInstance.apiUrl);

      console.log('=== CREATING BURNER INBOX ===');
      console.log('Selected instance:', selectedInstance.displayName);
      console.log('API URL:', selectedInstance.apiUrl);

      const response = await fetch(`${selectedInstance.apiUrl}/inbox`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to create inbox on ${selectedInstance.displayName}`);
      }

      const data: any = await response.json();
      if (!data.success) {
        throw new Error(data.errors?.msg || `Failed to create inbox on ${selectedInstance.displayName}`);
      }

      const { email, token } = data.result;
      inbox = {
        id: email.id,
        address: email.address,
        token,
        provider: 'burner',
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiry
        expiryNotified: false
      };

      console.log('Created burner inbox:', inbox);
    } else {
      throw new Error(`Unsupported provider: ${activeProvider}`);
    }

    const { inboxes = [], seenEmailIds = {} }: { inboxes: Inbox[], seenEmailIds: Record<string, string[]> } = await chrome.storage.local.get(['inboxes', 'seenEmailIds']);

    // Check if inbox already exists to avoid duplicates
    console.log('Checking for duplicate inboxes...');
    console.log('Existing inboxes:', inboxes.map(i => ({ address: i.address, provider: i.provider })));
    
    const existingInbox = inboxes.find(existingInbox => existingInbox.address === inbox.address);
    console.log('Is duplicate?', !!existingInbox);

    if (existingInbox) {
      console.log('Duplicate found, checking if we should reuse or create new');
      
      if (activeProvider === 'guerrilla') {
        // For Guerrilla Mail, if we get a duplicate, it means the API returned an existing address
        // This can happen after extension restart due to session persistence
        // Instead of throwing an error, we should reuse the existing inbox if it's still valid
        const now = Date.now();
        const isExpired = existingInbox.expiresAt && now > existingInbox.expiresAt;
        
        if (!isExpired) {
          console.log('Reusing existing valid Guerrilla Mail inbox:', existingInbox.address);
          // Update the existing inbox with the new session token if provided
          if (inbox.sidToken) {
            existingInbox.sidToken = inbox.sidToken;
            console.log('Updated existing inbox with new sidToken:', inbox.sidToken);
            
            // Update the inbox in storage
            const inboxIndex = inboxes.findIndex(i => i.address === existingInbox.address);
            if (inboxIndex !== -1) {
              inboxes[inboxIndex] = existingInbox;
              await chrome.storage.local.set({ inboxes });
            }
          }
          return existingInbox;
        } else {
           console.log('Existing inbox is expired, removing it and creating new one');
           // Remove the expired inbox and continue with creating a new one
           const updatedInboxes = inboxes.filter(i => i.address !== existingInbox.address);
           await chrome.storage.local.set({ inboxes: updatedInboxes });
           // Update the local inboxes array for the rest of this function
           inboxes.length = 0;
           inboxes.push(...updatedInboxes);
         }
      } else if (activeProvider === 'guerrilla') {
        // If we still get a duplicate for Guerrilla Mail after all checks, try to get a fresh address
        console.log('Guerrilla Mail returned duplicate address, attempting to get fresh address');
        try {
          // Force a completely fresh session by calling forget_me first, then get new address
          await guerrillaApiCall('forget_me', { email_addr: inbox.address });
          console.log('Called forget_me for duplicate address, now getting fresh address');
          
          // Get a completely new address
          const freshData = await guerrillaApiCall('get_email_address');
          if (freshData.email_addr && freshData.email_addr !== inbox.address) {
            console.log('Successfully got fresh address:', freshData.email_addr);
            // Update the inbox object with fresh data
            inbox.address = freshData.email_addr;
            inbox.id = freshData.email_addr;
            inbox.sidToken = freshData.sid_token;
            inbox.expiresAt = (freshData.email_timestamp + 3600) * 1000;
            
            // Check again if this new address is a duplicate
            const stillDuplicate = inboxes.find(i => i.address === inbox.address);
            if (!stillDuplicate) {
              console.log('Fresh address is unique, proceeding with creation');
            } else {
              console.log('Fresh address is still duplicate, this indicates a deeper session issue');
              throw new Error(`Unable to create unique Guerrilla Mail inbox. Multiple attempts returned existing addresses. Please use the hard reset button to clear all session data.`);
            }
          } else {
            throw new Error('Failed to get fresh email address from Guerrilla Mail');
          }
        } catch (forgetError) {
          console.error('Error during forget_me call:', forgetError);
          throw new Error(`Unable to create new inbox: Guerrilla Mail session conflict. Please use the hard reset button to clear all session data.`);
        }
      } else {
        throw new Error(`Inbox with address ${inbox.address} already exists`);
      }
    }

    console.log('No duplicate found, adding new inbox to storage...');
    inboxes.push(inbox);
    seenEmailIds[inbox.address] = [];
    console.log('Inbox stored successfully');

    // Update analytics
    console.log('Updating analytics for inbox creation...');
    const { analytics = {} }: { analytics: Analytics } = await chrome.storage.local.get(['analytics']);
    analytics.inboxesCreated = (analytics.inboxesCreated || 0) + 1;
    await chrome.storage.local.set({ analytics });
    console.log('Analytics updated');

    await chrome.storage.local.set({ inboxes, seenEmailIds });

    return inbox;
  } catch (error) {
    console.error('Error creating inbox:', error);
    throw error;
  }
}

// Function to extract OTP from email content
function extractOTP(subject: string | undefined, body: string | undefined): string | null {
  const normalizedSubject = subject ? subject.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  let normalizedBody = body || '';
  if (normalizedBody) {
    normalizedBody = normalizedBody.replace(/<(style|script)[\s\S]*?>[\s\S]*?<\/(style|script)>/gi, '');
    normalizedBody = normalizedBody.replace(/<br\s*\/?>/gi, '\n');
    normalizedBody = normalizedBody.replace(/<p.*?>/gi, '\n');
    normalizedBody = normalizedBody.replace(/<div.*?>/gi, '\n');
    normalizedBody = normalizedBody.replace(/<h[1-6].*?>/gi, '\n');
    normalizedBody = normalizedBody.replace(/<[^>]+>/g, ' ');
    normalizedBody = normalizedBody.replace(/&nbsp;/gi, ' ');
    normalizedBody = normalizedBody.replace(/[ \t]+/g, ' ').trim();
    normalizedBody = normalizedBody.replace(/(\r\n|\r|\n){2,}/g, '\n');
  }

  console.log("--- OTP Extraction Debug ---");
  console.log("Original Body:", body);
  console.log("Normalized Body:", normalizedBody);
  console.log("--------------------------");

  let otp = findOtpInText(normalizedSubject, true);
  if (otp) {
    console.log('OTP found in subject:', otp);
    return otp;
  }

  otp = findOtpInText(normalizedBody, false);
  if (otp) {
    console.log('OTP found in body:', otp);
    return otp;
  }
  
  console.log('No OTP found matching the specified rules.');
  return null;
}

function findOtpInText(text: string, isSubject: boolean): string | null {
  if (!text) return null;
  
  const lowerCaseText = text.toLowerCase();
  
  const patterns = [
    /^\s*(?![a-zA-Z]{4,8}$)([a-zA-Z0-9]{4,8})\s*$/m,
    /(?:code|otp|pin|password|verification)[\s\S]{0,75}:\s*\b(?![a-zA-Z]{4,8}\b)([a-zA-Z0-9]{4,8})\b/i,
    /(?:your|this|the)?\s*(?:code|otp|pin|password|verification)\s*(?:is|below)[\s\S]{0,50}\b(?![a-zA-Z]{4,8}\b)([a-zA-Z0-9]{4,8})\b/i,
    /(?:one\s*time\s*password|verification\s*code|otp|code|pin)[\s\S]{0,50}\b(\d{3,8})\b/i,
  ];

  if (isSubject) {
    patterns.push(/\b(?![a-zA-Z]{3,8}\b)([a-zA-Z0-9]{3,8})\b/);
  }

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const capturedOtp = match ? (match[1] || match[2]) : null;
    if (capturedOtp) {
      const potentialOtp = capturedOtp.replace(/[- ]/g, '');
      if (potentialOtp.length >= 3 && potentialOtp.length <= 8) {
        return potentialOtp;
      }
    }
  }

  const hasExpirationLanguage = /(valid for|expires in|expire)/.test(lowerCaseText);
  if (hasExpirationLanguage) {
    const match = text.match(/\b(?![a-zA-Z]{3,8}\b)([a-zA-Z0-9]{3,8})\b/);
    if (match && match[0]) {
      return match[0];
    }
  }

  return null;
}

// Check for new messages based on provider
async function checkNewEmails(inboxId: string, filters: EmailFilters = {}): Promise<Message[]> {
  try {
    const { inboxes = [] }: { inboxes: Inbox[] } = await chrome.storage.local.get(['inboxes']);
    const inbox = inboxes.find(i => i.id === inboxId);
    if (!inbox) {
      throw new Error('Inbox not found');
    }

    let messages: Message[] = [];

    if (inbox.provider === 'guerrilla') {
      messages = await fetchGuerrillaEmails(inbox, filters);
    } else {
      messages = await fetchBurnerEmails(inbox, filters);
    }

    return messages;
  } catch (error) {
    console.error('Error checking emails:', error);
    throw error;
  }
}

// Fetch emails from Guerrilla Mail
async function fetchGuerrillaEmails(inbox: Inbox, filters: EmailFilters): Promise<Message[]> {
  console.log('=== FETCHING GUERRILLA EMAILS ===');
  console.log('Inbox:', inbox);
  
  if (!inbox.sidToken) {
    console.error('No sidToken found for inbox:', inbox.address);
    throw new Error('No sidToken available for this inbox');
  }
  
  console.log('Using inbox-specific sid_token:', inbox.sidToken);

  // Use stored sequence number or 0 for first check
  const sequenceNumber = inbox.lastSequence || 0;
  console.log('=== CALLING check_email API ===');
  console.log('Parameters: seq=' + sequenceNumber + ', sidToken=' + inbox.sidToken);
  const listData = await guerrillaApiCall('check_email', { seq: sequenceNumber }, 'GET', inbox.sidToken);
  console.log('=== check_email RESPONSE RECEIVED ===');
  console.log('Email list response:', JSON.stringify(listData, null, 2));
  
  const messages = listData.list || [];
  console.log('Found', messages.length, 'messages');

  // Get existing stored emails for this inbox
  const { storedEmails = {} } = await chrome.storage.local.get('storedEmails');
  if (!storedEmails[inbox.address]) {
    storedEmails[inbox.address] = [];
  }
  
  // Track which emails we've already stored to avoid duplicates
  const existingEmailIds = new Set(storedEmails[inbox.address].map((email: any) => email.id));
  const newMessages = messages.filter((msg: any) => !existingEmailIds.has(msg.mail_id));
  
  console.log(`Found ${messages.length} total messages, ${newMessages.length} are new`);

  // Only fetch details for new messages to avoid unnecessary API calls
  const newDetailedMessages = await Promise.all(
    newMessages.map(async (msg: any) => {
      console.log('=== CALLING fetch_email API ===');
      console.log('Parameters: email_id=' + msg.mail_id + ', sidToken=' + inbox.sidToken);
      const emailData = await guerrillaApiCall('fetch_email', { email_id: msg.mail_id }, 'GET', inbox.sidToken);
      console.log('=== fetch_email RESPONSE RECEIVED ===');
      console.log('Email details received:', JSON.stringify(emailData, null, 2));
      
      const otp = extractOTP(emailData.mail_subject, emailData.mail_body);
      console.log('Extracted OTP:', otp);

      // Handle Guerrilla Mail timestamp - prioritize mail_date over mail_timestamp
      let timestamp = null;
      
      // First, try to use mail_date if it's in full datetime format (YYYY-MM-DD HH:MM:SS)
      if (emailData.mail_date && typeof emailData.mail_date === 'string') {
        if (emailData.mail_date.includes('-') && emailData.mail_date.includes(' ')) {
          // Full datetime format: "2025-09-01 14:06:58"
          const parsedDate = new Date(emailData.mail_date);
          if (!isNaN(parsedDate.getTime())) {
            timestamp = Math.floor(parsedDate.getTime() / 1000);
          }
        } else if (emailData.mail_date.includes(':')) {
          // Time-only format: "HH:MM:SS" - combine with today's date
          const today = new Date();
          const [hours, minutes, seconds] = emailData.mail_date.split(':').map(Number);
          
          if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
            const emailDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);
            timestamp = Math.floor(emailDate.getTime() / 1000);
          }
        }
      }
      
      // If mail_date didn't work, try mail_timestamp
      if (!timestamp && emailData.mail_timestamp) {
        let mailTimestamp = emailData.mail_timestamp;
        
        if (typeof mailTimestamp === 'string') {
          // Try to parse as Unix timestamp first
          const numericTimestamp = parseInt(mailTimestamp, 10);
          if (!isNaN(numericTimestamp) && numericTimestamp > 0) {
            mailTimestamp = numericTimestamp;
          } else {
            // Try to parse as date string
            const parsedDate = new Date(mailTimestamp);
            if (!isNaN(parsedDate.getTime())) {
              mailTimestamp = Math.floor(parsedDate.getTime() / 1000);
            }
          }
        }
        
        if (typeof mailTimestamp === 'number' && mailTimestamp > 0) {
          if (mailTimestamp > 1e10) {
            // If timestamp is in milliseconds, convert to seconds
            timestamp = Math.floor(mailTimestamp / 1000);
          } else {
            timestamp = mailTimestamp;
          }
        }
      }
      
      // If still no valid timestamp, use fallback
      if (!timestamp || timestamp === 0) {
        timestamp = listData.ts || Math.floor(Date.now() / 1000);
      }
      
      const processedMessage = {
        id: emailData.mail_id,
        from_name: emailData.mail_from,
        subject: emailData.mail_subject,
        body_html: emailData.mail_body,
        body_plain: emailData.mail_excerpt,
        received_at: timestamp,
        otp: otp,
        stored_at: Date.now() // Track when we stored this email
      };
      
      console.log('Processed message:', processedMessage);
      
      // Validate the processed message has required fields
      if (!processedMessage.id || !processedMessage.from_name || !processedMessage.subject) {
        console.warn('Message missing required fields:', processedMessage);
      }
      
      return processedMessage;
    })
  );
  
  // Store new messages persistently
  if (newDetailedMessages.length > 0) {
    storedEmails[inbox.address].push(...newDetailedMessages);
    
    // Sort by received_at timestamp (newest first)
    storedEmails[inbox.address].sort((a: any, b: any) => b.received_at - a.received_at);
    
    // Keep only the last 50 emails per inbox to prevent storage bloat
    if (storedEmails[inbox.address].length > 50) {
      storedEmails[inbox.address] = storedEmails[inbox.address].slice(0, 50);
    }
    
    await chrome.storage.local.set({ storedEmails });
    console.log(`Stored ${newDetailedMessages.length} new emails for ${inbox.address}`);
  }
  
  // Return all stored emails for this inbox (both existing and new)
  const allStoredMessages = storedEmails[inbox.address] || [];
  console.log(`Returning ${allStoredMessages.length} total stored emails for display`);
  
  console.log('All messages processed. New:', newDetailedMessages.length, 'Total stored:', allStoredMessages.length);

  // Update sequence number if we got new emails
  if (messages.length > 0) {
    // Get the highest mail_id as the new sequence number
    const maxMailId = Math.max(...messages.map((msg: any) => msg.mail_id));
    console.log('Updating sequence number from', sequenceNumber, 'to', maxMailId);
    
    // Update inbox with new sequence number
    const { inboxes = [] } = await chrome.storage.local.get('inboxes');
    const updatedInboxes = inboxes.map((inb: Inbox) => {
      if (inb.id === inbox.id) {
        return { ...inb, lastSequence: maxMailId };
      }
      return inb;
    });
    await chrome.storage.local.set({ inboxes: updatedInboxes });
    console.log('Sequence number updated and saved to storage');
  }

  return applyFiltersAndProcessMessages(allStoredMessages, filters, inbox);
}

// Get stored emails for an inbox
async function getStoredEmails(inboxAddress: string): Promise<Message[]> {
  const { storedEmails = {} } = await chrome.storage.local.get('storedEmails');
  return storedEmails[inboxAddress] || [];
}

// Clear stored emails for an inbox (useful when deleting inbox)
async function clearStoredEmails(inboxAddress: string): Promise<void> {
  const { storedEmails = {} } = await chrome.storage.local.get('storedEmails');
  delete storedEmails[inboxAddress];
  await chrome.storage.local.set({ storedEmails });
  console.log(`Cleared stored emails for ${inboxAddress}`);
}

// Archive emails when inbox expires (mark them as archived but keep them)
async function archiveInboxEmails(inboxAddress: string): Promise<void> {
  const { storedEmails = {}, archivedEmails = {} } = await chrome.storage.local.get(['storedEmails', 'archivedEmails']);
  
  if (storedEmails[inboxAddress] && storedEmails[inboxAddress].length > 0) {
    // Move emails from active storage to archived storage
    if (!archivedEmails[inboxAddress]) {
      archivedEmails[inboxAddress] = [];
    }
    
    // Mark emails as archived and add archive timestamp
    const emailsToArchive = storedEmails[inboxAddress].map((email: any) => ({
      ...email,
      archived: true,
      archived_at: Date.now(),
      original_inbox: inboxAddress
    }));
    
    archivedEmails[inboxAddress].push(...emailsToArchive);
    
    // Remove from active storage
    delete storedEmails[inboxAddress];
    
    await chrome.storage.local.set({ storedEmails, archivedEmails });
    console.log(`Archived ${emailsToArchive.length} emails for expired inbox: ${inboxAddress}`);
  }
}

// Get archived emails for an inbox
async function getArchivedEmails(inboxAddress?: string): Promise<Message[]> {
  const { archivedEmails = {} } = await chrome.storage.local.get('archivedEmails');
  
  if (inboxAddress) {
    return archivedEmails[inboxAddress] || [];
  }
  
  // Return all archived emails from all inboxes
  const allArchived: Message[] = [];
  for (const emails of Object.values(archivedEmails)) {
    allArchived.push(...(emails as Message[]));
  }
  
  // Sort by archived date (newest first)
  return allArchived.sort((a: any, b: any) => (b.archived_at || 0) - (a.archived_at || 0));
}

// Cleanup old stored emails (keep only last 30 days for active emails, 90 days for archived)
async function cleanupOldStoredEmails(): Promise<void> {
  const { storedEmails = {}, archivedEmails = {} } = await chrome.storage.local.get(['storedEmails', 'archivedEmails']);
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
  let totalCleaned = 0;
  
  // Clean up active stored emails (30 days)
  for (const [address, emails] of Object.entries(storedEmails)) {
    const emailArray = emails as any[];
    const filteredEmails = emailArray.filter((email: any) => {
      const emailAge = email.stored_at || email.received_at * 1000;
      return emailAge > thirtyDaysAgo;
    });
    
    if (filteredEmails.length !== emailArray.length) {
      storedEmails[address] = filteredEmails;
      totalCleaned += emailArray.length - filteredEmails.length;
    }
  }
  
  // Clean up archived emails (90 days)
  for (const [address, emails] of Object.entries(archivedEmails)) {
    const emailArray = emails as any[];
    const filteredEmails = emailArray.filter((email: any) => {
      const emailAge = email.archived_at || email.stored_at || email.received_at * 1000;
      return emailAge > ninetyDaysAgo;
    });
    
    if (filteredEmails.length !== emailArray.length) {
      archivedEmails[address] = filteredEmails;
      totalCleaned += emailArray.length - filteredEmails.length;
    }
  }
  
  if (totalCleaned > 0) {
    await chrome.storage.local.set({ storedEmails, archivedEmails });
    console.log(`Cleaned up ${totalCleaned} old emails (active: 30+ days, archived: 90+ days)`);
  }
}

// Fetch emails from Burner.kiwi instances
async function fetchBurnerEmails(inbox: Inbox, filters: EmailFilters): Promise<Message[]> {
  if (!inbox.token) {
    throw new Error('Inbox token not found');
  }

  const selectedInstance = await getSelectedBurnerInstance();
  if (!selectedInstance) {
    throw new Error('No Burner.kiwi instance selected');
  }

  const response = await fetch(`${selectedInstance.apiUrl}/inbox/${inbox.id}/messages`, {
    headers: {
      'X-Burner-Key': inbox.token
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const data: any = await response.json();
  if (!data.success) {
    throw new Error(data.errors?.msg || 'Failed to fetch messages');
  }

  let messages: Message[] = data.result || [];
  console.log(`Fetched ${messages.length} messages`);

  messages = messages.map(msg => {
    const otp = extractOTP(msg.subject || '', msg.body_html || msg.body_plain || '');
    return {
      ...msg,
      otp,
    };
  });

  return applyFiltersAndProcessMessages(messages, filters, inbox);
}

// Common function to apply filters and process messages
async function applyFiltersAndProcessMessages(messages: Message[], filters: EmailFilters, inbox: Inbox): Promise<Message[]> {
  const { notificationSettings = { enabled: true } }: { notificationSettings: NotificationSettings } = await chrome.storage.local.get(['notificationSettings']);
  
  // Check for new messages by comparing with stored messages
  const { lastMessageTimestamps = {} }: { lastMessageTimestamps: Record<string, number> } = await chrome.storage.local.get(['lastMessageTimestamps']);
  const lastTimestamp = lastMessageTimestamps[inbox.id] || 0;
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
    lastMessageTimestamps[inbox.id] = Math.max(...messages.map(msg => msg.received_at * 1000));
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

  // Update analytics for emails received and OTPs detected
  const { analytics = {} }: { analytics: Analytics } = await chrome.storage.local.get(['analytics']);
  const otpCount = messages.filter(msg => msg.otp).length;
  analytics.otpsDetected = (analytics.otpsDetected || 0) + otpCount;
  await chrome.storage.local.set({ analytics });

  // Apply filters
  let filteredMessages = messages;

  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    console.log('Applying search query:', query);
    filteredMessages = filteredMessages.filter(msg => {
      const subjectMatch = msg.subject && msg.subject.toLowerCase().includes(query);
      const fromMatch = msg.from_name && msg.from_name.toLowerCase().includes(query);
      const bodyMatch = msg.body_plain && msg.body_plain.toLowerCase().includes(query);
      return subjectMatch || fromMatch || bodyMatch;
    });
    console.log(`After search filter: ${filteredMessages.length} messages`);
  }

  if (filters.hasOTP) {
    console.log('Applying OTP filter');
    filteredMessages = filteredMessages.filter(msg => msg.otp && msg.otp.trim().length > 0);
    console.log(`After OTP filter: ${filteredMessages.length} messages`);
  }

  return filteredMessages;
}

interface DeleteInboxResult {
  success: boolean;
  error?: string;
}

// Delete an inbox
async function deleteInbox(inboxId: string, preserveEmails: boolean = true): Promise<DeleteInboxResult> {
  try {
    const { inboxes = [] }: { inboxes: Inbox[] } = await chrome.storage.local.get(['inboxes']);
    const inbox = inboxes.find(i => i.id === inboxId);
    
    if (inbox && inbox.provider === 'guerrilla') {
      // For Guerrilla Mail, call the forget_me API
      try {
        await guerrillaApiCall('forget_me', { email_addr: inbox.address });
        // Reset the session state by getting a new address
        await guerrillaApiCall('get_email_address');
      } catch (error) {
        console.warn('Failed to call forget_me API, proceeding with local deletion:', error);
      }
    }
    // For raceco, we just remove it locally as there's no specific delete API mentioned

    const updatedInboxes = inboxes.filter(i => i.id !== inboxId);
    
    // Clean up related data
    const { seenEmailIds = {}, lastMessageTimestamps = {} } = await chrome.storage.local.get(['seenEmailIds', 'lastMessageTimestamps']);
    if (inbox) {
      delete seenEmailIds[inbox.address];
      delete lastMessageTimestamps[inboxId];
      
      // Only clear stored emails if explicitly requested (for manual deletion)
      // For expired inboxes, we preserve emails by default
      if (!preserveEmails) {
        await clearStoredEmails(inbox.address);
        console.log(`Cleared stored emails for deleted inbox: ${inbox.address}`);
      } else {
        // Mark emails as archived when inbox expires
        await archiveInboxEmails(inbox.address);
        console.log(`Archived emails for expired inbox: ${inbox.address}`);
      }
    }
    
    await chrome.storage.local.set({ 
      inboxes: updatedInboxes, 
      seenEmailIds,
      lastMessageTimestamps
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting inbox:', error);
    return { success: false, error: error.message };
  }
}

interface UpdateCredentialsMessage {
  type: 'updateSessionCredentials';
  credentials: Partial<SessionCredentials>;
}

interface MessageSender {
  tab?: chrome.tabs.Tab;
}

// Main handler for updating session credentials and auto-copying to clipboard
async function handleUpdateSessionCredentials(message: UpdateCredentialsMessage, sender: MessageSender): Promise<{ success: boolean }> {
  if (!sender.tab || !sender.tab.id) {
    throw new Error('Credentials can only be updated from a valid browser tab');
  }

  const { sessionCredentials = {} }: { sessionCredentials: SessionCredentials } = await chrome.storage.session.get('sessionCredentials');
  const { autoCopy = false }: { autoCopy: boolean } = await chrome.storage.local.get('autoCopy');

  const updatedCredentials = { ...sessionCredentials, ...message.credentials };
  await chrome.storage.session.set({ sessionCredentials: updatedCredentials });

  if (autoCopy) {
    const clipboardText = buildCredentialsStringForSession(updatedCredentials);
    await writeToClipboard(sender.tab.id, clipboardText);
  }

  return { success: true };
}

// Helper function to format credentials into a user-friendly clipboard format
function buildCredentialsStringForSession(credentials: SessionCredentials): string {
  const fieldOrder: (keyof SessionCredentials)[] = ['website', 'email', 'username', 'password', 'name', 'phone'];

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
    if (!fieldValue) {
      return null;
    }
    const fieldLabel = fieldLabels[fieldKey];
    return `${fieldLabel}: ${fieldValue}`;
  });

  const validFields = formattedFields.filter(Boolean);
  return validFields.join('\n');
}

// Helper function to safely copy text to clipboard in the active tab
async function writeToClipboard(tabId: number, text: string): Promise<void> {
  if (!text) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (textToCopy) => navigator.clipboard.writeText(textToCopy),
      args: [text]
    });
  } catch (error) {
    console.error('Failed to copy credentials to clipboard:', error);
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.type === 'createInbox') {
    (async () => {
      try {
        const { selectedProvider = 'burner' } = await chrome.storage.local.get(['selectedProvider']);
        const provider = message.provider || selectedProvider;
        const user = message.user || undefined;
        const inbox = await createInbox(provider, user);
        console.log('Inbox created:', inbox);
        sendResponse({ success: true, inbox });
      } catch (error) {
        console.error('Create inbox failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'checkEmails') {
    (async () => {
      try {
        console.log('Processing checkEmails request for:', message.inboxId);
        const messages = await checkNewEmails(message.inboxId, message.filters);
        console.log('Emails fetched:', messages.length);
        console.log('Sending response:', { success: true, messages });
        sendResponse({ success: true, messages });
      } catch (error) {
        console.error('Check emails failed:', error);
        console.log('Sending error response:', { success: false, error: error.message });
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'deleteInbox') {
    (async () => {
      try {
        const result = await deleteInbox(message.inboxId);
        console.log('Delete inbox result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('Delete inbox failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'getInboxes') {
    (async () => {
      try {
        const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
        console.log('Inboxes retrieved:', inboxes);
        sendResponse({ success: true, inboxes });
      } catch (error) {
        console.error('Get inboxes failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'setProvider') {
    (async () => {
      try {
        await chrome.storage.local.set({ selectedProvider: message.provider });
        console.log('Provider set to:', message.provider);
        sendResponse({ success: true });
      } catch (error) {
        console.error('Set provider failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'getProvider') {
    (async () => {
      try {
        const { selectedProvider = 'burner' } = await chrome.storage.local.get(['selectedProvider']);
        console.log('Current provider:', selectedProvider);
        sendResponse({ success: true, provider: selectedProvider });
      } catch (error) {
        console.error('Get provider failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
  
  if (message.type === 'clearSessionCredentials') {
    (async () => {
      try {
        await chrome.storage.session.remove('sessionCredentials');
        sendResponse({ success: true });
      } catch (error) {
        console.error('Failed to clear session credentials:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'updateSessionCredentials') {
    (async () => {
      try {
        const result = await handleUpdateSessionCredentials(message, sender);
        sendResponse(result);
      } catch (error) {
        console.error('Error updating session credentials:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'getAnalytics') {
    (async () => {
      try {
        const { analytics = {} } = await chrome.storage.local.get(['analytics']);
        console.log('Analytics retrieved:', analytics);
        sendResponse({ success: true, analytics });
      } catch (error) {
        console.error('Get analytics failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'getArchivedEmails') {
    (async () => {
      try {
        const archivedEmails = await getArchivedEmails(message.inboxAddress);
        sendResponse({ success: true, archivedEmails });
      } catch (error) {
        console.error('Get archived emails failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'hardReset') {
    console.log('Hard reset initiated from popup');
    
    // Handle async operations without blocking sendResponse
    (async () => {
      try {
        // Clear all Chrome alarms (persistent background timers)
        await chrome.alarms.clearAll();
        console.log('All Chrome alarms cleared');
        
        // Clear session storage as well
        await chrome.storage.session.clear();
        console.log('Session storage cleared');
        
        // Clear any cached network data by forcing a service worker restart
        try {
          // Clear any internal caches or session data
          if (self.caches) {
            const cacheNames = await self.caches.keys();
            for (const cacheName of cacheNames) {
              await self.caches.delete(cacheName);
              console.log(`Cleared service worker cache: ${cacheName}`);
            }
          }
        } catch (cacheError) {
          console.warn('Failed to clear service worker caches:', cacheError);
        }
        
        // Set a flag to indicate we've just reset (this will force fresh sessions)
        await chrome.storage.local.set({ 
          lastHardReset: Date.now(),
          forceNewSessions: true 
        });
        console.log('Set hard reset timestamp and force new sessions flag');
        
        // Re-setup alarms after clearing (they will be inactive until new inboxes are created)
        setupPeriodicEmailCheck();
        setupInboxExpiryCheck();
        console.log('Background alarms re-initialized');
        
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error during background hard reset:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep the message channel open for async response
  }

  if (message.action === 'getBurnerInstances') {
    (async () => {
      try {
        const instances = await getBurnerInstances();
        sendResponse({ success: true, instances });
      } catch (error) {
        console.error('Error getting Burner instances:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'renewGuerrillaInbox') {
    (async () => {
      try {
        const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
        const inbox = inboxes.find(i => i.id === message.inboxId);
        
        if (!inbox) {
          sendResponse({ success: false, error: 'Inbox not found' });
          return;
        }
        
        if (inbox.provider !== 'guerrilla') {
          sendResponse({ success: false, error: 'Only Guerrilla Mail addresses can be renewed' });
          return;
        }
        
        await autoRenewGuerrillaInbox(inbox);
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error renewing Guerrilla inbox:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'addCustomBurnerInstance') {
    (async () => {
      try {
        await addCustomBurnerInstance(message.instance);
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error adding custom Burner instance:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'removeCustomBurnerInstance') {
    (async () => {
      try {
        await removeCustomBurnerInstance(message.instanceId);
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error removing custom Burner instance:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'getSelectedBurnerInstance') {
    (async () => {
      try {
        const instance = await getSelectedBurnerInstance();
        sendResponse({ success: true, instance });
      } catch (error) {
        console.error('Error getting selected Burner instance:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'setSelectedBurnerInstance') {
    (async () => {
      try {
        console.log('Setting selected burner instance to:', message.instanceId);
        await chrome.storage.local.set({ selectedBurnerInstance: message.instanceId });
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error setting selected Burner instance:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'setBurnerInstance') {
    (async () => {
      try {
        console.log('Setting burner instance to:', message.instanceId);
        await chrome.storage.local.set({ selectedBurnerInstance: message.instanceId });
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error setting burner instance:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'initializeDefaultProvider') {
    (async () => {
      try {
        console.log('Initializing default provider');
        await initializeDefaultProvider();
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error initializing default provider:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'guerrillaApiCall') {
    (async () => {
      try {
        console.log('Processing guerrillaApiCall:', message.func);
        const data = await guerrillaApiCall(message.func, message.params || {}, 'GET', message.sidToken);
        console.log('guerrillaApiCall response:', data);
        sendResponse({ success: true, data });
      } catch (error) {
        console.error('guerrillaApiCall failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  console.warn('Unknown message type:', message.type);
  return false;
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'autofill-form') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'autofillForm' });
      }
    } catch (error) {
      console.error('Error executing autofill command:', error);
    }
  }
});
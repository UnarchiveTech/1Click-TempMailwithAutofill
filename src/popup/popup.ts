// QR code library will be loaded globally via script tag
declare const qrcodegen: any;

// Type definitions
interface Inbox {
  id: string;
  address: string;
  token?: string; // For raceco
  sidToken?: string; // For guerrilla - each inbox has its own sid_token
  lastSequence?: number; // For guerrilla - track last sequence number to fetch only new emails
  provider: string;
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

interface Filters {
  searchQuery: string;
  hasOTP: boolean;
}

interface BurnerInstance {
  id: string;
  name: string;
  displayName: string;
  apiUrl: string;
  isCustom?: boolean;
}

document.addEventListener('DOMContentLoaded', async () => {
  const inboxContainer = document.getElementById('inboxContainer') as HTMLElement;
  const inboxDropdown = document.getElementById('inboxDropdown') as HTMLElement;
  const dropdownSelected = inboxDropdown.querySelector('.dropdown-selected') as HTMLElement;
  const dropdownList = inboxDropdown.querySelector('.dropdown-list') as HTMLUListElement;
  const addInboxButton = document.getElementById('addInboxButton') as HTMLButtonElement;
  const copyEmailButton = document.getElementById('copyEmailButton') as HTMLButtonElement;
  const qrCodeButton = document.getElementById('qrCodeButton') as HTMLButtonElement;
  const startSignupButton = document.getElementById('startSignup') as HTMLButtonElement;
  const refreshMessagesButton = document.getElementById('refreshMessages') as HTMLButtonElement;
  const themeToggleButton = document.getElementById('themeToggle') as HTMLButtonElement;
  const messagesListElement = document.getElementById('messagesList') as HTMLElement;
  const messageDetailElement = document.getElementById('messageDetail') as HTMLElement;
  const messageDetailContentElement = document.getElementById('messageDetailContent') as HTMLElement;
  const backButton = document.getElementById('backButton') as HTMLButtonElement;
  const latestOtpContainer = document.getElementById('latestOtpContainer') as HTMLElement;
  const latestOtpCode = document.getElementById('latestOtpCode') as HTMLElement;
  const copyOtpButton = document.getElementById('copyOtpButton') as HTMLButtonElement;
  const otpContext = document.getElementById('otpContext') as HTMLElement;

  const reportIssueButton = document.getElementById('reportIssue') as HTMLButtonElement;
  const loginInfoButton = document.getElementById('loginInfoButton') as HTMLButtonElement;
  const loginInfoSection = document.querySelector('.login-info-section') as HTMLElement;
  const savedLoginInfo = document.getElementById('savedLoginInfo') as HTMLElement;
  const exportDataButton = document.getElementById('exportData') as HTMLButtonElement;
  const importDataButton = document.getElementById('importData') as HTMLButtonElement;
  const hardResetButton = document.getElementById('hardResetData') as HTMLButtonElement;
  const searchMessagesInput = document.getElementById('searchMessages') as HTMLInputElement;
  const otpFilterCheckbox = document.getElementById('otpFilter') as HTMLInputElement;
  const analyticsButton = document.getElementById('analyticsButton') as HTMLButtonElement;
  const analyticsSection = document.querySelector('.analytics-section') as HTMLElement;
  const analyticsDashboard = document.getElementById('analyticsDashboard') as HTMLElement;
  const notificationsToggle = document.getElementById('notificationsToggle') as HTMLButtonElement;
  const settingsButton = document.getElementById('settingsButton') as HTMLButtonElement;
  const settingsSection = document.querySelector('.settings-section') as HTMLElement;
  const useCustomPasswordToggle = document.getElementById('useCustomPasswordToggle') as HTMLInputElement;
  const customPasswordInput = document.getElementById('customPasswordInput') as HTMLInputElement;
  const customPasswordContainer = document.getElementById('customPasswordContainer') as HTMLElement;
  const useCustomNameToggle = document.getElementById('useCustomNameToggle') as HTMLInputElement;
  const customNameContainer = document.getElementById('customNameContainer') as HTMLElement;
  const customFirstNameInput = document.getElementById('customFirstNameInput') as HTMLInputElement;
  const customLastNameInput = document.getElementById('customLastNameInput') as HTMLInputElement;
  const autoCopyToggle = document.getElementById('autoCopyToggle') as HTMLInputElement;
  const autoRenewToggle = document.getElementById('autoRenewToggle') as HTMLInputElement;
  const providerSelect = document.getElementById('providerSelect') as HTMLSelectElement;
  const burnerInstanceContainer = document.getElementById('burnerInstanceContainer') as HTMLElement;
  const burnerInstanceSelect = document.getElementById('burnerInstanceSelect') as HTMLSelectElement;
  const addCustomInstanceButton = document.getElementById('addCustomInstanceButton') as HTMLButtonElement;
  const customInstanceForm = document.getElementById('customInstanceForm') as HTMLElement;
  const customInstanceName = document.getElementById('customInstanceName') as HTMLInputElement;
  const customInstanceUrl = document.getElementById('customInstanceUrl') as HTMLInputElement;
  const saveCustomInstance = document.getElementById('saveCustomInstance') as HTMLButtonElement;
  const cancelCustomInstance = document.getElementById('cancelCustomInstance') as HTMLButtonElement;
  const viewArchivedButton = document.getElementById('viewArchivedButton') as HTMLButtonElement;
  const archivedEmailsList = document.getElementById('archivedEmailsList') as HTMLElement;
  const archivedEmailsSection = document.querySelector('.archived-emails-section') as HTMLElement;
  const emailManagementButton = document.getElementById('emailManagementButton') as HTMLButtonElement;
  const emailManagementSection = document.querySelector('.email-management-section') as HTMLElement;
  const activeEmailsTab = document.getElementById('activeEmailsTab') as HTMLButtonElement;
  const expiredEmailsTab = document.getElementById('expiredEmailsTab') as HTMLButtonElement;
  const archivedEmailsTab = document.getElementById('archivedEmailsTab') as HTMLButtonElement;
  const selectAllEmails = document.getElementById('selectAllEmails') as HTMLInputElement;
  const selectedCount = document.getElementById('selectedCount') as HTMLElement;
  const bulkDeleteButton = document.getElementById('bulkDeleteButton') as HTMLButtonElement;
  const bulkExportButton = document.getElementById('bulkExportButton') as HTMLButtonElement;
  const bulkArchiveButton = document.getElementById('bulkArchiveButton') as HTMLButtonElement;
  const emailManagementList = document.getElementById('emailManagementList') as HTMLElement;
  const emailSearchInput = document.getElementById('emailSearchInput') as HTMLInputElement;
  const clearSearchButton = document.getElementById('clearSearchButton') as HTMLButtonElement;
  const emailDetailSection = document.querySelector('.email-detail-section') as HTMLElement;
  const backToManagementButton = document.getElementById('backToManagementButton') as HTMLButtonElement;
  const emailDetailTitle = document.getElementById('emailDetailTitle') as HTMLElement;
  const detailEmailAddress = document.getElementById('detailEmailAddress') as HTMLElement;
  const detailEmailProvider = document.getElementById('detailEmailProvider') as HTMLElement;
  const detailMessageCount = document.getElementById('detailMessageCount') as HTMLElement;
  const detailLastUsed = document.getElementById('detailLastUsed') as HTMLElement;
  const refreshMessagesButtonDetail = document.getElementById('refreshMessagesButton') as HTMLButtonElement;
  const exportEmailButton = document.getElementById('exportEmailButton') as HTMLButtonElement;
  const emailMessagesList = document.getElementById('emailMessagesList') as HTMLElement;
  const loadingMessages = document.getElementById('loadingMessages') as HTMLElement;
  const noMessages = document.getElementById('noMessages') as HTMLElement;
  let loginInfoViewActive: boolean = false;
  let analyticsViewActive: boolean = false;
  let archivedEmailsViewActive: boolean = false;
  let settingsViewActive: boolean = false;
  let emailManagementViewActive: boolean = false;
  let currentEmailTab: string = 'active';
  let selectedEmails: Set<string> = new Set();
  let allEmails: Inbox[] = [];
  let filteredEmails: Inbox[] = [];
  let searchQuery: string = '';
  let currentEmailDetail: any = null;
  let emailDetailViewActive: boolean = false;

  const fileInput = document.createElement('input') as HTMLInputElement;
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  // QR Code dialog elements
  const qrCodeDialog = document.getElementById('qrCodeDialog') as HTMLElement;
  const qrCodeCanvas = document.getElementById('qrCodeCanvas') as HTMLCanvasElement;
  const downloadQrCode = document.getElementById('downloadQrCode') as HTMLButtonElement;
  const copyQrImage = document.getElementById('copyQrImage') as HTMLButtonElement;

  // QR Code generation function using QRCode library
  function generateQRCode(text: string, canvas: HTMLCanvasElement) {
    try {
      // Clear the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      // Generate QR code using the qrcodegen library
      const QRC = qrcodegen.QrCode;
      const qr = QRC.encodeText(text, QRC.Ecc.MEDIUM);
      
      // Set canvas size
      const moduleCount = qr.size;
      const cellSize = 6; // Smaller cell size for more compact QR code
      const margin = 16; // Smaller margin
      const size = moduleCount * cellSize + margin * 2;
      
      canvas.width = size;
      canvas.height = size;
      
      if (!ctx) return;
      
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      
      // Draw QR code modules
      ctx.fillStyle = '#000000';
      for (let y = 0; y < moduleCount; y++) {
        for (let x = 0; x < moduleCount; x++) {
          if (qr.getModule(x, y)) {
            ctx.fillRect(
              margin + x * cellSize,
              margin + y * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback: show error message on canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 180;
        canvas.height = 180;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 180, 180);
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', 90, 80);
        ctx.fillText('Generation', 90, 100);
        ctx.fillText('Failed', 90, 120);
      }
    }
  }

  // QR Code button event listener
  qrCodeButton.addEventListener('click', () => {
    const emailText = dropdownSelected.textContent;
    if (emailText && emailText !== 'Select an inbox') {
      generateQRCode(emailText, qrCodeCanvas);
      qrCodeDialog.style.display = 'flex';
    } else {
      showToast('Please select an inbox first', true);
    }
  });

  // Close dialog when clicking outside (on the main popup area)
  qrCodeDialog.addEventListener('click', (e) => {
    if (e.target === qrCodeDialog) {
      qrCodeDialog.style.display = 'none';
    }
  });

  // Download QR code
  downloadQrCode.addEventListener('click', () => {
    const emailText = dropdownSelected.textContent || 'email';
    const link = document.createElement('a');
    link.download = `qr-code-${emailText}.png`;
    link.href = qrCodeCanvas.toDataURL();
    link.click();
    showToast('QR code downloaded!');
  });

  // Copy QR code image
  copyQrImage.addEventListener('click', async () => {
    try {
      const canvas = qrCodeCanvas;
      canvas.toBlob(async (blob) => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          showToast('QR code copied to clipboard!');
        }
      });
    } catch (error) {
      console.error('Failed to copy QR code:', error);
      showToast('Failed to copy QR code', true);
    }
  });



  let currentFilters: Filters = {
    searchQuery: '',
    hasOTP: false
  };

  // Initialize notifications toggle
  async function initializeNotifications(): Promise<void> {
    try {
      const { notificationSettings = { enabled: true } } = await chrome.storage.local.get(['notificationSettings']) as { notificationSettings: NotificationSettings };
      const notificationsToggle = document.getElementById('notificationsToggle') as HTMLButtonElement;
      notificationsToggle.setAttribute('data-enabled', notificationSettings.enabled.toString());
      updateNotificationIcon(notificationsToggle, notificationSettings.enabled);
      if (notificationSettings.enabled) {
        await requestNotificationPermission();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      showToast('Failed to initialize notifications', true);
    }
  }

  // Request notification permission
  async function requestNotificationPermission(): Promise<void> {
    if (!('Notification' in window)) {
      showToast('Notifications not supported in this browser', true);
      (notificationsToggle as any).checked = false;
      await chrome.storage.local.set({ notificationSettings: { enabled: false } });
      return;
    }

    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          (notificationsToggle as any).checked = false;
          await chrome.storage.local.set({ notificationSettings: { enabled: false } });
          showToast('Notifications permission denied', true);
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        showToast('Failed to request notification permission', true);
      }
    } else if (Notification.permission === 'denied') {
      (notificationsToggle as any).checked = false;
      await chrome.storage.local.set({ notificationSettings: { enabled: false } });
      showToast('Notifications permission denied', true);
    }
  }

  function updateNotificationIcon(button: HTMLButtonElement, enabled: boolean): void {
    button.setAttribute('data-enabled', enabled.toString());
    (button.querySelector('.notification-enabled') as HTMLElement).style.display = enabled ? 'inline' : 'none';
    (button.querySelector('.notification-disabled') as HTMLElement).style.display = enabled ? 'none' : 'inline';
  }
  
  // Handle notifications toggle
  notificationsToggle.addEventListener('click', async () => {
    const currentEnabled = notificationsToggle.getAttribute('data-enabled') === 'true';
    const enabled = !currentEnabled;
    try {
      await chrome.storage.local.set({ notificationSettings: { enabled } });
      updateNotificationIcon(notificationsToggle, enabled);
      if (enabled) {
        await requestNotificationPermission();
        if (Notification.permission !== 'granted') {
          updateNotificationIcon(notificationsToggle, false);
          await chrome.storage.local.set({ notificationSettings: { enabled: false } });
          showToast('Notifications permission denied', true);
          return;
        }
      }
      showToast(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showToast('Failed to update notification settings', true);
      updateNotificationIcon(notificationsToggle, currentEnabled); // Revert icon
    }
  });

  loginInfoButton.addEventListener('click', () => {
    loginInfoViewActive = !loginInfoViewActive;
    
    if (loginInfoViewActive) {
      updateSavedLoginInfo();
      loginInfoSection.style.display = 'block';
      loginInfoSection.classList.add('fullscreen');
      analyticsSection.style.display = 'none';
      settingsSection.style.display = 'none';
      analyticsViewActive = false;
      settingsViewActive = false;
      
      if (!document.getElementById('loginInfoBackButton')) {
        const headerContainer = document.createElement('div');
        headerContainer.className = 'section-header-inline';
        headerContainer.innerHTML = `
          <button id="loginInfoBackButton" class="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h3 class="section-title-inline">Saved Login Info</h3>
        `;
        
        const backButton = headerContainer.querySelector('#loginInfoBackButton');
        backButton.addEventListener('click', () => {
          loginInfoViewActive = false;
          loginInfoSection.classList.remove('fullscreen');
          loginInfoSection.style.display = 'none';
          if (document.getElementById('loginInfoBackButton')) {
            headerContainer.remove();
          }
        });
        
        // Hide original header and insert new inline header
        const originalHeader = loginInfoSection.querySelector('.login-info-header');
        if (originalHeader) originalHeader.style.display = 'none';
        loginInfoSection.insertBefore(headerContainer, loginInfoSection.firstChild);
      }
    } else {
      loginInfoSection.classList.remove('fullscreen');
      loginInfoSection.style.display = 'none';
      if (document.getElementById('loginInfoBackButton')) {
        document.getElementById('loginInfoBackButton').remove();
      }
    }
  });



  analyticsButton.addEventListener('click', () => {
    analyticsViewActive = !analyticsViewActive;
    
    if (analyticsViewActive) {
      updateAnalyticsDashboard();
      analyticsSection.style.display = 'block';
      analyticsSection.classList.add('fullscreen');
      inboxContainer.style.display = 'none';
      loginInfoSection.style.display = 'none';
      settingsSection.style.display = 'none';
      loginInfoViewActive = false;
      settingsViewActive = false;
      
      if (!document.getElementById('analyticsBackButton')) {
        const headerContainer = document.createElement('div');
        headerContainer.className = 'section-header-inline';
        headerContainer.innerHTML = `
          <button id="analyticsBackButton" class="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h3 class="section-title-inline">Analytics Dashboard</h3>
        `;
        
        const backButton = headerContainer.querySelector('#analyticsBackButton');
        backButton.addEventListener('click', () => {
          analyticsViewActive = false;
          analyticsSection.classList.remove('fullscreen');
          analyticsSection.style.display = 'none';
          inboxContainer.style.display = 'block';
          if (document.getElementById('analyticsBackButton')) {
            headerContainer.remove();
          }
        });
        
        // Hide original header and insert new inline header
        const originalHeader = analyticsSection.querySelector('.analytics-header');
        if (originalHeader) originalHeader.style.display = 'none';
        analyticsSection.insertBefore(headerContainer, analyticsSection.firstChild);
      }
    } else {
      analyticsSection.classList.remove('fullscreen');
      analyticsSection.style.display = 'none';
      inboxContainer.style.display = 'block';
      if (document.getElementById('analyticsBackButton')) {
        document.getElementById('analyticsBackButton').remove();
      }
    }
  });

  viewArchivedButton.addEventListener('click', () => {
    archivedEmailsViewActive = !archivedEmailsViewActive;
    
    if (archivedEmailsViewActive) {
      updateArchivedEmails();
      archivedEmailsSection.style.display = 'block';
      archivedEmailsSection.classList.add('fullscreen');
      inboxContainer.style.display = 'none';
      loginInfoSection.style.display = 'none';
      settingsSection.style.display = 'none';
      analyticsSection.style.display = 'none';
      loginInfoViewActive = false;
      settingsViewActive = false;
      analyticsViewActive = false;
      
      if (!document.getElementById('archivedBackButton')) {
        const headerContainer = document.createElement('div');
        headerContainer.className = 'section-header-inline';
        headerContainer.innerHTML = `
          <button id="archivedBackButton" class="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h3 class="section-title-inline">Archived Emails</h3>
        `;
        
        const backButton = headerContainer.querySelector('#archivedBackButton');
        backButton.addEventListener('click', () => {
          archivedEmailsViewActive = false;
          archivedEmailsSection.classList.remove('fullscreen');
          archivedEmailsSection.style.display = 'none';
          inboxContainer.style.display = 'block';
          if (document.getElementById('archivedBackButton')) {
            headerContainer.remove();
          }
        });
        
        // Hide original header and insert new inline header
        const originalHeader = archivedEmailsSection.querySelector('.archived-emails-header');
        if (originalHeader) originalHeader.style.display = 'none';
        archivedEmailsSection.insertBefore(headerContainer, archivedEmailsSection.firstChild);
      }
    } else {
      archivedEmailsSection.classList.remove('fullscreen');
      archivedEmailsSection.style.display = 'none';
      inboxContainer.style.display = 'block';
      if (document.getElementById('archivedBackButton')) {
        document.getElementById('archivedBackButton').remove();
      }
    }
  });

  settingsButton.addEventListener('click', () => {
    settingsViewActive = !settingsViewActive;
    
    if (settingsViewActive) {
      settingsSection.style.display = 'block';
      settingsSection.classList.add('fullscreen');
      inboxContainer.style.display = 'none';
      loginInfoSection.style.display = 'none';
      analyticsSection.style.display = 'none';
      emailManagementSection.style.display = 'none';
      loginInfoViewActive = false;
      analyticsViewActive = false;
      emailManagementViewActive = false;
      
      if (!document.getElementById('settingsBackButton')) {
        const headerContainer = document.createElement('div');
        headerContainer.className = 'section-header-inline';
        headerContainer.innerHTML = `
          <button id="settingsBackButton" class="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h3 class="section-title-inline">Settings</h3>
        `;
        
        const backButton = headerContainer.querySelector('#settingsBackButton');
        backButton.addEventListener('click', () => {
          settingsViewActive = false;
          settingsSection.classList.remove('fullscreen');
          settingsSection.style.display = 'none';
          inboxContainer.style.display = 'block';
          if (document.getElementById('settingsBackButton')) {
            headerContainer.remove();
          }
        });
        
        // Hide original header and insert new inline header
        const originalHeader = settingsSection.querySelector('.settings-header');
        if (originalHeader) originalHeader.style.display = 'none';
        settingsSection.insertBefore(headerContainer, settingsSection.firstChild);
      }
    } else {
      settingsSection.classList.remove('fullscreen');
      settingsSection.style.display = 'none';
      inboxContainer.style.display = 'block';
      if (document.getElementById('settingsBackButton')) {
        document.getElementById('settingsBackButton').remove();
      }
    }
  });

  // Email Management functionality
  emailManagementButton.addEventListener('click', () => {
    emailManagementViewActive = !emailManagementViewActive;
    
    if (emailManagementViewActive) {
      updateEmailManagement();
      emailManagementSection.style.display = 'block';
      emailManagementSection.classList.add('fullscreen');
      inboxContainer.style.display = 'none';
      loginInfoSection.style.display = 'none';
      analyticsSection.style.display = 'none';
      settingsSection.style.display = 'none';
      archivedEmailsSection.style.display = 'none';
      loginInfoViewActive = false;
      analyticsViewActive = false;
      settingsViewActive = false;
      archivedEmailsViewActive = false;
      
      if (!document.getElementById('emailManagementBackButton')) {
        const headerContainer = document.createElement('div');
        headerContainer.className = 'section-header-inline';
        headerContainer.innerHTML = `
          <button id="emailManagementBackButton" class="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h3 class="section-title-inline">Email Management</h3>
        `;
        
        const backButton = headerContainer.querySelector('#emailManagementBackButton');
        backButton.addEventListener('click', () => {
          emailManagementViewActive = false;
          emailManagementSection.classList.remove('fullscreen');
          emailManagementSection.style.display = 'none';
          inboxContainer.style.display = 'block';
          if (document.getElementById('emailManagementBackButton')) {
            headerContainer.remove();
          }
        });
        
        // Hide original header and insert new inline header
        const originalHeader = emailManagementSection.querySelector('.email-management-header');
        if (originalHeader) originalHeader.style.display = 'none';
        emailManagementSection.insertBefore(headerContainer, emailManagementSection.firstChild);
      }
    } else {
      emailManagementSection.classList.remove('fullscreen');
      emailManagementSection.style.display = 'none';
      inboxContainer.style.display = 'block';
      if (document.getElementById('emailManagementBackButton')) {
        document.getElementById('emailManagementBackButton').remove();
      }
    }
  });

  // Tab switching
  [activeEmailsTab, expiredEmailsTab, archivedEmailsTab].forEach(tab => {
    tab.addEventListener('click', () => {
      const tabType = tab.getAttribute('data-tab');
      currentEmailTab = tabType;
      
      // Update tab appearance
      document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Clear selections
      selectedEmails.clear();
      selectAllEmails.checked = false;
      updateSelectionUI();
      
      // Update email list
      updateEmailManagement();
    });
  });

  // Select all functionality
  selectAllEmails.addEventListener('change', () => {
    if (selectAllEmails.checked) {
      filteredEmails.forEach(email => selectedEmails.add(email.id));
    } else {
      selectedEmails.clear();
    }
    updateSelectionUI();
    updateEmailCheckboxes();
  });

  // Search functionality
  emailSearchInput.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
    clearSearchButton.style.display = searchQuery ? 'block' : 'none';
    updateEmailManagement();
  });

  clearSearchButton.addEventListener('click', () => {
    emailSearchInput.value = '';
    searchQuery = '';
    clearSearchButton.style.display = 'none';
    updateEmailManagement();
  });

  // Email detail navigation
  backToManagementButton.addEventListener('click', () => {
    emailDetailSection.style.display = 'none';
    emailDetailSection.classList.remove('fullscreen');
    emailManagementSection.style.display = 'block';
    emailDetailViewActive = false;
    currentEmailDetail = null;
  });

  // Refresh messages in detail view
  refreshMessagesButtonDetail.addEventListener('click', async () => {
    if (currentEmailDetail) {
      await loadEmailMessages(currentEmailDetail);
    }
  });

  // Export single email
  exportEmailButton.addEventListener('click', async () => {
    if (currentEmailDetail) {
      await exportSingleEmail(currentEmailDetail);
    }
  });

  // Bulk archive
  bulkArchiveButton.addEventListener('click', async () => {
    if (selectedEmails.size === 0) return;
    
    try {
      const selectedCount = selectedEmails.size;
      const emailIds = Array.from(selectedEmails);
      
      // Archive each email
      for (const emailId of emailIds) {
        await toggleArchiveEmail(emailId);
      }
      
      selectedEmails.clear();
      selectAllEmails.checked = false;
      updateEmailManagement();
      showToast(`Archived ${selectedCount} email address(es)`);
    } catch (error) {
      console.error('Error archiving emails:', error);
      showToast('Failed to archive emails', true);
    }
  });

  // Bulk delete
  bulkDeleteButton.addEventListener('click', async () => {
    if (selectedEmails.size === 0) return;
    
    const confirmed = confirm(`Are you sure you want to delete ${selectedEmails.size} email address(es)?`);
    if (!confirmed) return;
    
    try {
      const selectedCount = selectedEmails.size;
      const emailIds = Array.from(selectedEmails);
      
      // Delete each email through the background script
      for (const emailId of emailIds) {
        const response = await chrome.runtime.sendMessage({ 
          type: 'deleteInbox', 
          inboxId: emailId 
        });
        
        if (!response.success) {
          console.warn(`Failed to delete email ${emailId}:`, response.error);
        }
      }
      
      selectedEmails.clear();
      selectAllEmails.checked = false;
      updateEmailManagement();
      showToast(`Deleted ${selectedCount} email address(es)`);
    } catch (error) {
      console.error('Error deleting emails:', error);
      showToast('Failed to delete emails', true);
    }
  });

  // Bulk export
  bulkExportButton.addEventListener('click', async () => {
    if (selectedEmails.size === 0) return;
    
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      const selectedInboxes = inboxes.filter(inbox => selectedEmails.has(inbox.id));
      
      // Show export format selection
      const format = await showExportFormatDialog();
      if (!format) return;
      
      await exportEmails(selectedInboxes, format);
      showToast(`Exported ${selectedEmails.size} email address(es) as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting emails:', error);
      showToast('Failed to export emails', true);
    }
  });

  reportIssueButton.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://github.com/UnarchiveTech/1Click-TempMailwithAutofill/issues/new'
    });
  });

  exportDataButton.addEventListener('click', async () => {
    const result = await window.dataManager.exportData();
    if (result.success) {
      showToast('Data exported successfully');
    } else {
      showToast('Failed to export data: ' + result.error, true);
    }
  });

  importDataButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await window.dataManager.importData(file);
      if (result.success) {
        showToast('Data imported successfully');
        updateSavedLoginInfo();
        await initializeInboxes();
      } else {
        showToast('Failed to import data: ' + result.error, true);
      }
    } catch (error) {
      showToast('Error importing data: ' + error.message, true);
    } finally {
      fileInput.value = '';
    }
  });

  hardResetButton.addEventListener('click', async () => {
    const confirmed = confirm('⚠️ HARD RESET WARNING\n\nThis will permanently delete ALL extension data including:\n• All saved inboxes and emails\n• Login information\n• Settings and preferences\n• Analytics data\n• Browser cookies for mail providers\n\nThis action cannot be undone. Are you sure you want to continue?');
    
    if (confirmed) {
      try {
        // Clear all extension storage
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
        
        // Clear session storage as well
        try {
          await chrome.storage.session.clear();
          console.log('Session storage cleared');
        } catch (sessionError) {
          console.warn('Failed to clear session storage:', sessionError);
        }
        
        // Clear cookies for Guerrilla Mail and Raceco Mail domains
        const domains = [
          'https://www.guerrillamail.com',
          'https://guerrillamail.com',
          'https://api.guerrillamail.com',
          'https://raceco.io',
          'https://www.raceco.io',
          'https://raceco.dpdns.org'
        ];
        
        // Clear cookies for all domains and subdomains
        for (const domain of domains) {
          try {
            const url = new URL(domain);
            const hostname = url.hostname;
            
            // Get cookies for the exact domain
            const exactCookies = await chrome.cookies.getAll({ domain: hostname });
            console.log(`Found ${exactCookies.length} cookies for exact domain ${hostname}`);
            
            // Get cookies for all subdomains (with leading dot)
            const subdomainCookies = await chrome.cookies.getAll({ domain: '.' + hostname });
            console.log(`Found ${subdomainCookies.length} cookies for subdomains of ${hostname}`);
            
            // Combine all cookies
            const allCookies = [...exactCookies, ...subdomainCookies];
            const uniqueCookies = allCookies.filter((cookie, index, self) => 
              index === self.findIndex(c => c.name === cookie.name && c.domain === cookie.domain)
            );
            
            console.log(`Total unique cookies to remove for ${hostname}: ${uniqueCookies.length}`);
            
            for (const cookie of uniqueCookies) {
              // Try multiple URL variations to ensure complete removal
              const urlVariations = [
                `https://${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`,
                `http://${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`,
                domain + cookie.path
              ];
              
              for (const urlVariation of urlVariations) {
                try {
                  await chrome.cookies.remove({
                    url: urlVariation,
                    name: cookie.name
                  });
                  console.log(`Removed cookie: ${cookie.name} from ${cookie.domain} using URL ${urlVariation}`);
                  break; // If successful, no need to try other URL variations
                } catch (removeError) {
                  // Continue to next URL variation
                }
              }
            }
          } catch (cookieError) {
            console.warn('Failed to clear cookies for', domain, cookieError);
          }
        }
        
        // Additional comprehensive cookie clearing
        try {
          // Clear all cookies for guerrillamail domains
          const guerrillaPatterns = ['guerrillamail.com', 'guerrillamailblock.com', 'sharklasers.com', 'grr.la'];
          for (const pattern of guerrillaPatterns) {
            const cookies = await chrome.cookies.getAll({ domain: pattern });
            const subdomainCookies = await chrome.cookies.getAll({ domain: '.' + pattern });
            const allPatternCookies = [...cookies, ...subdomainCookies];
            
            for (const cookie of allPatternCookies) {
              try {
                await chrome.cookies.remove({
                  url: `https://${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`,
                  name: cookie.name
                });
                console.log(`Removed additional cookie: ${cookie.name} from ${cookie.domain}`);
              } catch (e) {
                // Continue with other cookies
              }
            }
          }
        } catch (additionalError) {
          console.warn('Failed additional cookie clearing:', additionalError);
        }
        
        // Clear any potential cache storage
        try {
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log(`Found ${cacheNames.length} cache storages`);
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
              console.log(`Cleared cache: ${cacheName}`);
            }
          }
        } catch (cacheError) {
          console.warn('Failed to clear cache storage:', cacheError);
        }
        
        // Clear IndexedDB databases (if any)
        try {
          if ('indexedDB' in window) {
            // Note: Chrome extensions can't enumerate all databases, but we can try common ones
            const commonDbNames = ['guerrillamail', 'raceco', 'tempmail', 'email'];
            for (const dbName of commonDbNames) {
              try {
                const deleteRequest = indexedDB.deleteDatabase(dbName);
                await new Promise((resolve, reject) => {
                  deleteRequest.onsuccess = () => {
                    console.log(`Cleared IndexedDB: ${dbName}`);
                    resolve(true);
                  };
                  deleteRequest.onerror = () => reject(deleteRequest.error);
                  deleteRequest.onblocked = () => {
                    console.warn(`IndexedDB ${dbName} deletion blocked`);
                    resolve(false);
                  };
                });
              } catch (dbError) {
                // Database might not exist, continue
              }
            }
          }
        } catch (indexedDbError) {
          console.warn('Failed to clear IndexedDB:', indexedDbError);
        }
        
        // Clear localStorage and sessionStorage (if accessible)
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
            console.log('Cleared localStorage');
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
            console.log('Cleared sessionStorage');
          }
        } catch (storageError) {
          console.warn('Failed to clear web storage:', storageError);
        }
        
        // Send message to background script to reset state (including alarms)
        const resetResponse = await chrome.runtime.sendMessage({ action: 'hardReset' });
        if (!resetResponse.success) {
          throw new Error(resetResponse.error || 'Background reset failed');
        }
        
        showToast('Hard reset completed successfully');
        
        // Refresh the popup after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('Error during hard reset:', error);
        showToast('Hard reset failed: ' + error.message, true);
      }
    }
  });

  const initializeTheme = async () => {
    try {
      const { darkMode } = await chrome.storage.local.get(['darkMode']);
      if (darkMode === true) {
        document.body.classList.add('dark-mode');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return false;
    }
  };

  let isDarkMode = await initializeTheme();

  themeToggleButton.addEventListener('click', async () => {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    try {
      await chrome.storage.local.set({ darkMode: isDarkMode });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  });

  function showToast(message, isError = false) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async function copyToClipboard(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      
      if (text === latestOtpCode.textContent) {
        const originalIcon = copyOtpButton.querySelector('svg:not(.check-icon)');
        const checkIcon = copyOtpButton.querySelector('.check-icon');
        originalIcon.style.display = 'none';
        checkIcon.style.display = 'inline';
        setTimeout(() => {
          originalIcon.style.display = 'inline';
          checkIcon.style.display = 'none';
        }, 2000);
      } else {
        showToast('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy', true);
    }
  }

  copyOtpButton.addEventListener('click', () => {
    const otpText = latestOtpCode.textContent;
    if (otpText && otpText !== '------') {
      copyToClipboard(otpText);
    }
  });

  copyEmailButton.addEventListener('click', () => {
    const emailText = dropdownSelected.textContent;
    if (emailText && emailText !== 'Select an inbox') {
      copyToClipboard(emailText);
    }
  });

  function timeAgo(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const secondsPast = (now - timestamp) / 1000;

    if (secondsPast < 60) {
      return `${Math.round(secondsPast)}s ago`;
    }
    if (secondsPast < 3600) {
      return `${Math.round(secondsPast / 60)}m ago`;
    }
    if (secondsPast <= 86400) {
      return `${Math.round(secondsPast / 3600)}h ago`;
    }
    const days = Math.round(secondsPast / 86400);
    return `${days}d ago`;
  }

  function updateLatestOtp(message) {
    if (message && message.otp) {
      latestOtpContainer.style.display = 'block';
      latestOtpCode.textContent = message.otp;
      
      const fromText = message.from_name ? `From: ${message.from_name}` : '';
      const timeText = timeAgo(message.received_at * 1000);
      otpContext.textContent = [fromText, timeText].filter(Boolean).join(' | ');

    } else {
      latestOtpContainer.style.display = 'none';
      latestOtpCode.textContent = '------';
      otpContext.textContent = '';
    }
  }

  function showMessageDetail(message) {
    (async () => {
      const width = 800;
      const height = 600;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const messageWindow = window.open('', '_blank', `popup=yes,width=${width},height=${height},left=${left},top=${top},titlebar=no,frame=no,toolbar=no,menubar=no,location=no,status=no,resizable=yes,chrome=no,dialog=yes`);
      if (!messageWindow) {
        showToast('Popup blocked. Please allow popups for this site.', true);
        return;
      }

      const { darkMode } = await chrome.storage.local.get(['darkMode']);

      messageWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;">
          <title>${message.subject || 'No Subject'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            :root {
              --bg-primary: #ffffff;
              --bg-secondary: #f7f7f8;
              --text-primary: #1a1a1a;
              --text-secondary: #5c5c5c;
              --border-color: #e5e7eb;
              --primary-color: #3B82F6;
              --primary-color-hover: #2563EB;
              --danger-color: #EF4444;
              --danger-color-hover: #DC2626;
              --otp-bg: #E0F2FE;
              --otp-text: #0284C7;
              --otp-border: #38BDF8;
            }
            .dark-mode {
              --bg-primary: #18181b;
              --bg-secondary: #27272a;
              --text-primary: #f4f4f5;
              --text-secondary: #a1a1aa;
              --border-color: #3f3f46;
              --primary-color: #60A5FA;
              --primary-color-hover: #3B82F6;
              --danger-color: #F87171;
              --danger-color-hover: #EF4444;
              --otp-bg: #1e293b;
              --otp-text: #7dd3fc;
              --otp-border: #38bdf8;
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              background-color: var(--bg-primary);
              color: var(--text-primary);
              display: flex;
              flex-direction: column;
              height: 100vh;
              overflow: hidden;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .main-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 20px;
              border-bottom: 1px solid var(--border-color);
              -webkit-app-region: drag;
              flex-shrink: 0;
            }
            .header-buttons {
              display: flex;
              gap: 8px;
              align-items: center;
            }
            .main-header h1 {
              font-size: 16px;
              margin: 0;
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .close-button, .forward-button {
              background: transparent;
              border: none;
              padding: 6px;
              cursor: pointer;
              color: var(--text-secondary);
              -webkit-app-region: no-drag;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background-color 0.2s, color 0.2s;
            }
            .close-button:hover, .forward-button:hover {
              background-color: var(--bg-secondary);
              color: var(--text-primary);
            }
            .forward-button {
              color: var(--primary-color);
            }
            .forward-button:hover {
              background-color: var(--primary-color);
              color: white;
            }
            .message-container {
              flex-grow: 1;
              overflow-y: auto;
              padding: 24px;
            }
            .message-header {
              border-bottom: 1px solid var(--border-color);
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .message-meta {
              font-size: 14px;
              color: var(--text-secondary);
              display: grid;
              grid-template-columns: 60px 1fr;
              gap: 8px 16px;
            }
            .meta-label {
              font-weight: 500;
              color: var(--text-primary);
            }
            .meta-value {
              word-break: break-all;
            }
            .otp-section {
              background-color: var(--otp-bg);
              padding: 20px;
              margin-bottom: 24px;
              border-radius: 12px;
              border: 1px solid var(--otp-border);
              text-align: center;
            }
            .otp-title {
              font-size: 16px;
              font-weight: 600;
              color: var(--otp-text);
              margin: 0 0 12px 0;
            }
            .otp-display {
              font-size: 32px;
              font-weight: 600;
              color: var(--text-primary);
              padding: 16px;
              letter-spacing: 4px;
              background-color: var(--bg-primary);
              border-radius: 8px;
              margin-bottom: 16px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              border: 1px solid var(--border-color);
            }
            .copy-otp-button {
              background-color: var(--primary-color);
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
              font-size: 14px;
              transition: background-color 0.2s;
            }
            .copy-otp-button:hover {
              background-color: var(--primary-color-hover);
            }
            .message-body {
              font-size: 15px;
              line-height: 1.7;
              color: var(--text-primary);
              user-select: text;
              -webkit-user-select: text;
              word-wrap: break-word;
            }
            .message-body a {
              color: var(--primary-color);
              text-decoration: none;
            }
            .message-body a:hover {
              text-decoration: underline;
            }
            ::-webkit-scrollbar {
              width: 10px;
            }
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            ::-webkit-scrollbar-thumb {
              background-color: var(--border-color);
              border-radius: 10px;
              border: 2px solid var(--bg-primary);
            }
            ::-webkit-scrollbar-thumb:hover {
              background-color: #a1a1aa;
            }
          </style>
          <script nonce="${nonce}">
            document.addEventListener('DOMContentLoaded', () => {
              if (${darkMode}) {
                document.body.classList.add('dark-mode');
              }
              const copyButton = document.querySelector('.copy-otp-button');
              if (copyButton) {
                copyButton.addEventListener('click', () => {
                  const otp = copyButton.dataset.otp;
                  navigator.clipboard.writeText(otp)
                    .then(() => {
                      copyButton.textContent = 'Copied!';
                      setTimeout(() => {
                        copyButton.textContent = 'Copy OTP';
                      }, 2000);
                    })
                    .catch(err => {
                      console.error('Failed to copy: ', err);
                    });
                });
              }
              
              // Forward button functionality
              const forwardButton = document.querySelector('.forward-button');
              if (forwardButton) {
                forwardButton.addEventListener('click', () => {
                  const subject = encodeURIComponent('Fwd: ' + (message.subject || 'No Subject'));
                  const body = encodeURIComponent('\n\n--- Forwarded Message ---\nFrom: ' + (message.from_name || 'Unknown Sender') + '\nDate: ' + new Date(message.received_at * 1000).toLocaleString() + '\nSubject: ' + (message.subject || 'No Subject') + '\n\n' + (message.body_plain || message.body_html || 'No content').replace(/<[^>]*>/g, ''));
                  const mailtoLink = 'mailto:?subject=' + subject + '&body=' + body;
                  window.open(mailtoLink, '_self');
                });
              }
              
              document.querySelector('.close-button').addEventListener('click', () => window.close());
            });
          </script>
        </head>
        <body>
          <header class="main-header">
            <h1>${message.subject || 'No Subject'}</h1>
            <div class="header-buttons">
              <button class="forward-button" title="Forward to Email Client">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </button>
              <button class="close-button" title="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </header>
          <div class="message-container">
            <div class="message-header">
              <div class="message-meta">
                <span class="meta-label">From:</span>
                <span class="meta-value">${message.from_name || 'Unknown Sender'}</span>
                <span class="meta-label">Date:</span>
                <span class="meta-value">${new Date(message.received_at * 1000).toLocaleString()}</span>
              </div>
            </div>
            <div class="message-body">
              ${message.body_html || message.body_text || 'No content'}
            </div>
          </div>
        </body>
        </html>
      `);
      messageWindow.document.close();
    })();
  }

  function hideMessageDetail() {
    messageDetailElement.classList.remove('active');
    messageDetailContentElement.innerHTML = '';
  }

  function findLatestOtp(messages) {
    const sortedMessages = messages
      .filter(m => m.otp)
      .sort((a, b) => b.received_at - a.received_at);
    
    if (sortedMessages.length > 0) {
      const latestMessage = sortedMessages[0];
      return {
        otp: latestMessage.otp,
        from_name: latestMessage.from_name,
        received_at: latestMessage.received_at,
      };
    }
    return null;
  }

  function displayMessages(messages) {
    if (!messagesListElement) {
      updateLatestOtp(null);
      return;
    }
    const latestOtp = findLatestOtp(messages);
    updateLatestOtp(latestOtp);

    messagesListElement.innerHTML = '';
    if (messages.length === 0) {
      messagesListElement.innerHTML = '<div class="message-item">No emails found</div>';
      updateLatestOtp(null);
      return;
    }

    messages.forEach(message => {
      console.log('Displaying message:', message);
      
      const messageElement = document.createElement('div');
      messageElement.className = 'message-item';
      
      const otpBadge = message.otp ? `
        <span class="otp-badge" title="Click to copy OTP" data-otp="${message.otp}">
          OTP: ${message.otp}
        </span>
      ` : '';
      
      // Handle timestamp conversion safely
      let timeString = 'Unknown time';
      try {
        if (message.received_at) {
          const timestamp = typeof message.received_at === 'number' ? message.received_at : parseInt(message.received_at);
          timeString = new Date(timestamp * 1000).toLocaleString();
        }
      } catch (error) {
        console.error('Error formatting timestamp:', message.received_at, error);
      }
      
      messageElement.innerHTML = `
        <div class="message-header">
          <span class="message-subject">${message.subject || 'No Subject'}</span>
          ${otpBadge}
        </div>
        <div class="message-meta">
          <span class="message-from">${message.from_name || 'Unknown Sender'}</span>
          <span class="message-time">${timeString}</span>
        </div>
      `;
      
      messageElement.addEventListener('click', () => showMessageDetail(message));
      
      const badge = messageElement.querySelector('.otp-badge');
      if (badge) {
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          const otp = badge.getAttribute('data-otp');
          copyToClipboard(otp);
        });
      }
      
      messagesListElement.appendChild(messageElement);
    });
  }

  async function checkMessages(inboxId) {
    try {
      console.log('Sending checkEmails request for:', inboxId);
      const response = await chrome.runtime.sendMessage({ 
        type: 'checkEmails', 
        inboxId, 
        filters: currentFilters 
      });
      console.log('Received response:', response);
      
      if (!response) {
        throw new Error('No response received from background script');
      }
      
      if (response.success) {
        displayMessages(response.messages);
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error checking mail:', error);
      showToast('Failed to check mail', true);
    }
  }



  function calculateTimeLeft(expiresAt) {
    return Math.max(0, expiresAt - Date.now());
  }

  function formatTimeLeft(seconds) {
    const hours = Math.floor(seconds / 3600000);
    const minutes = Math.floor((seconds % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  async function deleteInbox(inboxId) {
    try {
      // Call background script to properly delete inbox (including API calls)
      const response = await chrome.runtime.sendMessage({ 
        type: 'deleteInbox', 
        inboxId: inboxId 
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete inbox');
      }
      
      const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
      
      if (activeInboxId === inboxId) {
        const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
        const newActiveInbox = inboxes.length > 0 ? inboxes[0].id : null;
        await chrome.storage.local.set({ activeInboxId: newActiveInbox });
      }
      
      await updateInboxDisplay();
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      if (inboxes.length > 0 && activeInboxId === inboxId) {
        checkMessages(inboxes[0].id);
      } else if (inboxes.length === 0) {
        dropdownSelected.textContent = 'Select an inbox';
        copyEmailButton.style.display = 'none';
        messagesListElement.innerHTML = '<div class="message-item">No mail yet</div>';
        updateLatestOtp(null);
      }
      showToast('Inbox deleted');
    } catch (error) {
      console.error('Error deleting inbox:', error);
      showToast('Failed to delete inbox', true);
    }
  }

  async function updateInboxDisplay() {
    try {
      const { inboxes = [], activeInboxId: currentActiveInboxId } = await chrome.storage.local.get(['inboxes', 'activeInboxId']);
      
      const now = Date.now();
      const validInboxes = inboxes.filter(inbox => inbox.expiresAt && inbox.expiresAt > now);
      let activeInboxId = currentActiveInboxId;

      if (validInboxes.length === 0) {
        const newInboxResponse = await chrome.runtime.sendMessage({ type: 'createInbox' });
        if (newInboxResponse.success) {
          const newInbox = newInboxResponse.inbox;
          validInboxes.push(newInbox);
          
          const allStoredInboxes = [...validInboxes];
          await chrome.storage.local.set({ inboxes: allStoredInboxes, activeInboxId: newInbox.id });
          activeInboxId = newInbox.id;
        } else {
          throw new Error(newInboxResponse.error);
        }
      }

      dropdownList.innerHTML = '';

      let activeInbox = validInboxes.find(inbox => inbox.id === activeInboxId);
      if (!activeInbox) {
        activeInboxId = validInboxes.length > 0 ? validInboxes[0].id : null;
        await chrome.storage.local.set({ activeInboxId });
        activeInbox = validInboxes.length > 0 ? validInboxes[0] : null;
      }

      validInboxes.forEach(inbox => {
        const li = document.createElement('li');
        li.setAttribute('data-id', inbox.id);
        const timeLeft = inbox.expiresAt ? calculateTimeLeft(inbox.expiresAt) : null;
        const isAutoExtendEnabled = inbox.autoExtend || false;
        const expiryText = isAutoExtendEnabled ? 'Auto extend expiry enabled' : (timeLeft ? `Expires in ${formatTimeLeft(timeLeft)}` : '');
        // Create buttons based on provider
        const isGuerrilla = inbox.provider === 'guerrilla';
        const isArchived = inbox.archived || false;
        
        const archiveButton = `
          <button class="archive-button" title="${isArchived ? 'Unarchive' : 'Archive'} Inbox">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>
            </svg>
          </button>
        `;
        
        const deleteButton = `
          <button class="delete-button" title="Delete Inbox">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-12 0v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6"/>
            </svg>
          </button>
        `;
        
        const editButton = `
          <button class="edit-button" title="Edit Email Address">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        `;
        
        // Auto-extend toggle button - changes based on current state
        const extendButton = `
          <button class="extend-button" title="${isAutoExtendEnabled ? 'Turn Off Auto Extend' : 'Turn On Auto Extend'}" data-auto-extend="${isAutoExtendEnabled}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${isAutoExtendEnabled ? 
                '<path d="M18 6L6 18M6 6l12 12"/>' : // X icon for turning off
                '<path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>'
              }
            </svg>
          </button>
        `;
        
        // For Guerrilla Mail: show edit, extend, archive and delete buttons
        // For Burner.kiwi: show only archive button (no delete functionality)
        const buttons = isGuerrilla ? editButton + extendButton + archiveButton + deleteButton : archiveButton;
        
        li.innerHTML = `
          <div class="inbox-item-details">
            <span class="inbox-address">${inbox.address}</span>
            ${expiryText ? `<span class="inbox-expiry">${expiryText}</span>` : ''}
          </div>
          <div class="inbox-actions">
            ${buttons}
          </div>
        `;
        if (inbox.id === activeInboxId) {
          dropdownSelected.textContent = inbox.address;
          copyEmailButton.style.display = 'inline-flex';
        }
        dropdownList.appendChild(li);

        // Add event listeners for buttons
        const inboxArchiveButton = li.querySelector('.archive-button');
        if (inboxArchiveButton) {
          inboxArchiveButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            await toggleArchiveEmail(inbox.id);
          });
        }
        
        const inboxDeleteButton = li.querySelector('.delete-button');
        if (inboxDeleteButton) {
          inboxDeleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteInbox(inbox.id);
          });
        }
        
        const inboxEditButton = li.querySelector('.edit-button');
        if (inboxEditButton) {
          inboxEditButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            await showEditEmailDialog(inbox.id);
          });
        }
        
        const inboxExtendButton = li.querySelector('.extend-button');
        if (inboxExtendButton) {
          inboxExtendButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            await toggleAutoExtend(inbox.id);
          });
        }

        li.addEventListener('click', async () => {
          await chrome.storage.local.set({ activeInboxId: inbox.id });
          dropdownSelected.textContent = inbox.address;
          copyEmailButton.style.display = 'inline-flex';
          dropdownList.style.display = 'none';
          await checkMessages(inbox.id);
        });
      });

      if (activeInbox) {
        dropdownSelected.innerHTML = `<span>${activeInbox.address}</span>`;
        copyEmailButton.style.display = 'inline-flex';
        await checkMessages(activeInbox.id);
      } else {
        dropdownSelected.innerHTML = '<span>Select an inbox</span>';
        copyEmailButton.style.display = 'none';
      }
    } catch (error) {
      console.error('Error updating inbox display:', error);
      showToast('Failed to load inboxes', true);
    }
  }

  async function initializeInboxes() {
    // Check if this is the first time opening and perform hard reset if needed
    await checkFirstTimeOpening();
    
    await updateInboxDisplay();
    await updateAnalyticsDashboard();
    await initializeNotifications();
    await loadPasswordSettings();
    await loadNameSettings();
    await loadAutoCopySettings();
    await loadAutoRenewSettings();
  }

  inboxDropdown.addEventListener('click', () => {
    dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
  });

  addInboxButton.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'createInbox' });
      if (response.success) {
        // Set the newly created inbox as the active one
        await chrome.storage.local.set({ activeInboxId: response.inbox.id });
        await updateInboxDisplay();
        await checkMessages(response.inbox.id);
        await updateAnalyticsDashboard();
        showToast('New inbox created');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error creating inbox:', error);
      showToast('Failed to create inbox', true);
    }
  });

  refreshMessagesButton.addEventListener('click', async () => {
    try {
      const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
      if (activeInboxId) {
        await checkMessages(activeInboxId);
        await updateAnalyticsDashboard();
        showToast('Messages refreshed');
      } else {
        showToast('No inbox selected', true);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
      showToast('Failed to refresh messages', true);
    }
  });

  // Debounce function to limit rapid search updates
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedCheckMessages = debounce(async (inboxId) => {
    await checkMessages(inboxId);
  }, 300);

  searchMessagesInput.addEventListener('input', async () => {
    currentFilters.searchQuery = searchMessagesInput.value.trim();
    const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
    if (activeInboxId) {
      debouncedCheckMessages(activeInboxId);
    }
  });

  otpFilterCheckbox.addEventListener('change', async () => {
    currentFilters.hasOTP = otpFilterCheckbox.checked;
    const { activeInboxId } = await chrome.storage.local.get(['activeInboxId']);
    if (activeInboxId) {
      await checkMessages(activeInboxId);
    }
  });

  startSignupButton.addEventListener('click', async () => {
    try {
      const { activeInboxId, inboxes = [] } = await chrome.storage.local.get(['activeInboxId', 'inboxes']);
      if (!activeInboxId) {
        showToast('No inbox selected', true);
        return;
      }
      const activeInbox = inboxes.find(inbox => inbox.id === activeInboxId);
      if (!activeInbox) {
        showToast('Invalid inbox', true);
        return;
      }
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'startSignup', 
          email: activeInbox.address 
        });
        showToast('Autofill started');
      } else {
        showToast('No active tab found', true);
      }
    } catch (error) {
      console.error('Error starting signup:', error);
      showToast('Failed to start autofill', true);
    }
  });

  backButton.addEventListener('click', () => {
    hideMessageDetail();
  });

  async function updateSavedLoginInfo() {
    try {
      const { loginInfo = {} } = await chrome.storage.local.get(['loginInfo']);
      
      if (Object.keys(loginInfo).length === 0) {
        savedLoginInfo.innerHTML = '<div class="login-info-item">No saved login information</div>';
        return;
      }

      const sortedDomains = Object.keys(loginInfo).sort();
      const isFullView = loginInfoViewActive;
      const domainsToShow = isFullView ? sortedDomains : sortedDomains.slice(0, 3);

      savedLoginInfo.innerHTML = domainsToShow
        .map(domain => {
          const entries = loginInfo[domain] || [];
          const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
          
          const credentialsHtml = sortedEntries
            .map(entry => `
              <div class="login-info-entry">
                <div class="login-info-timestamp">${new Date(entry.timestamp).toLocaleString()}</div>
                <div class="login-info-credentials">
                  ${entry.username ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Username:</span>
                      <span class="login-info-value">${entry.username}</span>
                      <button class="login-info-copy" data-value="${entry.username}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.email ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Email:</span>
                      <span class="login-info-value">${entry.email}</span>
                      <button class="login-info-copy" data-value="${entry.email}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.phone ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Phone:</span>
                      <span class="login-info-value">${entry.phone}</span>
                      <button class="login-info-copy" data-value="${entry.phone}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.website ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Website:</span>
                      <span class="login-info-value">${entry.website}</span>
                      <button class="login-info-copy" data-value="${entry.website}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                  ${entry.password ? `
                    <div class="login-info-field">
                      <span class="login-info-label">Password:</span>
                      <span class="login-info-value">${entry.password}</span>
                      <button class="login-info-copy" data-value="${entry.password}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `)
            .join('');

          return `
            <div class="login-info-item">
              <div class="login-info-domain">${domain}</div>
              ${credentialsHtml}
            </div>
          `;
        })
        .join('');

      if (!isFullView && sortedDomains.length > 3) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'view-all-button';
        viewAllButton.textContent = `View all (${sortedDomains.length})`;
        viewAllButton.addEventListener('click', () => {
          loginInfoButton.click();
        });
        savedLoginInfo.appendChild(viewAllButton);
      }

      const copyButtons = savedLoginInfo.querySelectorAll('.login-info-copy');
      copyButtons.forEach(button => {
        button.addEventListener('click', () => {
          const value = button.getAttribute('data-value');
          copyToClipboard(value);
        });
      });
    } catch (error) {
      console.error('Error loading login info:', error);
      savedLoginInfo.innerHTML = '<div class="login-info-item">Error loading login information</div>';
    }
  }

  async function fetchAnalyticsWithRetry(maxRetries = 3, delay = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'getAnalytics' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });

        if (!response) {
          throw new Error('No response received from background script');
        }

        if (response.success && response.analytics) {
          console.log('Analytics fetched successfully:', response.analytics);
          return response.analytics;
        } else {
          throw new Error(response.error || 'No analytics data received');
        }
      } catch (error) {
        console.warn(`Analytics fetch attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async function updateAnalyticsDashboard() {
    try {
      const analytics = await fetchAnalyticsWithRetry();
      
      const createdAt = analytics.createdAt ? new Date(analytics.createdAt).toLocaleDateString() : 'N/A';
      const inboxesCreated = analytics.inboxesCreated || 0;
      const emailsReceived = analytics.emailsReceived || 0;
      const otpsDetected = analytics.otpsDetected || 0;
      const notificationsSent = analytics.notificationsSent || 0;

      analyticsDashboard.innerHTML = `
        <div class="analytics-item">
          <span class="analytics-label">Tracking Since:</span>
          <span class="analytics-value">${createdAt}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Inboxes Created:</span>
          <span class="analytics-value">${inboxesCreated}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Emails Received:</span>
          <span class="analytics-value">${emailsReceived}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">OTPs Detected:</span>
          <span class="analytics-value">${otpsDetected}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Notifications Sent:</span>
          <span class="analytics-value">${notificationsSent}</span>
        </div>
      `;
    } catch (error) {
      console.error('Error loading analytics:', error);
      analyticsDashboard.innerHTML = '<div class="analytics-item">Failed to load analytics. Please try again.</div>';
      showToast('Failed to load analytics', true);
    }
  }

  async function updateArchivedEmails() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getArchivedEmails' });
      if (response && response.success) {
        displayArchivedEmails(response.archivedEmails || []);
      } else {
        throw new Error(response?.error || 'Failed to load archived emails');
      }
    } catch (error) {
      console.error('Error loading archived emails:', error);
      archivedEmailsList.innerHTML = '<div class="archived-email-item">Failed to load archived emails. Please try again.</div>';
      showToast('Failed to load archived emails', true);
    }
  }

  function displayArchivedEmails(archivedEmails) {
    if (!archivedEmailsList) return;
    
    archivedEmailsList.innerHTML = '';
    if (archivedEmails.length === 0) {
      archivedEmailsList.innerHTML = '<div class="archived-email-item">No archived emails found</div>';
      return;
    }

    // Group emails by original inbox
    const groupedEmails = {};
    archivedEmails.forEach(email => {
      const inbox = email.original_inbox || 'Unknown';
      if (!groupedEmails[inbox]) {
        groupedEmails[inbox] = [];
      }
      groupedEmails[inbox].push(email);
    });

    // Display grouped emails
    Object.entries(groupedEmails).forEach(([inbox, emails]) => {
      const inboxGroup = document.createElement('div');
      inboxGroup.className = 'archived-inbox-group';
      
      const inboxHeader = document.createElement('div');
      inboxHeader.className = 'archived-inbox-header';
      inboxHeader.innerHTML = `
        <span class="archived-inbox-address">${inbox}</span>
        <span class="archived-email-count">${emails.length} email${emails.length !== 1 ? 's' : ''}</span>
      `;
      inboxGroup.appendChild(inboxHeader);

      const emailsList = document.createElement('div');
      emailsList.className = 'archived-emails-list-inner';
      
      emails.slice(0, 5).forEach(email => { // Show only first 5 emails per inbox
        const emailElement = document.createElement('div');
        emailElement.className = 'archived-email-item';
        
        const otpBadge = email.otp ? `
          <span class="otp-badge archived" title="OTP: ${email.otp}">
            OTP: ${email.otp}
          </span>
        ` : '';
        
        let timeString = 'Unknown time';
        try {
          if (email.archived_at) {
            timeString = `Archived: ${new Date(email.archived_at).toLocaleDateString()}`;
          } else if (email.received_at) {
            const timestamp = typeof email.received_at === 'number' ? email.received_at : parseInt(email.received_at);
            timeString = `Received: ${new Date(timestamp * 1000).toLocaleDateString()}`;
          }
        } catch (error) {
          console.error('Error formatting archived email timestamp:', error);
        }
        
        emailElement.innerHTML = `
          <div class="archived-email-header">
            <span class="archived-email-subject">${email.from_name || 'Unknown Sender'} - ${email.subject || 'No Subject'}</span>
            ${otpBadge}
          </div>
          <div class="archived-email-meta">
            <span class="archived-email-time">${timeString}</span>
          </div>
        `;
        
        emailElement.addEventListener('click', () => showMessageDetail(email));
        
        const badge = emailElement.querySelector('.otp-badge');
        if (badge) {
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            const otp = email.otp;
            copyToClipboard(otp);
          });
        }
        
        emailsList.appendChild(emailElement);
      });
      
      if (emails.length > 5) {
        const showMoreElement = document.createElement('div');
        showMoreElement.className = 'show-more-archived';
        showMoreElement.textContent = `... and ${emails.length - 5} more`;
        emailsList.appendChild(showMoreElement);
      }
      
      inboxGroup.appendChild(emailsList);
      archivedEmailsList.appendChild(inboxGroup);
    });
  }

  async function loadPasswordSettings() {
    const { passwordSettings = {} } = await chrome.storage.local.get('passwordSettings');
    const { useCustom = false, customPassword = '' } = passwordSettings;
    
    useCustomPasswordToggle.checked = useCustom;
    customPasswordInput.value = customPassword;
    
    if (useCustom) {
      customPasswordContainer.classList.add('visible');
    } else {
      customPasswordContainer.classList.remove('visible');
    }
  }

  useCustomPasswordToggle.addEventListener('change', async (event) => {
    const useCustom = event.target.checked;
    if (useCustom) {
      customPasswordContainer.classList.add('visible');
    } else {
      customPasswordContainer.classList.remove('visible');
    }
    const { passwordSettings = {} } = await chrome.storage.local.get('passwordSettings');
    await chrome.storage.local.set({ 
      passwordSettings: { ...passwordSettings, useCustom }
    });
  });

  customPasswordInput.addEventListener('input', debounce(async (event) => {
    const customPassword = event.target.value;
    const { passwordSettings = {} } = await chrome.storage.local.get('passwordSettings');
    await chrome.storage.local.set({ 
      passwordSettings: { ...passwordSettings, customPassword }
    });
  }, 300));

  async function loadNameSettings() {
    const { nameSettings = {} } = await chrome.storage.local.get('nameSettings');
    const { useCustom = false, firstName = '', lastName = '' } = nameSettings;
    
    useCustomNameToggle.checked = useCustom;
    customFirstNameInput.value = firstName;
    customLastNameInput.value = lastName;
    
    if (useCustom) {
      customNameContainer.classList.add('visible');
    } else {
      customNameContainer.classList.remove('visible');
    }
  }

  useCustomNameToggle.addEventListener('change', async (event) => {
    const useCustom = event.target.checked;
    if (useCustom) {
      customNameContainer.classList.add('visible');
    } else {
      customNameContainer.classList.remove('visible');
    }
    const { nameSettings = {} } = await chrome.storage.local.get('nameSettings');
    await chrome.storage.local.set({ 
      nameSettings: { ...nameSettings, useCustom }
    });
  });

  customFirstNameInput.addEventListener('input', debounce(async (event) => {
    const firstName = event.target.value;
    const { nameSettings = {} } = await chrome.storage.local.get('nameSettings');
    await chrome.storage.local.set({ 
      nameSettings: { ...nameSettings, firstName }
    });
  }, 300));

  customLastNameInput.addEventListener('input', debounce(async (event) => {
    const lastName = event.target.value;
    const { nameSettings = {} } = await chrome.storage.local.get('nameSettings');
    await chrome.storage.local.set({ 
      nameSettings: { ...nameSettings, lastName }
    });
  }, 300));

  async function loadAutoCopySettings() {
    const { autoCopy = false } = await chrome.storage.local.get('autoCopy');
    autoCopyToggle.checked = autoCopy;
  }

  autoCopyToggle.addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    await chrome.storage.local.set({ autoCopy: enabled });
    showToast(`Auto-copy credentials ${enabled ? 'enabled' : 'disabled'}`);
  });

  async function loadAutoRenewSettings() {
    const { autoRenewGuerrilla = false } = await chrome.storage.local.get('autoRenewGuerrilla');
    autoRenewToggle.checked = autoRenewGuerrilla;
  }

  autoRenewToggle.addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    await chrome.storage.local.set({ autoRenewGuerrilla: enabled });
    showToast(`Auto-renew Guerrilla Mail ${enabled ? 'enabled' : 'disabled'}`);
  });

  // Check if this is the first time opening the extension and perform hard reset if needed
  async function checkFirstTimeOpening(): Promise<void> {
    try {
      const { firstTimeOpened } = await chrome.storage.local.get(['firstTimeOpened']);
      if (!firstTimeOpened) {
        console.log('First time opening detected - performing hard reset');
        // Clear all storage first
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
        
        // Send message to background script to reset state
        const resetResponse = await chrome.runtime.sendMessage({ action: 'hardReset' });
        if (resetResponse.success) {
          // Mark as opened for the first time
          await chrome.storage.local.set({ firstTimeOpened: true });
          console.log('First time hard reset completed');
        }
      }
    } catch (error) {
      console.error('Error during first time opening check:', error);
    }
  }

  // Initialize Burner instances
  async function initializeBurnerInstances(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getBurnerInstances' });
      if (response.success) {
        const instances: BurnerInstance[] = response.instances;
        burnerInstanceSelect.innerHTML = '';
        
        instances.forEach(instance => {
          const option = document.createElement('option');
          option.value = instance.id;
          option.textContent = instance.displayName + (instance.isCustom ? ' (Custom)' : '');
          burnerInstanceSelect.appendChild(option);
        });
        
        // Set selected instance
        const selectedResponse = await chrome.runtime.sendMessage({ action: 'getSelectedBurnerInstance' });
        if (selectedResponse.success && selectedResponse.instance) {
          burnerInstanceSelect.value = selectedResponse.instance.id;
        }
      }
    } catch (error) {
      console.error('Error initializing Burner instances:', error);
    }
  }

  // Initialize provider selection
  async function initializeProvider(): Promise<void> {
    const { selectedProvider = 'burner' } = await chrome.storage.local.get('selectedProvider');
    providerSelect.value = selectedProvider;
    
    // Show/hide Burner instance container based on provider
    if (selectedProvider === 'burner') {
      burnerInstanceContainer.style.display = 'block';
      await initializeBurnerInstances();
      
      // Check if no burner instance is selected and set default to 'raceco'
      const selectedResponse = await chrome.runtime.sendMessage({ action: 'getSelectedBurnerInstance' });
      if (!selectedResponse.success || !selectedResponse.instance) {
        // Set raceco as default burner instance
        const setDefaultResponse = await chrome.runtime.sendMessage({ 
          action: 'setSelectedBurnerInstance', 
          instanceId: 'raceco' 
        });
        if (setDefaultResponse.success) {
          burnerInstanceSelect.value = 'raceco';
          console.log('Set raceco as default burner instance during initialization');
        }
      }
    } else {
      burnerInstanceContainer.style.display = 'none';
    }
  }

  // Provider selection event handler
  providerSelect.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;
    const selectedProvider = target.value;
    await chrome.storage.local.set({ selectedProvider });
    
    // Show/hide Burner instance container
    if (selectedProvider === 'burner') {
      burnerInstanceContainer.style.display = 'block';
      await initializeBurnerInstances();
      
      // Check if no burner instance is selected and set default to 'raceco'
      const selectedResponse = await chrome.runtime.sendMessage({ action: 'getSelectedBurnerInstance' });
      if (!selectedResponse.success || !selectedResponse.instance) {
        // Set raceco as default burner instance
        const setDefaultResponse = await chrome.runtime.sendMessage({ 
          action: 'setSelectedBurnerInstance', 
          instanceId: 'raceco' 
        });
        if (setDefaultResponse.success) {
          burnerInstanceSelect.value = 'raceco';
          console.log('Set raceco as default burner instance');
        }
      }
    } else {
      burnerInstanceContainer.style.display = 'none';
    }
    
    // Send message to background script to update provider
    chrome.runtime.sendMessage({ 
      action: 'setProvider', 
      provider: selectedProvider 
    });
    
    const providerName = selectedProvider === 'guerrilla' ? 'Guerrilla Mail' : 'Burner.kiwi Instances';
    showToast(`Switched to ${providerName}`);
    
    // Refresh inboxes after provider change
    await initializeInboxes();
  });

  // Burner instance selection event handler
  burnerInstanceSelect.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;
    const instanceId = target.value;
    
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'setSelectedBurnerInstance', 
        instanceId 
      });
      
      if (response.success) {
        showToast('Burner instance updated');
        await initializeInboxes();
      }
    } catch (error) {
      console.error('Error setting Burner instance:', error);
      showToast('Failed to update Burner instance', 'error');
    }
  });

  // Add custom instance button handler
  addCustomInstanceButton.addEventListener('click', () => {
    customInstanceForm.style.display = 'block';
    customInstanceName.value = '';
    customInstanceUrl.value = '';
  });

  // Save custom instance handler
  saveCustomInstance.addEventListener('click', async () => {
    const name = customInstanceName.value.trim();
    const url = customInstanceUrl.value.trim();
    
    if (!name || !url) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      showToast('Please enter a valid URL', 'error');
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'addCustomBurnerInstance',
        instance: {
          name: name.toLowerCase().replace(/\s+/g, '-'),
          displayName: name,
          apiUrl: url
        }
      });
      
      if (response.success) {
        showToast('Custom instance added successfully');
        customInstanceForm.style.display = 'none';
        await initializeBurnerInstances();
      } else {
        showToast('Failed to add custom instance', 'error');
      }
    } catch (error) {
      console.error('Error adding custom instance:', error);
      showToast('Failed to add custom instance', 'error');
    }
  });

  // Cancel custom instance handler
  cancelCustomInstance.addEventListener('click', () => {
    customInstanceForm.style.display = 'none';
  });

  // Email Management Helper Functions
  async function updateEmailManagement() {
    try {
      let inboxes = [];
      
      // Try to get data from chrome.storage, fallback to mock data for testing
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['inboxes']);
          inboxes = result.inboxes || [];
        }
      } catch (error) {
        console.log('Chrome storage not available, using mock data for testing');
      }
      
      // If no inboxes found and we're in testing mode, create mock emails
      if (inboxes.length === 0 && typeof chrome === 'undefined') {
        inboxes = [
          {
            id: 'mock-email-1',
            address: 'test123@guerrillamail.com',
            provider: 'guerrillamail',
            createdAt: Date.now() - 86400000, // 1 day ago
            lastUsed: Date.now() - 3600000, // 1 hour ago
            expiresAt: Date.now() + 86400000, // expires in 1 day
            messages: [
              {
                id: 'msg1',
                subject: 'Welcome to our service',
                from_name: 'Service Team',
                received_at: Date.now() / 1000 - 3600,
                body_html: '<p>Welcome! Your account has been created successfully.</p>',
                otp: '123456'
              }
            ]
          },
          {
            id: 'mock-email-2',
            address: 'demo456@guerrillamail.com',
            provider: 'guerrillamail',
            createdAt: Date.now() - 172800000, // 2 days ago
            lastUsed: Date.now() - 7200000, // 2 hours ago
            expiresAt: Date.now() - 3600000, // expired 1 hour ago
            messages: [
              {
                id: 'msg2',
                subject: 'Password Reset Request',
                from_name: 'Security Team',
                received_at: Date.now() / 1000 - 7200,
                body_html: '<p>Click the link below to reset your password.</p>'
              }
            ]
          },
          {
            id: 'mock-email-3',
            address: 'archived789@guerrillamail.com',
            provider: 'guerrillamail',
            createdAt: Date.now() - 259200000, // 3 days ago
            lastUsed: Date.now() - 86400000, // 1 day ago
            expiresAt: Date.now() + 172800000, // expires in 2 days
            archived: true,
            messages: [
              {
                id: 'msg3',
                subject: 'Monthly Newsletter',
                from_name: 'Newsletter Team',
                received_at: Date.now() / 1000 - 86400,
                body_html: '<p>Here are the latest updates from our team.</p>'
              }
            ]
          }
        ];
      }
      
      // Get stored emails to calculate accurate message counts
      let storedEmails = {};
      try {
        const storedResult = await chrome.storage.local.get(['storedEmails']);
        storedEmails = storedResult.storedEmails || {};
      } catch (error) {
        console.log('Could not get stored emails:', error);
      }
      
      allEmails = inboxes.map((inbox, index) => {
        // Get message count from stored emails or fallback to inbox.messages
        const inboxStoredEmails = storedEmails[inbox.address] || [];
        const messageCount = inboxStoredEmails.length > 0 ? inboxStoredEmails.length : (inbox.messages ? inbox.messages.length : 0);
        
        return {
          id: inbox.id || `email-${index}-${Math.random().toString(36).substr(2, 9)}`,
          safeId: `email-${index}-${Math.random().toString(36).substr(2, 9)}`,
          address: inbox.address,
          provider: inbox.provider || 'guerrillamail',
          createdAt: inbox.createdAt || Date.now(),
          lastUsed: inbox.lastUsed || inbox.createdAt || Date.now(),
          messageCount: messageCount,
          status: getEmailStatus(inbox),
          expiresAt: inbox.expiresAt
        };
      });
      
      // Filter emails based on current tab and search query
      filteredEmails = allEmails.filter(email => {
        // Tab filter
        let tabMatch = false;
        switch (currentEmailTab) {
          case 'active':
            tabMatch = email.status === 'active';
            break;
          case 'expired':
            tabMatch = email.status === 'expired';
            break;
          case 'archived':
            tabMatch = email.status === 'archived';
            break;
          default:
            tabMatch = true;
        }
        
        // Search filter
        let searchMatch = true;
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          searchMatch = email.address.toLowerCase().includes(query) ||
                       email.provider.toLowerCase().includes(query);
        }
        
        return tabMatch && searchMatch;
      });
      
      renderEmailList();
      updateSelectionUI();
    } catch (error) {
      console.error('Error updating email management:', error);
    }
  }
  
  function getEmailStatus(inbox) {
    const now = Date.now();
    const expiresAt = inbox.expiresAt || 0;
    
    if (inbox.archived) return 'archived';
    if (now > expiresAt) return 'expired';
    return 'active';
  }
  
  function renderEmailList() {
    if (!emailManagementList) {
      console.error('Email management list element not found');
      return;
    }
    emailManagementList.innerHTML = '';
    
    if (filteredEmails.length === 0) {
      emailManagementList.innerHTML = '<div class="no-emails">No emails found for this category.</div>';
      return;
    }
    
    filteredEmails.forEach(email => {
      const emailItem = document.createElement('div');
      emailItem.className = 'email-item';
      
      // Calculate time information for active emails
      let timeInfo = '';
      if (email.status === 'active') {
        const timeLeft = email.expiresAt ? calculateTimeLeft(email.expiresAt) : null;
        const createdTime = formatDate(email.createdAt);
        const expiryText = timeLeft ? `Expires in ${formatTimeLeft(timeLeft)}` : 'No expiry';
        timeInfo = `
          <div class="email-time-info">
            <span class="email-created">Created: ${createdTime}</span>
            <span class="email-expiry">${expiryText}</span>
          </div>
        `;
      }
      
      // Check if this is a burner.kiwi email to conditionally show delete button
      const isBurnerKiwi = email.provider === 'burner' || email.address.includes('burner.kiwi');
      const isGuerrilla = email.provider === 'guerrilla';
      
      const deleteButtonHtml = isBurnerKiwi ? '' : `
        <button class="action-button icon-only delete-button" data-email-id="${email.id}" title="Delete Email">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-12 0v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6"/>
          </svg>
        </button>`;
      
      const renewButtonHtml = isGuerrilla ? `
        <button class="action-button icon-only renew-button" data-email-id="${email.id}" title="Renew Email">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>` : '';
      
      const editButtonHtml = isGuerrilla ? `
        <button class="action-button icon-only edit-button" data-email-id="${email.id}" title="Edit Email Address">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>` : '';
      
      emailItem.innerHTML = `
        <div class="email-checkbox">
          <input type="checkbox" id="${email.safeId}" ${selectedEmails.has(email.id) ? 'checked' : ''}>
        </div>
        <div class="email-content clickable" data-email-id="${email.id}">
          <div class="email-address-row">
            <div class="email-item-address" title="Click to view email details and messages">${email.address}</div>
          </div>
          <div class="email-detail-line">
            <span class="email-created">Created: ${formatDate(email.createdAt)}, Last Used: ${formatDate(email.lastUsed)} </span>
          </div>
          <div class="email-bottom-row">
            <div class="email-item-details">
              <div class="email-detail-line">
                <span class="email-expiry">${email.status === 'active' && email.expiresAt ? `Expires in ${formatTimeLeft(calculateTimeLeft(email.expiresAt))}` : 'No expiry'}</span>
              </div>
              <div class="email-detail-line">
                <span class="email-messages">Received Mails: ${email.messageCount}</span>
              </div>
              <div class="email-detail-line">
                <span class="email-provider">Provider: ${email.provider}</span>
              </div>
            </div>
            <div class="email-actions">
              <button class="action-button icon-only archive-button" data-email-id="${email.id}" title="${email.status === 'archived' ? 'Unarchive' : 'Archive'} Email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>
                </svg>
              </button>
              ${editButtonHtml}
              ${renewButtonHtml}
              ${deleteButtonHtml}
              <button class="action-button icon-only export-button" data-email-id="${email.id}" title="Export Email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m14-7l-5 5-5-5m5 5V3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners
      const checkbox = emailItem.querySelector(`#${email.safeId}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            selectedEmails.add(email.id);
          } else {
            selectedEmails.delete(email.id);
          }
          updateSelectionUI();
        });
      }

      const archiveButton = emailItem.querySelector('.archive-button') as HTMLButtonElement;
      if (archiveButton) {
        archiveButton.addEventListener('click', () => toggleArchiveEmail(email.id));
      }

      const exportButton = emailItem.querySelector('.export-button') as HTMLButtonElement;
      if (exportButton) {
        exportButton.addEventListener('click', async () => {
          try {
            const format = await showExportFormatDialog();
            if (format) {
              await exportSingleEmail(email, format);
              showToast(`Email exported as ${format.toUpperCase()}`);
            }
          } catch (error) {
            console.error('Error exporting email:', error);
            showToast('Failed to export email', true);
          }
        });
      }

      // Only add delete button event listener if the button exists (not for burner.kiwi emails)
      const deleteButton = emailItem.querySelector('.delete-button') as HTMLButtonElement;
      if (deleteButton) {
        deleteButton.addEventListener('click', () => deleteEmail(email.id));
      }

      // Add renew button event listener for Guerrilla Mail emails
      const renewButton = emailItem.querySelector('.renew-button') as HTMLButtonElement;
      if (renewButton) {
        renewButton.addEventListener('click', async () => {
          try {
            await renewGuerrillaEmail(email.id);
            showToast('Email renewed successfully');
            updateEmailManagement(); // Refresh the list
          } catch (error) {
            console.error('Error renewing email:', error);
            showToast('Failed to renew email', true);
          }
        });
      }

      // Add edit button event listener for Guerrilla Mail emails
      const editButton = emailItem.querySelector('.edit-button') as HTMLButtonElement;
      if (editButton) {
        editButton.addEventListener('click', async () => {
          try {
            await showEditEmailDialog(email.id);
          } catch (error) {
            console.error('Error editing email:', error);
            showToast('Failed to edit email', true);
          }
        });
      }

      // Add click listener to email content to show email details
      const emailContent = emailItem.querySelector('.email-content.clickable') as HTMLElement;
      if (emailContent) {
        emailContent.addEventListener('click', (e) => {
          // Don't trigger if clicking on action buttons or checkbox
          if ((e.target as HTMLElement).closest('.email-actions') || (e.target as HTMLElement).closest('.email-checkbox')) {
            return;
          }
          showEmailDetail(email);
        });
      }
      
      // Add click listener for email address to navigate to detail view
      const emailAddress = emailItem.querySelector('.email-address') as HTMLElement;
      if (emailAddress) {
        emailAddress.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Email address clicked:', email);
          showEmailDetail(email);
        });
      }
      
      emailManagementList.appendChild(emailItem);
    });
  }
  
  function updateSelectionUI() {
    if (selectedCount) {
      selectedCount.textContent = `${selectedEmails.size} selected`;
    }
    if (bulkArchiveButton) {
      bulkArchiveButton.disabled = selectedEmails.size === 0;
      // Update tooltip based on current tab
      const isArchivedTab = currentEmailTab === 'archived';
      bulkArchiveButton.title = isArchivedTab ? 'Unarchive Selected' : 'Archive Selected';
    }
    if (bulkDeleteButton) {
      bulkDeleteButton.disabled = selectedEmails.size === 0;
    }
    if (bulkExportButton) {
      bulkExportButton.disabled = selectedEmails.size === 0;
    }
    
    // Update select all checkbox
    if (selectAllEmails) {
      if (selectedEmails.size === 0) {
        selectAllEmails.indeterminate = false;
        selectAllEmails.checked = false;
      } else if (selectedEmails.size === filteredEmails.length) {
        selectAllEmails.indeterminate = false;
        selectAllEmails.checked = true;
      } else {
        selectAllEmails.indeterminate = true;
        selectAllEmails.checked = false;
      }
    }
  }
  
  function updateEmailCheckboxes() {
    filteredEmails.forEach(email => {
      const checkbox = document.getElementById(email.safeId) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = selectedEmails.has(email.id);
      }
    });
  }
  
  async function toggleArchiveEmail(emailId) {
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      const inbox = inboxes.find(inbox => (inbox.id || Math.random().toString(36).substr(2, 9)) === emailId);
      if (inbox) {
        inbox.archived = !inbox.archived;
        await chrome.storage.local.set({ inboxes });
        updateEmailManagement();
        showToast(`Email ${inbox.archived ? 'archived' : 'unarchived'}`);
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
      showToast('Failed to update email', true);
    }
  }
  
  async function deleteEmail(emailId) {
    const confirmed = confirm('Are you sure you want to delete this email address?');
    if (!confirmed) return;
    
    try {
      // Call background script to properly delete inbox (including API calls)
      const response = await chrome.runtime.sendMessage({ 
        type: 'deleteInbox', 
        inboxId: emailId 
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete email address');
      }
      
      selectedEmails.delete(emailId);
      updateEmailManagement();
      showToast('Email deleted');
    } catch (error) {
      console.error('Error deleting email:', error);
      showToast('Failed to delete email', true);
    }
  }

  async function renewGuerrillaEmail(emailId) {
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      const inbox = inboxes.find(inbox => inbox.id === emailId);
      
      if (!inbox) {
        throw new Error('Email address not found');
      }
      
      if (inbox.provider !== 'guerrilla') {
        throw new Error('Only Guerrilla Mail addresses can be renewed');
      }
      
      // Use the same renewal logic as the background script
      const response = await chrome.runtime.sendMessage({
        type: 'renewGuerrillaInbox',
        inboxId: emailId
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to renew email address');
      }
      
      // Update the inbox with new expiry time
      const updatedInbox = inboxes.find(inbox => inbox.id === emailId);
      if (updatedInbox) {
        updatedInbox.expiresAt = Date.now() + (60 * 60 * 1000); // 60 minutes from now
        await chrome.storage.local.set({ inboxes });
      }
      
    } catch (error) {
      console.error('Error renewing email:', error);
      throw error;
    }
  }
  
  function showExportFormatDialog() {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'export-dialog';
      dialog.innerHTML = `
        <div class="export-dialog-content">
          <h3>Select Export Format</h3>
          <div class="format-options">
            <button class="format-button" data-format="eml">EML Format</button>
            <button class="format-button" data-format="mbox">MBOX Format</button>
            <button class="format-button" data-format="json">JSON Format</button>
          </div>
          <div class="dialog-actions">
            <button class="cancel-button">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      dialog.querySelectorAll('.format-button').forEach(button => {
        button.addEventListener('click', () => {
          const format = button.getAttribute('data-format');
          document.body.removeChild(dialog);
          resolve(format);
        });
      });
      
      dialog.querySelector('.cancel-button').addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(null);
      });
    });
  }
  
  async function exportMultipleEMLAsZip(inboxes, baseFilename) {
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      let fileIndex = 1;
      
      inboxes.forEach(inbox => {
        const messages = inbox.messages || [];
        messages.forEach(message => {
          const emlContent = generateSingleEMLContent(inbox, message);
          const subject = (message.subject || 'No Subject').replace(/[^a-zA-Z0-9\s]/g, '_').substring(0, 50);
          const sanitizedAddress = inbox.address.replace(/[^a-zA-Z0-9]/g, '_');
          const filename = `${fileIndex.toString().padStart(3, '0')}_${sanitizedAddress}_${subject}.eml`;
          zip.file(filename, emlContent);
          fileIndex++;
        });
      });
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFilename}_emails.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      // Fallback to simple text archive if JSZip fails
      let archiveContent = '';
      archiveContent += '# EML Archive - Multiple Email Export\n';
      archiveContent += `# Generated on: ${new Date().toISOString()}\n`;
      archiveContent += '# Note: ZIP creation failed, using text format\n\n';
      
      let fileIndex = 1;
      inboxes.forEach(inbox => {
        const messages = inbox.messages || [];
        messages.forEach(message => {
          const emlContent = generateSingleEMLContent(inbox, message);
          const subject = (message.subject || 'No Subject').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
          const filename = `${fileIndex.toString().padStart(3, '0')}_${inbox.address}_${subject}.eml`;
          archiveContent += `=== FILE: ${filename} ===\n`;
          archiveContent += emlContent;
          archiveContent += '\n=== END OF FILE ===\n\n';
          fileIndex++;
        });
      });
      
      const blob = new Blob([archiveContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFilename}_emails.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
  
  async function exportEmails(inboxes, format) {
    let content = '';
    let filename = `emails_${new Date().toISOString().split('T')[0]}`;
    
    // Fetch messages for each inbox before exporting
    const inboxesWithMessages = await Promise.all(
      inboxes.map(async (inbox) => {
        try {
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            const response = await chrome.runtime.sendMessage({ 
              type: 'checkEmails', 
              inboxId: inbox.id, 
              filters: { searchQuery: '', hasOTP: false } 
            });
            if (response && response.success) {
              return { ...inbox, messages: response.messages || [] };
            }
          }
          return { ...inbox, messages: [] };
        } catch (error) {
          console.error('Error fetching messages for export:', error);
          return { ...inbox, messages: [] };
        }
      })
    );
    
    switch (format) {
      case 'eml':
        const totalMessages = inboxesWithMessages.reduce((total, inbox) => total + (inbox.messages?.length || 0), 0);
        
        if (totalMessages === 0) {
          content = '# No emails found to export';
          filename += '.eml';
        } else if (totalMessages === 1) {
          // Single email - export as regular EML file
          const firstInboxWithMessages = inboxesWithMessages.find(inbox => inbox.messages && inbox.messages.length > 0);
          const firstMessage = firstInboxWithMessages.messages[0];
          content = generateSingleEMLContent(firstInboxWithMessages, firstMessage);
          filename += '.eml';
        } else {
          // Multiple emails - create ZIP file with individual EML files
          await exportMultipleEMLAsZip(inboxesWithMessages, filename);
          return; // Exit early as ZIP export handles the download
        }
        break;
      case 'mbox':
        content = generateMBOXContent(inboxesWithMessages);
        filename += '.mbox';
        break;
      case 'json':
        content = JSON.stringify(inboxesWithMessages, null, 2);
        filename += '.json';
        break;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  function generateEMLContent(inbox) {
    const messages = inbox.messages || [];
    return messages.map(message => {
      return generateSingleEMLContent(inbox, message);
    }).join('\n\n---\n\n');
  }
  
  function generateSingleEMLContent(inbox, message) {
    const fromEmail = message.from_name || 'unknown@example.com';
    const subject = message.subject || 'No Subject';
    const date = new Date((message.received_at || Date.now() / 1000) * 1000).toUTCString();
    const body = message.body_html || message.body_plain || 'No content';
    
    // Proper EML format with required headers
    let emlContent = '';
    emlContent += `Return-Path: <${fromEmail}>\n`;
    emlContent += `Delivered-To: ${inbox.address}\n`;
    emlContent += `From: ${fromEmail}\n`;
    emlContent += `To: ${inbox.address}\n`;
    emlContent += `Subject: ${subject}\n`;
    emlContent += `Date: ${date}\n`;
    emlContent += `Message-ID: <${message.id || Date.now()}@${inbox.address}>\n`;
    emlContent += `MIME-Version: 1.0\n`;
    emlContent += `Content-Type: text/plain; charset=UTF-8\n`;
    emlContent += `\n`; // Empty line separates headers from body
    emlContent += `${body}\n`;
    
    return emlContent;
  }
  
  function generateMBOXContent(inboxes) {
    let mboxContent = '';
    inboxes.forEach(inbox => {
      const messages = inbox.messages || [];
      messages.forEach((message, index) => {
        const fromEmail = message.from_name || 'unknown@example.com';
        const subject = message.subject || 'No Subject';
        const date = new Date((message.received_at || Date.now() / 1000) * 1000).toUTCString();
        const body = message.body_html || message.body_plain || 'No content';
        
        // MBOX format requires "From " line (note the space) at the start of each message
        // This is the envelope sender line that separates messages in MBOX format
        mboxContent += `From ${fromEmail} ${date}\n`;
        mboxContent += `Return-Path: <${fromEmail}>\n`;
        mboxContent += `Delivered-To: ${inbox.address}\n`;
        mboxContent += `From: ${fromEmail}\n`;
        mboxContent += `To: ${inbox.address}\n`;
        mboxContent += `Subject: ${subject}\n`;
        mboxContent += `Date: ${date}\n`;
        mboxContent += `Message-ID: <${message.id || Date.now()}-${index}@${inbox.address}>\n`;
        mboxContent += `\n`; // Empty line separates headers from body
        mboxContent += `${body}\n`;
        mboxContent += `\n`; // Empty line at end of message
      });
    });
    return mboxContent;
  }
  
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  }

  // Email Detail View Functions
  async function showEmailDetail(email) {
    currentEmailDetail = email;
    emailDetailViewActive = true;
    
    // Update detail view content
    detailEmailAddress.textContent = email.address;
    detailEmailProvider.textContent = email.provider;
    detailMessageCount.textContent = `${email.messageCount} messages`;
    detailLastUsed.textContent = formatDate(email.lastUsed);
    
    // Show detail view and hide management view
    emailManagementSection.style.display = 'none';
    emailDetailSection.style.display = 'block';
    emailDetailSection.classList.add('fullscreen');
    
    // Load messages for this email
    await loadEmailMessages(email);
  }
  
  async function loadEmailMessages(email) {
    try {
      loadingMessages.style.display = 'block';
      noMessages.style.display = 'none';
      emailMessagesList.innerHTML = '';
      
      let messages = [];
      
      // Try to fetch messages from background script, fallback to mock data for testing
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          console.log('Fetching messages for email:', email.id);
          const response = await chrome.runtime.sendMessage({ 
            type: 'checkEmails', 
            inboxId: email.id, 
            filters: { searchQuery: '', hasOTP: false } 
          });
          console.log('Received messages response:', response);
          
          if (response && response.success) {
            messages = response.messages || [];
          } else {
            console.error('Failed to fetch messages:', response?.error);
          }
        }
      } catch (error) {
        console.log('Chrome runtime not available, using mock data for testing:', error);
      }
      
      // If no messages found and we're in testing mode, create mock messages
      if (messages.length === 0 && typeof chrome === 'undefined') {
        messages = [
          {
            id: 'mock1',
            subject: 'Welcome to our service',
            from_name: 'Service Team',
            received_at: Date.now() / 1000 - 3600,
            body_html: '<p>Welcome! Your account has been created successfully.</p>',
            otp: '123456'
          },
          {
            id: 'mock2', 
            subject: 'Password Reset Request',
            from_name: 'Security Team',
            received_at: Date.now() / 1000 - 7200,
            body_html: '<p>Click the link below to reset your password.</p>'
          },
          {
            id: 'mock3',
            subject: 'Monthly Newsletter',
            from_name: 'Newsletter Team',
            received_at: Date.now() / 1000 - 86400,
            body_html: '<p>Here are the latest updates from our team.</p>'
          }
        ];
      }
      
      if (messages.length === 0) {
        loadingMessages.style.display = 'none';
        noMessages.style.display = 'block';
        return;
      }
      
      messages = messages.sort((a, b) => b.received_at - a.received_at);
      
      loadingMessages.style.display = 'none';
      
      messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        
        const otpBadge = message.otp ? `
          <span class="otp-badge" title="Click to copy OTP" data-otp="${message.otp}">
            OTP: ${message.otp}
          </span>
        ` : '';
        
        let timeString = 'Unknown time';
        try {
          if (message.received_at) {
            let timestamp = message.received_at;
            
            // Handle different timestamp formats
            if (typeof timestamp === 'string') {
              // Try parsing as number first
              const parsed = parseFloat(timestamp);
              if (!isNaN(parsed)) {
                timestamp = parsed;
              } else {
                // Try parsing as ISO date string
                const dateObj = new Date(timestamp);
                if (!isNaN(dateObj.getTime())) {
                  timestamp = dateObj.getTime() / 1000;
                }
              }
            }
            
            // Convert to number if it's not already
            timestamp = Number(timestamp);
            
            // Check if timestamp is in seconds or milliseconds
            if (timestamp > 1000000000000) {
              // Timestamp is in milliseconds
              timestamp = timestamp / 1000;
            }
            
            // Validate timestamp is reasonable (after year 2000, before year 2100)
            if (timestamp > 946684800 && timestamp < 4102444800) {
              const date = new Date(timestamp * 1000);
              timeString = date.toLocaleString();
            } else {
              console.warn('Invalid timestamp range:', timestamp);
              timeString = 'Invalid date';
            }
          }
        } catch (error) {
          console.error('Error formatting timestamp:', message.received_at, error);
          timeString = 'Invalid date';
        }
        
        messageElement.innerHTML = `
          <div class="message-header">
            <div class="message-subject">${message.subject || 'No Subject'}</div>
            <div class="message-time">${timeString}</div>
            ${otpBadge}
          </div>
          <div class="message-meta">
            <div class="message-from">${message.from_name || 'Unknown Sender'}</div>
          </div>
          <div class="message-preview">${getMessagePreview(message)}</div>
        `;
        
        // Add click listener to show full message
        messageElement.addEventListener('click', () => showMessageDetail(message));
        
        // Add OTP copy functionality
        const badge = messageElement.querySelector('.otp-badge');
        if (badge) {
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            const otp = message.otp;
            copyToClipboard(otp);
          });
        }
        
        emailMessagesList.appendChild(messageElement);
      });
      
    } catch (error) {
      console.error('Error loading email messages:', error);
      loadingMessages.style.display = 'none';
      noMessages.style.display = 'block';
    }
  }
  
  function getMessagePreview(message) {
    let content = '';
    if (message.body_plain) {
      content = message.body_plain;
    } else if (message.body_html) {
      // Strip HTML tags for preview
      content = message.body_html.replace(/<[^>]*>/g, '');
    }
    
    // Limit preview to 150 characters
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  }
  
  async function exportSingleEmail(email) {
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      const inbox = inboxes.find(inbox => inbox.id === email.id);
      
      if (!inbox) {
        showToast('Email not found', true);
        return;
      }
      
      // Show export format selection
      const format = await showExportFormatDialog();
      if (!format) return;
      
      await exportEmails([inbox], format);
      showToast(`Email exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting single email:', error);
      showToast('Failed to export email', true);
    }
  }

  // Show edit email dialog for Guerrilla Mail addresses
  async function showEditEmailDialog(inboxId: string) {
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      const inbox = inboxes.find(i => i.id === inboxId);
      
      if (!inbox || inbox.provider !== 'guerrilla') {
        showToast('Edit functionality is only available for Guerrilla Mail addresses', true);
        return;
      }
      
      const currentAddress = inbox.address;
      const currentUser = currentAddress.split('@')[0];
      const domain = currentAddress.split('@')[1];
      
      const newUser = prompt(`Edit email address (current: ${currentUser})\nEnter new username (domain will remain ${domain}):`, currentUser);
      
      if (newUser && newUser !== currentUser && newUser.trim()) {
        const newAddress = `${newUser.trim()}@${domain}`;
        await changeEmailAddress(inboxId, newAddress);
      }
    } catch (error) {
      console.error('Error showing edit dialog:', error);
      showToast('Failed to show edit dialog', true);
    }
  }
  
  // Change email address using set_email_user API
  async function changeEmailAddress(inboxId: string, newAddress: string) {
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      const inbox = inboxes.find(i => i.id === inboxId);
      
      if (!inbox || !inbox.sidToken) {
        showToast('Invalid inbox or missing session token', true);
        return;
      }
      
      const newUser = newAddress.split('@')[0];
      
      // Call set_email_user API
      const response = await chrome.runtime.sendMessage({
        action: 'guerrillaApiCall',
        func: 'set_email_user',
        params: { email_user: newUser },
        sidToken: inbox.sidToken
      });
      
      if (response.success && response.data) {
        // Update inbox with new address
        const updatedInboxes = inboxes.map(i => {
          if (i.id === inboxId) {
            return {
              ...i,
              address: newAddress,
              id: newAddress // Update ID to match new address
            };
          }
          return i;
        });
        
        await chrome.storage.local.set({ inboxes: updatedInboxes });
        await chrome.storage.local.set({ activeInboxId: newAddress });
        
        // Update stored emails key
        const { storedEmails = {} } = await chrome.storage.local.get('storedEmails');
        if (storedEmails[inbox.address]) {
          storedEmails[newAddress] = storedEmails[inbox.address];
          delete storedEmails[inbox.address];
          await chrome.storage.local.set({ storedEmails });
        }
        
        showToast(`Email address changed to ${newAddress}`);
        await updateInboxDisplay();
      } else {
        showToast('Failed to change email address', true);
      }
    } catch (error) {
      console.error('Error changing email address:', error);
      showToast('Failed to change email address', true);
    }
  }
  
  // Toggle auto-extend setting for individual inbox
  async function toggleAutoExtend(inboxId: string) {
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      const inbox = inboxes.find(i => i.id === inboxId);
      
      if (!inbox || inbox.provider !== 'guerrilla') {
        showToast('Auto-extend functionality is only available for Guerrilla Mail addresses', true);
        return;
      }
      
      const currentAutoExtend = inbox.autoExtend || false;
      const newAutoExtend = !currentAutoExtend;
      
      // Update inbox with new auto-extend setting
      const updatedInboxes = inboxes.map(i => {
        if (i.id === inboxId) {
          return {
            ...i,
            autoExtend: newAutoExtend
          };
        }
        return i;
      });
      
      await chrome.storage.local.set({ inboxes: updatedInboxes });
      
      showToast(`Auto-extend ${newAutoExtend ? 'enabled' : 'disabled'} for ${inbox.address}`);
      await updateInboxDisplay();
    } catch (error) {
      console.error('Error toggling auto-extend:', error);
      showToast('Failed to toggle auto-extend', true);
    }
  }

  // Extend email expiry by creating new hidden address and using set_email_user
  async function extendEmailExpiry(inboxId: string) {
    try {
      const { inboxes = [] } = await chrome.storage.local.get(['inboxes']);
      const inbox = inboxes.find(i => i.id === inboxId);
      
      if (!inbox || inbox.provider !== 'guerrilla') {
        showToast('Extend functionality is only available for Guerrilla Mail addresses', true);
        return;
      }
      
      const currentAddress = inbox.address;
      const currentUser = currentAddress.split('@')[0];
      
      showToast('Extending email expiry...', false);
      
      // Step 1: Create a new hidden email address to get fresh sidToken
      const newEmailResponse = await chrome.runtime.sendMessage({
        action: 'guerrillaApiCall',
        func: 'get_email_address',
        params: {}
      });
      
      if (!newEmailResponse.success || !newEmailResponse.data.sid_token) {
        showToast('Failed to create temporary address for extension', true);
        return;
      }
      
      const newSidToken = newEmailResponse.data.sid_token;
      
      // Step 2: Use the new sidToken to set the old email address
      const setUserResponse = await chrome.runtime.sendMessage({
        action: 'guerrillaApiCall',
        func: 'set_email_user',
        params: { email_user: currentUser },
        sidToken: newSidToken
      });
      
      if (setUserResponse.success && setUserResponse.data) {
        // Update inbox with new sidToken and extended expiry
        const updatedInboxes = inboxes.map(i => {
          if (i.id === inboxId) {
            return {
              ...i,
              sidToken: newSidToken,
              expiresAt: Date.now() + (60 * 60 * 1000) // Extend by 1 hour
            };
          }
          return i;
        });
        
        await chrome.storage.local.set({ inboxes: updatedInboxes });
        
        showToast(`Email expiry extended for ${currentAddress}`);
        await updateInboxDisplay();
      } else {
        showToast('Failed to extend email expiry', true);
      }
    } catch (error) {
      console.error('Error extending email expiry:', error);
      showToast('Failed to extend email expiry', true);
    }
  }

  await initializeProvider();
  await initializeInboxes();
});
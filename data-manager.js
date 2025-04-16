async function exportData() {
  try {
    const { emailHistory = [], credentialsHistory = [], darkMode = false, inboxes = [], activeInboxId } = await chrome.storage.local.get(['emailHistory', 'credentialsHistory', 'darkMode', 'inboxes', 'activeInboxId']);
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        emailHistory,
        credentialsHistory,
        settings: {
          darkMode,
          activeInboxId
        },
        inboxes
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `oneclickautofill-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, error: error.message };
  }
}

async function importData(file) {
  try {
    const fileContent = await file.text();
    const importedData = JSON.parse(fileContent);
    
    if (!importedData.version || !importedData.data) {
      throw new Error('Invalid backup file format');
    }
    
    const { emailHistory = [], credentialsHistory = [], settings = {}, inboxes = [] } = importedData.data;
    
    if (!Array.isArray(emailHistory) || !Array.isArray(credentialsHistory) || !Array.isArray(inboxes)) {
      throw new Error('Invalid data format in backup file');
    }
    
    const { emailHistory: existingEmails = [], credentialsHistory: existingCreds = [], inboxes: existingInboxes = [] } = 
      await chrome.storage.local.get(['emailHistory', 'credentialsHistory', 'inboxes']);
    
    const mergedEmails = [...existingEmails];
    emailHistory.forEach(newEmail => {
      if (!mergedEmails.some(existing => existing.email === newEmail.email)) {
        mergedEmails.push(newEmail);
      }
    });
    
    const mergedCreds = [...existingCreds];
    credentialsHistory.forEach(newCred => {
      if (!mergedCreds.some(existing => 
        existing.domain === newCred.domain && 
        existing.username === newCred.username)) {
        mergedCreds.push(newCred);
      }
    });
    
    const mergedInboxes = [...existingInboxes];
    inboxes.forEach(newInbox => {
      if (!mergedInboxes.some(existing => existing.id === newInbox.id)) {
        mergedInboxes.push(newInbox);
      }
    });
    
    await chrome.storage.local.set({
      emailHistory: mergedEmails,
      credentialsHistory: mergedCreds,
      inboxes: mergedInboxes,
      darkMode: settings.darkMode,
      activeInboxId: settings.activeInboxId
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
}

window.dataManager = {
  exportData,
  importData
};
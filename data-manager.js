// Data Manager Module for OneClickAutofill

// Function to export all extension data
async function exportData() {
  try {
    const { emailHistory = [], credentialsHistory = [], darkMode = false } = await chrome.storage.local.get(['emailHistory', 'credentialsHistory', 'darkMode']);
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        emailHistory,
        credentialsHistory,
        settings: {
          darkMode
        }
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

// Function to import extension data
async function importData(file) {
  try {
    const fileContent = await file.text();
    const importedData = JSON.parse(fileContent);
    
    // Validate data structure
    if (!importedData.version || !importedData.data) {
      throw new Error('Invalid backup file format');
    }
    
    const { emailHistory = [], credentialsHistory = [], settings = {} } = importedData.data;
    
    // Validate data types
    if (!Array.isArray(emailHistory) || !Array.isArray(credentialsHistory)) {
      throw new Error('Invalid data format in backup file');
    }
    
    // Merge with existing data
    const { emailHistory: existingEmails = [], credentialsHistory: existingCreds = [] } = 
      await chrome.storage.local.get(['emailHistory', 'credentialsHistory']);
    
    // Merge email history, avoiding duplicates
    const mergedEmails = [...existingEmails];
    emailHistory.forEach(newEmail => {
      if (!mergedEmails.some(existing => existing.email === newEmail.email)) {
        mergedEmails.push(newEmail);
      }
    });
    
    // Merge credentials history, avoiding duplicates
    const mergedCreds = [...existingCreds];
    credentialsHistory.forEach(newCred => {
      if (!mergedCreds.some(existing => 
        existing.domain === newCred.domain && 
        existing.username === newCred.username)) {
        mergedCreds.push(newCred);
      }
    });
    
    // Save merged data
    await chrome.storage.local.set({
      emailHistory: mergedEmails,
      credentialsHistory: mergedCreds,
      darkMode: settings.darkMode
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
}

// Export functions
window.dataManager = {
  exportData,
  importData
};
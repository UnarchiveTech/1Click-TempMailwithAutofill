import type { Browser } from 'wxt/browser';
import { logError } from '@/utils/logger.js';
import type { Account, Email } from '@/utils/types.js';

export interface ManagementState {
  selectedEmail: string;
  emails: Email[];
  loading: boolean;
}

export interface ManagementSetters {
  setSelectedEmail: (email: string) => void;
  setEmails: (emails: Email[]) => void;
  setLoading: (loading: boolean) => void;
  setShowToast: (toast: { message: string; type?: 'success' | 'error' | 'warning'; icon?: 'success' | 'error' | 'warning' | 'expired' | 'archived' | 'deleted' | 'info' } | string, type?: 'success' | 'error' | 'warning') => void;
  loadInboxes: () => Promise<void>;
  setDropdownOpen: (open: boolean) => void;
  setEditingAccount: (account: Account | null) => void;
  setEditEmailDialogOpen: (open: boolean) => void;
}

export async function toggleAutoExtend(ext: Browser, account: Account, setters: ManagementSetters) {
  try {
    const result = (await ext.storage.local.get(['inboxes'])) as { inboxes?: Account[] };
    const inboxes = result.inboxes || [];
    const updated = inboxes.map((i: Account) =>
      i.id === account.id ? { ...i, autoExtend: !i.autoExtend } : i
    );
    await ext.storage.local.set({ inboxes: updated });
    await setters.loadInboxes();
    setters.setShowToast({ message: `Auto-extend ${!account.autoExtend ? 'enabled' : 'disabled'} for ${account.address}`, type: 'success', icon: 'success' });
  } catch (_e) {
    setters.setShowToast({ message: 'Failed to toggle auto-extend', type: 'error', icon: 'error' });
  }
}

export async function removeAccount(
  ext: Browser,
  address: string,
  accounts: Account[],
  state: ManagementState,
  setters: ManagementSetters
) {
  const acct = accounts.find((a) => a.address === address);
  if (!acct) return;
  try {
    await ext.runtime.sendMessage({ type: 'deleteInbox', inboxId: acct.id });
    if (state.selectedEmail === address) {
      setters.setSelectedEmail('');
      setters.setEmails([]);
    }
    setters.setDropdownOpen(false);
    await setters.loadInboxes();
    setters.setShowToast({ message: `Address ${address} deleted`, type: 'success', icon: 'deleted' });
  } catch (_e) {
    setters.setShowToast({ message: 'Failed to delete address', type: 'error', icon: 'error' });
  }
}

export async function archiveAccount(ext: Browser, account: Account, setters: ManagementSetters) {
  try {
    await ext.runtime.sendMessage({ type: 'archiveInbox', inboxId: account.id });
    await setters.loadInboxes();
    setters.setShowToast({ message: `Address ${account.address} archived`, type: 'success', icon: 'archived' });
  } catch (e) {
    logError('archiveAccount error:', e);
    setters.setShowToast({ message: 'Failed to archive', type: 'error', icon: 'error' });
  }
}

export async function unarchiveAccount(ext: Browser, account: Account, setters: ManagementSetters) {
  try {
    // Check if burner.kiwi email is expired - cannot unarchive expired burner emails
    if (account.provider === 'burner' && account.status === 'expired') {
      setters.setShowToast({ message: 'Cannot unarchive expired Burner.kiwi email', type: 'error', icon: 'error' });
      return;
    }

    await ext.runtime.sendMessage({ type: 'unarchiveInbox', inboxId: account.id });
    await setters.loadInboxes();
    setters.setShowToast({ message: `Address ${account.address} unarchived`, type: 'success', icon: 'success' });
  } catch (e) {
    logError('unarchiveAccount error:', e);
    setters.setShowToast({ message: 'Failed to unarchive', type: 'error', icon: 'error' });
  }
}

export function canUnarchive(account: Account): boolean {
  // Guerrilla Mail can always be unarchived (can be renewed)
  if (account.provider === 'guerrilla') {
    return true;
  }
  // Burner.kiwi can only be unarchived if not expired
  if (account.provider === 'burner') {
    return account.status !== 'expired';
  }
  return false;
}

export async function extendAccount(ext: Browser, account: Account, setters: ManagementSetters) {
  try {
    if (account.provider !== 'guerrilla') {
      setters.setShowToast(
        'Extend functionality is only available for Guerrilla Mail addresses',
        'error'
      );
      return;
    }

    const currentAddress = account.address;
    const currentUser = currentAddress.split('@')[0];

    setters.setShowToast('Extending email expiry...');

    // Step 1: Create a new hidden email address to get fresh sidToken
    const newEmailResponse = await ext.runtime.sendMessage({
      action: 'guerrillaApiCall',
      func: 'get_email_address',
      params: {},
    });

    if (!newEmailResponse.success || !newEmailResponse.data.sid_token) {
      setters.setShowToast('Failed to create temporary address for extension', 'error');
      return;
    }

    const newSidToken = newEmailResponse.data.sid_token;

    // Step 2: Use the new sidToken to set the old email address
    const setUserResponse = await ext.runtime.sendMessage({
      action: 'guerrillaApiCall',
      func: 'set_email_user',
      params: { email_user: currentUser },
      sidToken: newSidToken,
    });

    if (setUserResponse.success && setUserResponse.data) {
      // Update inbox with new sidToken and extended expiry
      const result = (await ext.storage.local.get(['inboxes'])) as { inboxes?: Account[] };
      const inboxes = result.inboxes || [];
      const updatedInboxes = inboxes.map((i: Account) => {
        if (i.id === account.id) {
          return {
            ...i,
            sidToken: newSidToken,
            expiresAt: Date.now() + 60 * 60 * 1000, // Extend by 1 hour
          };
        }
        return i;
      });

      await ext.storage.local.set({ inboxes: updatedInboxes });

      setters.setShowToast(`Email expiry extended for ${currentAddress}`);
      await setters.loadInboxes();
    } else {
      setters.setShowToast('Failed to extend email expiry', 'error');
    }
  } catch (e) {
    console.error('Error extending email expiry:', e);
    setters.setShowToast('Failed to extend email expiry', 'error');
  }
}

export function openEditEmailDialog(account: Account, setters: ManagementSetters) {
  setters.setEditingAccount(account);
  setters.setEditEmailDialogOpen(true);
}

export function closeEditEmailDialog(setters: ManagementSetters) {
  setters.setEditEmailDialogOpen(false);
  setters.setEditingAccount(null);
}

export async function editEmailAddress(account: Account, setters: ManagementSetters) {
  if (account.provider !== 'guerrilla') {
    setters.setShowToast(
      'Edit functionality is only available for Guerrilla Mail addresses',
      'error'
    );
    return;
  }

  openEditEmailDialog(account, setters);
}

export async function handleSaveEmailUsername(
  ext: Browser,
  newUsername: string,
  editingAccount: Account | null,
  setters: ManagementSetters
) {
  if (!editingAccount) return;

  try {
    const currentAddress = editingAccount.address;
    const domain = currentAddress.split('@')[1];
    const newAddress = `${newUsername}@${domain}`;

    // Call background script to change email address
    const response = await ext.runtime.sendMessage({
      action: 'guerrillaApiCall',
      func: 'set_email_user',
      params: { email_user: newUsername },
      sidToken: editingAccount.sidToken,
    });

    if (response.success && response.data) {
      // Update inbox with new address
      const { inboxes = [] } = (await ext.storage.local.get(['inboxes'])) as {
        inboxes?: Account[];
      };
      const inboxIndex = inboxes.findIndex((i) => i.id === editingAccount!.id);
      if (inboxIndex !== -1) {
        inboxes[inboxIndex].address = newAddress;
        inboxes[inboxIndex].id = newAddress;
        await ext.storage.local.set({ inboxes });
      }

      // Reload inboxes
      await setters.loadInboxes();
      setters.setShowToast('Email address updated successfully');
      closeEditEmailDialog(setters);
    } else {
      setters.setShowToast('Failed to update email address', 'error');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(
      'Error updating email address:',
      { account: editingAccount?.address, error: errorMessage },
      error instanceof Error ? error : new Error(errorMessage)
    );
    setters.setShowToast('Failed to update email address', 'error');
  }
}

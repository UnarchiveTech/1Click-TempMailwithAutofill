import { EmailService, loadProviderConfig } from '@/services/email-service.js';
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
  setShowToast: (
    toast:
      | {
          message: string;
          type?: 'success' | 'error' | 'warning';
          icon?: 'success' | 'error' | 'warning' | 'expired' | 'archived' | 'deleted' | 'info';
        }
      | string,
    type?: 'success' | 'error' | 'warning'
  ) => void;
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
    setters.setShowToast({
      message: `Auto-extend ${!account.autoExtend ? 'enabled' : 'disabled'} for ${account.address}`,
      type: 'success',
      icon: 'success',
    });
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
    setters.setShowToast({
      message: `Address ${address} deleted`,
      type: 'success',
      icon: 'deleted',
    });
  } catch (_e) {
    setters.setShowToast({ message: 'Failed to delete address', type: 'error', icon: 'error' });
  }
}

export async function archiveAccount(ext: Browser, account: Account, setters: ManagementSetters) {
  try {
    await ext.runtime.sendMessage({ type: 'archiveInbox', inboxId: account.id });
    await setters.loadInboxes();
    setters.setShowToast({
      message: `Address ${account.address} archived`,
      type: 'success',
      icon: 'archived',
    });
  } catch (e) {
    logError('archiveAccount error:', e);
    setters.setShowToast({ message: 'Failed to archive', type: 'error', icon: 'error' });
  }
}

export async function unarchiveAccount(ext: Browser, account: Account, setters: ManagementSetters) {
  try {
    await ext.runtime.sendMessage({ type: 'unarchiveInbox', inboxId: account.id });
    await setters.loadInboxes();
    setters.setShowToast({
      message: `Address ${account.address} unarchived`,
      type: 'success',
      icon: 'success',
    });
  } catch (e) {
    logError('unarchiveAccount error:', e);
    setters.setShowToast({ message: 'Failed to unarchive', type: 'error', icon: 'error' });
  }
}

export function canUnarchive(account: Account): boolean {
  const config = loadProviderConfig(account.provider);
  const canUnarchiveRule = config.ui?.canUnarchive;

  if (canUnarchiveRule === true) {
    return true;
  } else if (canUnarchiveRule === 'ifNotExpired') {
    return account.status !== 'expired';
  }
  return false;
}

async function canRenew(providerId: string): Promise<boolean> {
  const config = loadProviderConfig(providerId);
  return config.expiry?.renewable || false;
}

export async function extendAccount(ext: Browser, account: Account, setters: ManagementSetters) {
  try {
    if (!(await canRenew(account.provider))) {
      setters.setShowToast('Extend functionality is not available for this provider', 'error');
      return;
    }

    setters.setShowToast('Extending email expiry...');

    const result = await ext.runtime.sendMessage({
      type: 'extendInbox',
      inboxId: account.id,
    });

    if (result.success) {
      await setters.loadInboxes();
      setters.setShowToast('Email expiry extended successfully', 'success');
    } else {
      setters.setShowToast('Failed to extend email expiry', 'error');
    }
  } catch (e) {
    logError('extendAccount error:', e);
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

export async function editAccount(ext: Browser, account: Account, setters: ManagementSetters) {
  try {
    if (!(await canRenew(account.provider))) {
      setters.setShowToast('Edit functionality is not available for this provider', 'error');
      return;
    }

    const currentAddress = account.address;
    const _currentUser = currentAddress.split('@')[0];

    setters.setShowToast('Editing email address...');

    const result = await ext.runtime.sendMessage({
      type: 'editInbox',
      inboxId: account.id,
    });

    if (result.success) {
      await setters.loadInboxes();
      setters.setShowToast('Email address edited successfully', 'success');
    } else {
      setters.setShowToast('Failed to edit email address', 'error');
    }
  } catch (e) {
    logError('editAccount error:', e);
    setters.setShowToast('Failed to edit email address', 'error');
  }
}

export async function editEmailAddress(account: Account, setters: ManagementSetters) {
  if (!(await canRenew(account.provider))) {
    setters.setShowToast('Edit functionality is not available for this provider', 'error');
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
    const config = loadProviderConfig(editingAccount.provider);

    // Check if provider supports setEmailUser operation
    if (!config.operations?.setEmailUser) {
      setters.setShowToast('Email username change not supported for this provider', 'error');
      return;
    }

    const currentAddress = editingAccount.address;
    const domain = currentAddress.split('@')[1];
    const newAddress = `${newUsername}@${domain}`;

    // Use EmailService to change email address
    const service = new EmailService(config, ext);
    const response = await service.executeOperation('setEmailUser', {
      auth: { token: editingAccount.sidToken as string },
      variables: { emailUser: newUsername },
    });

    if (response) {
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

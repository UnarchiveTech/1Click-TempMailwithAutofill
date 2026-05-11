import type { ToastType } from '@/components/feedback/Toast.svelte';
import { EmailService, loadProviderConfig } from '@/utils/email-service.js';
import { detectIconFromMessage } from '@/utils/iconMapping.js';
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
          type?: ToastType;
          icon?: ToastType;
        }
      | string,
    type?: ToastType
  ) => void;
  loadInboxes: () => Promise<void>;
  setDropdownOpen: (open: boolean) => void;
  setEditingAccount: (account: Account | null) => void;
  setEditEmailDialogOpen: (open: boolean) => void;
  setArchivedSectionOpen?: (open: boolean) => Promise<void>;
  showOnboarding?: () => void;
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
    const iconType = detectIconFromMessage(
      `Auto-extend ${!account.autoExtend ? 'enabled' : 'disabled'} for ${account.address}`
    );
    setters.setShowToast({
      message: `Auto-extend ${!account.autoExtend ? 'enabled' : 'disabled'} for ${account.address}`,
      type: iconType,
    });
  } catch (_e) {
    setters.setShowToast({ message: 'Failed to toggle auto-extend', type: 'error' });
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

  // Capture pre-deletion state from the active accounts list (no archived)
  const activeAccountsBefore = accounts.filter((a: Account) => !a.archived && !a.deleted);
  const currentIndex = activeAccountsBefore.findIndex((a) => a.address === address);
  const wasSelected = state.selectedEmail === address;

  try {
    // Soft delete: mark as deleted instead of removing from storage
    const { inboxes = [] } = (await ext.storage.local.get(['inboxes'])) as { inboxes?: Account[] };
    const inboxIndex = inboxes.findIndex((i: Account) => i.id === acct.id);

    if (inboxIndex !== -1) {
      inboxes[inboxIndex] = { ...inboxes[inboxIndex], deleted: true };
      await ext.storage.local.set({ inboxes });
    }

    await setters.loadInboxes();

    // Handle navigation after deletion
    if (wasSelected) {
      const updatedInboxes = (await (await ext.storage.local.get(['inboxes']))?.inboxes) || [];
      const activeAccountsAfter = updatedInboxes.filter((a: Account) => !a.archived && !a.deleted);
      const archivedAccounts = updatedInboxes.filter((a: Account) => a.archived);
      const deletedAccounts = updatedInboxes.filter((a: Account) => a.deleted);

      if (activeAccountsAfter.length > 0) {
        // Still have active accounts - navigate to next, or previous if at end
        // currentIndex is position in pre-deletion list; post-deletion the same slot
        // is now occupied by the next item (or previous if it was the last)
        const nextCandidate =
          activeAccountsAfter[currentIndex] ?? activeAccountsAfter[currentIndex - 1];
        setters.setSelectedEmail(nextCandidate.address);
        setters.setEmails([]);
        setters.setDropdownOpen(false);
      } else if (archivedAccounts.length > 0 && setters.setArchivedSectionOpen) {
        // No active accounts left but have archived - open dropdown with archived section
        setters.setSelectedEmail('');
        setters.setEmails([]);
        await setters.setArchivedSectionOpen(true);
      } else if (deletedAccounts.length > 0) {
        // No active or archived accounts but have deleted - just clear selection
        setters.setSelectedEmail('');
        setters.setEmails([]);
        setters.setDropdownOpen(false);
      } else if (setters.showOnboarding) {
        // No accounts at all - show onboarding
        setters.setSelectedEmail('');
        setters.setEmails([]);
        setters.setDropdownOpen(false);
        setters.showOnboarding();
      } else {
        setters.setSelectedEmail('');
        setters.setEmails([]);
        setters.setDropdownOpen(false);
      }
    } else {
      setters.setDropdownOpen(false);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    setters.setShowToast({ message: `Failed to delete inbox: ${msg}`, type: 'error' });
  }
}

export async function archiveAccount(
  ext: Browser,
  account: Account,
  _accounts: Account[],
  state: ManagementState,
  setters: ManagementSetters
) {
  try {
    const wasSelected = state.selectedEmail === account.address;
    await ext.runtime.sendMessage({ type: 'archiveInbox', inboxId: account.id });
    await setters.loadInboxes();

    // If the archived account was selected, navigate to next active account
    if (wasSelected) {
      const updatedInboxes = (await (await ext.storage.local.get(['inboxes']))?.inboxes) || [];
      const activeAccounts = updatedInboxes.filter((a: Account) => !a.archived);

      if (activeAccounts.length > 0) {
        // Select the next active account
        setters.setSelectedEmail(activeAccounts[0].address);
      } else {
        // No active accounts left - clear selection
        setters.setSelectedEmail('');
      }
    }

    // Open dropdown with archived section to show the archived account
    if (setters.setArchivedSectionOpen) {
      await setters.setArchivedSectionOpen(true);
    }

    setters.setShowToast({
      message: `Address ${account.address} archived`,
      type: 'success',
      icon: 'archived',
    });
  } catch (e) {
    logError('archiveAccount error:', e);
    setters.setShowToast({ message: 'Failed to archive', type: 'error' });
  }
}

export async function unarchiveAccount(ext: Browser, account: Account, setters: ManagementSetters) {
  try {
    await ext.runtime.sendMessage({ type: 'unarchiveInbox', inboxId: account.id });
    await setters.loadInboxes();
    const iconType = detectIconFromMessage(`Address ${account.address} unarchived`);
    setters.setShowToast({
      message: `Address ${account.address} unarchived`,
      type: iconType,
    });
  } catch (e) {
    logError('unarchiveAccount error:', e);
    setters.setShowToast({ message: 'Failed to unarchive', type: 'error' });
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
      const iconType = detectIconFromMessage('Email expiry extended successfully');
      setters.setShowToast('Email expiry extended successfully', iconType);
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
      const iconType = detectIconFromMessage('Email address edited successfully');
      setters.setShowToast('Email address edited successfully', iconType);
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
      const iconType = detectIconFromMessage('Email address updated successfully');
      setters.setShowToast('Email address updated successfully', iconType);
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

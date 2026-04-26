import type { Account, Email } from '@/utils/types.js';

export interface ShortcutsState {
  currentView: string;
  mgmtTab: string;
  selectedAddresses: Set<string>;
  mgmtSearch: string;
  qrDialogOpen: boolean;
  confirmDialog: { message: string; onConfirm: () => void } | null;
  selectedMessage: Email | null;
  currentEmailDetail: Account | null;
}

export interface ShortcutsCallbacks {
  refreshInbox: () => void;
  createInbox: () => void;
  copyEmail: () => void;
  copyOtp: () => void;
  closeConfirm: () => void;
  closeQrDialog: () => void;
  setCurrentView: (view: string) => void;
  setSelectedAddresses: (addresses: Set<string>) => void;
  setMgmtSearch: (search: string) => void;
  setSelectedMessage: (message: Email | null) => void;
  setCurrentEmailDetail: (detail: Account | null) => void;
}

export function handleKeydown(
  event: KeyboardEvent,
  state: ShortcutsState,
  callbacks: ShortcutsCallbacks
) {
  // Ctrl/Cmd + R: Refresh inbox
  if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
    event.preventDefault();
    callbacks.refreshInbox();
  }
  // Ctrl/Cmd + N: Create new inbox
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault();
    callbacks.createInbox();
  }
  // Ctrl/Cmd + C: Copy email (if not in input)
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key === 'c' &&
    !((event.target as HTMLElement).tagName === 'INPUT') &&
    !((event.target as HTMLElement).tagName === 'TEXTAREA')
  ) {
    event.preventDefault();
    callbacks.copyEmail();
  }
  // Ctrl/Cmd + O: Copy OTP
  if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
    event.preventDefault();
    callbacks.copyOtp();
  }
  // Escape: Close dialogs
  if (event.key === 'Escape') {
    if (state.currentView === 'mailSettings') {
      callbacks.setCurrentView('main');
      callbacks.setSelectedAddresses(new Set());
      callbacks.setMgmtSearch('');
    } else if (
      state.currentView === 'settings' ||
      state.currentView === 'analytics' ||
      state.currentView === 'loginInfo' ||
      state.currentView === 'archivedEmails' ||
      state.currentView === 'about'
    ) {
      callbacks.setCurrentView('main');
    } else if (state.currentView === 'emailDetail') {
      callbacks.setCurrentView('mailSettings');
      callbacks.setCurrentEmailDetail(null);
    } else if (state.currentView === 'messageDetail') {
      callbacks.setCurrentView('main');
      callbacks.setSelectedMessage(null);
    } else if (state.qrDialogOpen) {
      callbacks.closeQrDialog();
    } else if (state.confirmDialog) {
      callbacks.closeConfirm();
    }
  }
}

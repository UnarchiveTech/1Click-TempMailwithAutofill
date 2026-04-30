import QRCode from 'qrcode';
import { logError } from '@/utils/logger.js';

export interface QRState {
  qrDialogOpen: boolean;
  qrCanvas: HTMLCanvasElement | null;
  qrDialogElement: HTMLElement | null;
  previousFocusElement: HTMLElement | null;
  customColor: string;
}

export interface QRSetters {
  setQrDialogOpen: (open: boolean) => void;
  setQrCanvas: (canvas: HTMLCanvasElement | null) => void;
  setQrDialogElement: (element: HTMLElement | null) => void;
  setPreviousFocusElement: (element: HTMLElement | null) => void;
  setShowToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export async function openQrDialog(
  _selectedEmail: string,
  state: QRState,
  setters: QRSetters,
  setupFocusTrap: (element: HTMLElement) => void
) {
  setters.setPreviousFocusElement(document.activeElement as HTMLElement);
  setters.setQrDialogOpen(true);
  // QR generation is now handled within QrDialog component using $effect
  setTimeout(() => {
    if (state.qrDialogElement) {
      state.qrDialogElement.focus();
      setupFocusTrap(state.qrDialogElement);
    }
  }, 50);
}

export function closeQrDialog(
  focusTrapCleanup: (() => void) | null,
  state: QRState,
  setters: QRSetters
) {
  focusTrapCleanup?.();
  setters.setQrDialogOpen(false);
  if (state.previousFocusElement) {
    state.previousFocusElement.focus();
  }
}

export async function generateQRCode(canvas: HTMLCanvasElement, text: string, customColor: string) {
  if (!canvas || !text) return;
  try {
    // Get the primary color from CSS variable or use custom color
    const primaryColor =
      customColor ||
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() ||
      'var(--color-primary)';
    await QRCode.toCanvas(canvas, text, {
      width: 160,
      margin: 2,
      color: {
        dark: primaryColor,
        light:
          getComputedStyle(document.documentElement).getPropertyValue('--color-base-100').trim() ||
          'var(--color-base-100)',
      },
    });
  } catch (e) {
    logError('QR error:', e);
  }
}

export function downloadQrCode(
  qrCanvas: HTMLCanvasElement | null,
  selectedEmail: string,
  showToast: (message: string) => void
) {
  if (!qrCanvas) return;
  const link = document.createElement('a');
  link.download = `qr-${selectedEmail}.png`;
  link.href = qrCanvas.toDataURL();
  link.click();
  showToast('QR code downloaded');
}

export async function copyQrImage(
  qrCanvas: HTMLCanvasElement | null,
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
) {
  if (!qrCanvas) return;
  try {
    qrCanvas.toBlob(async (blob) => {
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        showToast('QR code copied to clipboard');
      }
    });
  } catch (e) {
    logError('Failed to copy QR code:', e);
    showToast('Failed to copy QR code', 'error');
  }
}

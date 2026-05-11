import type { Toast, ToastType } from '@/components/feedback/Toast.svelte';

class ToastStore {
  private toasts: Toast[] = [];
  private listeners = new Set<(toasts: Toast[]) => void>();

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      listener(this.toasts);
    });
  }

  add(type: ToastType, message: string, duration?: number) {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, message, duration };
    this.toasts = [...this.toasts, toast];
    this.notify();
    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  success(message: string, duration?: number) {
    return this.add('success', message, duration);
  }

  error(message: string, duration?: number) {
    return this.add('error', message, duration);
  }

  warning(message: string, duration?: number) {
    return this.add('warning', message, duration);
  }

  info(message: string, duration?: number) {
    return this.add('info', message, duration);
  }
}

export const toastStore = new ToastStore();

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  duration?: number;   // ms — 0 = persistent (no auto-dismiss)
  closable?: boolean;  // default true
}

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
  closable: boolean;
}

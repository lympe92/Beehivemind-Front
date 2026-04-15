import { Injectable, signal } from '@angular/core';
import { Toast, ToastOptions, ToastType } from './toast.model';

const DEFAULT_DURATION = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 0;

  success(message: string, options?: ToastOptions): void {
    this.show('success', message, options);
  }

  error(message: string, options?: ToastOptions): void {
    this.show('error', message, options);
  }

  warning(message: string, options?: ToastOptions): void {
    this.show('warning', message, options);
  }

  info(message: string, options?: ToastOptions): void {
    this.show('info', message, options);
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private show(type: ToastType, message: string, options: ToastOptions = {}): void {
    const id = ++this.nextId;
    const duration = options.duration !== undefined ? options.duration : DEFAULT_DURATION;
    const closable = options.closable !== false;

    const toast: Toast = { id, type, message, title: options.title, duration, closable };
    this._toasts.update(list => [...list, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}

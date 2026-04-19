import { InjectionToken } from '@angular/core';

export type ModalType = 'center' | 'drawer' | 'confirm';

export interface ModalConfig<TData = unknown> {
  type?: ModalType;
  data?: TData;
  width?: string;
  disableClose?: boolean;
}

export interface ConfirmConfig {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export const MODAL_DATA = new InjectionToken<unknown>('MODAL_DATA');

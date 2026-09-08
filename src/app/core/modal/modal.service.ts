import { Injectable, inject, Type, DOCUMENT } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { ModalConfig, ModalType, ConfirmConfig, MODAL_DATA } from './modal.types';
import { ConfirmModalComponent } from '../../shared/components/ui/modal/confirm-modal/confirm-modal';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private dialog = inject(Dialog);
  private document = inject(DOCUMENT);

  async open<TResult = unknown, TData = unknown>(
    component: Type<unknown>,
    config: ModalConfig<TData> = {},
  ): Promise<TResult | undefined> {
    const { type = 'center', data, width, disableClose = false } = config;

    const ref = this.dialog.open(component, {
      panelClass: this.panelClass(type),
      backdropClass: 'modal-backdrop',
      hasBackdrop: true,
      disableClose,
      width,
      providers: [{ provide: MODAL_DATA, useValue: data }],
    });

    // The dialog contract: the page behind stops scrolling while a panel is
    // open. CDK blocks scroll on <html>; the body lock is what the system
    // wrote down, so both are set and the body is released with the last panel.
    this.lockBody(true);
    try {
      return (await firstValueFrom(ref.closed)) as TResult | undefined;
    } finally {
      if (this.dialog.openDialogs.length === 0) this.lockBody(false);
    }
  }

  async confirm(config: ConfirmConfig): Promise<boolean> {
    const result = await this.open<boolean, ConfirmConfig>(ConfirmModalComponent, {
      type: 'confirm',
      data: config,
    });
    return result === true;
  }

  private lockBody(locked: boolean): void {
    const body = this.document?.body;
    if (!body) return;
    body.style.overflow = locked ? 'hidden' : '';
  }

  private panelClass(type: ModalType): string[] {
    const map: Record<ModalType, string> = {
      center:  'modal-panel--center',
      drawer:  'modal-panel--drawer',
      confirm: 'modal-panel--confirm',
    };
    return ['modal-panel', map[type]];
  }
}

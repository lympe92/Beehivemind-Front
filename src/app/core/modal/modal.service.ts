import { Injectable, inject, Type } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { ModalConfig, ModalType, ConfirmConfig, MODAL_DATA } from './modal.types';
import { ConfirmModalComponent } from '../../shared/components/ui/modal/confirm-modal/confirm-modal';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private dialog = inject(Dialog);

  open<TResult = unknown, TData = unknown>(
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

    return firstValueFrom(ref.closed) as Promise<TResult | undefined>;
  }

  async confirm(config: ConfirmConfig): Promise<boolean> {
    const result = await this.open<boolean, ConfirmConfig>(ConfirmModalComponent, {
      type: 'confirm',
      data: config,
    });
    return result === true;
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

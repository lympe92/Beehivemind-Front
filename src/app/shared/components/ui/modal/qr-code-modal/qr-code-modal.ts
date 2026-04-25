import { Component, inject, signal } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { ModalShellComponent } from '../modal-shell/modal-shell';
import { QrCodeComponent } from '../../qr-code/qr-code';

export interface QrCodeModalData {
  value: string;
  title: string;
  subtitle?: string;
  downloadName?: string;
}

@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [ModalShellComponent, QrCodeComponent],
  templateUrl: './qr-code-modal.html',
  styleUrl: './qr-code-modal.scss',
})
export class QrCodeModalComponent {
  private dialogRef = inject(DialogRef);
  readonly data = inject<QrCodeModalData>(MODAL_DATA);

  private downloadUrl = signal<string | null>(null);

  onQrReady(url: string): void {
    this.downloadUrl.set(url);
  }

  download(): void {
    const url = this.downloadUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.data.downloadName ?? 'qrcode'}.png`;
    a.click();
  }

  close(): void {
    this.dialogRef.close();
  }
}

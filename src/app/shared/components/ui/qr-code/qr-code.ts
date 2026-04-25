import { Component, effect, input, output, signal } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.scss',
})
export class QrCodeComponent {
  readonly value = input.required<string>();
  readonly size = input(200);

  readonly ready = output<string>();

  protected dataUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      const v = this.value();
      const s = this.size();
      if (!v) return;

      QRCode.toDataURL(v, { width: s, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then(url => {
          this.dataUrl.set(url);
          this.ready.emit(url);
        });
    });
  }
}

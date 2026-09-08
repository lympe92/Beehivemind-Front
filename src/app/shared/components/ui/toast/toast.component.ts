import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

/**
 * The toaster. Mounted once in app.html. Styles: `.toast*` in
 * styles/components/app/app.css — a white card with a 4px semantic bar and an
 * ink label; `info` is grey because there is no info colour.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  protected toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;
}

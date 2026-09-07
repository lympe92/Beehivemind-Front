import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/ui/toast/toast.component';
import { GoogleAnalyticsService } from './core/services/google-analytics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('beehivemind-Front');
  private analytics = inject(GoogleAnalyticsService);

  constructor() {
    this.analytics.init();
  }
}

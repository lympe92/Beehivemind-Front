import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/ui/toast/toast.component';
import { GoogleAnalyticsService } from './core/services/google-analytics.service';
import { GoogleTagManagerService } from './core/services/google-tag-manager.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('beehivemind-Front');
  private analytics = inject(GoogleAnalyticsService);
  private tagManager = inject(GoogleTagManagerService);

  constructor() {
    this.analytics.init();
    this.tagManager.init();
  }
}

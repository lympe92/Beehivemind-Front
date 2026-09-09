import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthCardComponent } from '../../../shared/components/forms/auth-card/auth-card';

@Component({
  selector: 'app-auth-confirmation',
  standalone: true,
  imports: [RouterLink, AuthCardComponent],
  templateUrl: './confirmation.html',
})
export class ConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private analytics = inject(AnalyticsService);

  state = signal<'loading' | 'success' | 'error'>('loading');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('error');
      return;
    }

    this.authService.confirmEmail(token).subscribe({
      next: () => {
        this.state.set('success');
        // The step between sign_up and login that an unconfirmed account never reaches.
        this.analytics.event('email_confirmed');
      },
      error: () => this.state.set('error'),
    });
  }
}

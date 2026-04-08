import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-confirmation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class ConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  state = signal<'loading' | 'success' | 'error'>('loading');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('error');
      return;
    }

    this.authService.confirmEmail(token).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('error'),
    });
  }
}

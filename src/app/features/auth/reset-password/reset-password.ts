import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  token = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // When no token: show "request reset" form
  requestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // When token present: show "new password" form
  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.token.set(token);
  }

  submitRequest(): void {
    if (this.requestForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.authService.requestPasswordReset(this.requestForm.value.email!).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Something went wrong. Please try again.');
      },
    });
  }

  submitReset(): void {
    if (this.resetForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.authService.resetPassword(this.token()!, this.resetForm.value.password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Invalid or expired token.');
      },
    });
  }
}

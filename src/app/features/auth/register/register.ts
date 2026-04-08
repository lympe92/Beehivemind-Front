import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(55)]],
    surname: ['', [Validators.required, Validators.maxLength(55)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }
}

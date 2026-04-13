import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { EmployeeAuthActions } from '../../../store/employee-auth/employee-auth.actions';
import {
  selectEmployeeAuthError,
  selectEmployeeAuthLoading,
  selectEmployeeTwoFactorStep,
  selectEmployeeTwoFactorToken,
  selectIsEmployeeLoggedIn,
} from '../../../store/employee-auth/employee-auth.selectors';
import { EmployeeAuthService } from '../../../core/services/employee-auth.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, AsyncPipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class AdminLoginComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private employeeAuthService = inject(EmployeeAuthService);
  private platformId = inject(PLATFORM_ID);

  loading$ = this.store.select(selectEmployeeAuthLoading);
  error$ = this.store.select(selectEmployeeAuthError);
  twoFactorStep$ = this.store.select(selectEmployeeTwoFactorStep);
  twoFactorToken$ = this.store.select(selectEmployeeTwoFactorToken);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  // Setup 2FA state
  setupSecret = '';
  setupQrDataUrl = signal<string>('');
  setupCode = '';
  setupLoading = false;
  setupError = '';

  // Verify 2FA state
  verifyCode = '';
  verifyLoading = false;
  verifyError = '';
  showBackupInput = false;
  backupCode = '';

  ngOnInit(): void {
    this.store.select(selectIsEmployeeLoggedIn).subscribe((loggedIn) => {
      if (loggedIn) this.router.navigate(['/admin/dashboard']);
    });

    // When step becomes 'setup', fetch the QR
    this.store.select(selectEmployeeTwoFactorStep).subscribe((step) => {
      if (step === 'setup') {
        this.store.select(selectEmployeeTwoFactorToken).subscribe((token) => {
          if (token) this.loadSetup(token);
        }).unsubscribe();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    this.store.dispatch(EmployeeAuthActions.login({ email, password }));
  }

  private loadSetup(twoFactorToken: string): void {
    this.setupLoading = true;
    this.setupError = '';
    this.employeeAuthService.getSetup2FA(twoFactorToken).subscribe({
      next: ({ secret, otpauthUrl }) => {
        this.setupLoading = false;
        this.setupSecret = secret;
        if (isPlatformBrowser(this.platformId)) {
          QRCode.toDataURL(otpauthUrl, { width: 200, margin: 2 })
            .then(url => this.setupQrDataUrl.set(url));
        }
      },
      error: () => {
        this.setupLoading = false;
        this.setupError = 'Failed to load 2FA setup. Please try again.';
      },
    });
  }

  confirmSetup(twoFactorToken: string): void {
    if (this.setupCode.length !== 6) { this.setupError = 'Enter the 6-digit code.'; return; }
    this.setupLoading = true;
    this.setupError = '';
    this.employeeAuthService.confirmSetup2FA(twoFactorToken, this.setupCode).subscribe({
      next: ({ employee, token }) => {
        this.setupLoading = false;
        this.store.dispatch(EmployeeAuthActions.loginSuccess({ employee, token }));
      },
      error: (err) => {
        this.setupLoading = false;
        this.setupError = err?.error?.message ?? 'Invalid code. Try again.';
      },
    });
  }

  verify(twoFactorToken: string): void {
    this.verifyError = '';
    const payload = this.showBackupInput
      ? { backup_code: this.backupCode }
      : { code: this.verifyCode };

    if (this.showBackupInput && !this.backupCode) { this.verifyError = 'Enter your backup code.'; return; }
    if (!this.showBackupInput && this.verifyCode.length !== 6) { this.verifyError = 'Enter the 6-digit code.'; return; }

    this.verifyLoading = true;
    this.employeeAuthService.verify2FA(twoFactorToken, payload).subscribe({
      next: ({ employee, token }) => {
        this.verifyLoading = false;
        this.store.dispatch(EmployeeAuthActions.loginSuccess({ employee, token }));
      },
      error: (err) => {
        this.verifyLoading = false;
        this.verifyError = err?.error?.message ?? 'Invalid code. Try again.';
      },
    });
  }

  backToCredentials(): void {
    this.store.dispatch(EmployeeAuthActions.resetLogin());
  }
}

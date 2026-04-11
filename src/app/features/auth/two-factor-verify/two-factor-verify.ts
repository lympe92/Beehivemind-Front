import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { AuthActions } from '../../../store/auth/auth.actions';
import {
  selectAuthError,
  selectAuthLoading,
  selectTwoFactorToken,
} from '../../../store/auth/auth.selectors';
import { take } from 'rxjs';

@Component({
  selector: 'app-two-factor-verify',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  templateUrl: './two-factor-verify.html',
  styleUrl: './two-factor-verify.scss',
})
export class TwoFactorVerifyComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  code = '';
  backupCode = '';
  useBackup = false;

  private twoFactorToken: string | null = null;

  ngOnInit(): void {
    this.store.select(selectTwoFactorToken).pipe(take(1)).subscribe((token) => {
      if (!token) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.twoFactorToken = token;
    });
  }

  submit(): void {
    if (!this.twoFactorToken) return;

    if (this.useBackup) {
      if (!this.backupCode.trim()) return;
      this.store.dispatch(AuthActions.verify2FABackup({
        twoFactorToken: this.twoFactorToken,
        backupCode: this.backupCode.trim(),
      }));
    } else {
      if (this.code.length !== 6) return;
      this.store.dispatch(AuthActions.verify2FA({
        twoFactorToken: this.twoFactorToken,
        code: this.code,
      }));
    }
  }

  toggleBackup(): void {
    this.useBackup = !this.useBackup;
    this.code = '';
    this.backupCode = '';
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}

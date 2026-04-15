import { Component, effect, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import QRCode from 'qrcode';
import { ProfileActions } from '../../../store/profile/profile.actions';
import {
  selectProfile,
  selectProfileLoading,
  selectProfileSaving,
  selectTfaBackupCodes,
  selectTfaSetupOtpauth,
  selectTfaSetupSecret,
} from '../../../store/profile/profile.selectors';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { LoaderComponent } from '../../../shared/components/ui/loader/loader';

const UNITS = [
  { value: 'kg',    label: 'Kg / Lt (Metric)' },
  { value: 'libre', label: 'Libre / Gallon (Imperial)' },
];

type TfaStep = 'idle' | 'setup' | 'backup' | 'disable';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, LoaderComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private store = inject(Store);
  private platformId = inject(PLATFORM_ID);
  private toast = inject(ToastService);

  readonly UNITS = UNITS;

  // Store selectors
  readonly profile      = this.store.selectSignal(selectProfile);
  readonly loading      = this.store.selectSignal(selectProfileLoading);
  readonly saving       = this.store.selectSignal(selectProfileSaving);
  readonly tfaSecret    = this.store.selectSignal(selectTfaSetupSecret);
  readonly tfaOtpauth   = this.store.selectSignal(selectTfaSetupOtpauth);
  readonly backupCodes  = this.store.selectSignal(selectTfaBackupCodes);

  // Personal info form — kept in sync with store when profile loads
  infoForm = { name: '', surname: '', country: '', unit: 'kg' };
  private infoFormOriginal = { name: '', surname: '', country: '', unit: 'kg' };

  get infoFormUnchanged(): boolean {
    return (
      this.infoForm.name === this.infoFormOriginal.name &&
      this.infoForm.surname === this.infoFormOriginal.surname &&
      this.infoForm.country === this.infoFormOriginal.country &&
      this.infoForm.unit === this.infoFormOriginal.unit
    );
  }

  // Password form (local UI state)
  passwordForm = { current_password: '', new_password: '', confirm_password: '' };

  // 2FA UI state (local — step, QR url)
  tfaStep = signal<TfaStep>('idle');
  tfaQrDataUrl = signal<string>('');
  tfaCode = '';
  tfaDisablePassword = '';

  constructor() {
    // When profile arrives from store, populate the form
    effect(() => {
      const p = this.profile();
      if (p) {
        this.infoForm = {
          name: p.name ?? '',
          surname: p.surname ?? '',
          country: p.country ?? '',
          unit: p.unit ?? 'kg',
        };
        this.infoFormOriginal = { ...this.infoForm };
      }
    });

    // When 2FA setup secret arrives, generate QR and move to setup step
    effect(() => {
      const otpauth = this.tfaOtpauth();
      if (otpauth && isPlatformBrowser(this.platformId)) {
        this.tfaStep.set('setup');
        this.tfaQrDataUrl.set('');
        QRCode.toDataURL(otpauth, { width: 200, margin: 2 })
          .then(url => this.tfaQrDataUrl.set(url))
          .catch(() => this.toast.error('Failed to generate QR code.'));
      }
    });

    // When backup codes arrive (confirm or regenerate), move to backup step
    effect(() => {
      const codes = this.backupCodes();
      if (codes.length > 0) {
        this.tfaStep.set('backup');
      }
    });

    // When 2FA is disabled (profile updates), go back to idle
    effect(() => {
      const p = this.profile();
      if (p && !p.two_factor_enabled && this.tfaStep() === 'disable') {
        this.tfaStep.set('idle');
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(ProfileActions.loadProfile());
  }

  // ── Personal info ────────────────────────────────────────

  saveInfo(): void {
    if (!this.infoForm.name.trim()) {
      this.toast.error('First name is required.');
      return;
    }
    this.store.dispatch(ProfileActions.updateProfile({
      data: {
        name: this.infoForm.name.trim(),
        surname: this.infoForm.surname.trim(),
        country: (this.infoForm.country.trim() || null) as any,
        unit: this.infoForm.unit,
      },
    }));
  }

  // ── Password ─────────────────────────────────────────────

  savePassword(): void {
    const hasPassword = this.profile()?.has_password ?? true;
    if (hasPassword && !this.passwordForm.current_password) { this.toast.error('Enter your current password.'); return; }
    if (this.passwordForm.new_password.length < 8) { this.toast.error('New password must be at least 8 characters.'); return; }
    if (this.passwordForm.new_password !== this.passwordForm.confirm_password) { this.toast.error('Passwords do not match.'); return; }

    this.store.dispatch(ProfileActions.changePassword({
      current_password: this.passwordForm.current_password || undefined,
      new_password: this.passwordForm.new_password,
      new_password_confirmation: this.passwordForm.confirm_password,
    }));
    this.passwordForm = { current_password: '', new_password: '', confirm_password: '' };
  }

  // ── 2FA ──────────────────────────────────────────────────

  startSetup2FA(): void {
    this.store.dispatch(ProfileActions.setup2FA());
  }

  confirm2FA(): void {
    if (this.tfaCode.length !== 6) { this.toast.error('Enter the 6-digit code.'); return; }
    this.store.dispatch(ProfileActions.confirm2FA({ code: this.tfaCode }));
    this.tfaCode = '';
  }

  finishSetup(): void {
    this.tfaStep.set('idle');
  }

  startDisable2FA(): void {
    this.tfaDisablePassword = '';
    this.tfaStep.set('disable');
  }

  cancelDisable2FA(): void {
    this.tfaStep.set('idle');
  }

  disable2FA(): void {
    if (!this.tfaDisablePassword) { this.toast.error('Enter your password to disable 2FA.'); return; }
    this.store.dispatch(ProfileActions.disable2FA({ password: this.tfaDisablePassword }));
    this.tfaDisablePassword = '';
  }

  regenerateBackupCodes(): void {
    this.store.dispatch(ProfileActions.regenerateBackupCodes());
  }
}

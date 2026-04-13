import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { ProfileService } from '../../../core/services/profile.service';
import {UserProfile} from '../../../core/models/user-profile.model';

type NotificationType = 'error' | 'success';

interface ProfileNotification {
  section: 'info' | 'password' | 'tfa';
  type: NotificationType;
  message: string;
}

const UNITS = [
  { value: 'kg',     label: 'Kg / Lt (Metric)' },
  { value: 'libre',  label: 'Libre / Gallon (Imperial)' },
];

type TfaStep = 'idle' | 'setup' | 'backup' | 'disable';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private platformId = inject(PLATFORM_ID);

  readonly UNITS = UNITS;

  profile = signal<UserProfile | null>(null);

  // Personal info form
  infoForm = { name: '', surname: '', country: '', unit: 'kg' };
  infoLoading = false;

  // Password form
  passwordForm = { current_password: '', new_password: '', confirm_password: '' };
  passwordLoading = false;

  // 2FA state
  tfaEnabled = signal(false);
  tfaStep = signal<TfaStep>('idle');
  tfaSecret = '';
  tfaOtpauthUrl = '';
  tfaQrDataUrl = signal<string>('');
  tfaCode = '';
  tfaBackupCodes = signal<string[]>([]);
  tfaDisablePassword = '';
  tfaLoading = false;

  notification: ProfileNotification | null = null;
  private notifTimers: Partial<Record<string, ReturnType<typeof setTimeout>>> = {};

  ngOnInit(): void {
    this.profileService.getProfile().subscribe(res => {
      if (res.success) {
        this.profile.set(res.data);
        this.tfaEnabled.set(res.data.two_factor_enabled);
        this.infoForm = {
          name: res.data.name ?? '',
          surname: res.data.surname ?? '',
          country: res.data.country ?? '',
          unit: res.data.unit ?? 'kg',
        };
      }
    });
  }

  // ── Personal info ────────────────────────────────────────

  saveInfo(): void {
    if (!this.infoForm.name.trim()) {
      this.notify('info', 'error', 'First name is required.');
      return;
    }

    this.infoLoading = true;
    this.profileService.updateProfile({
      name: this.infoForm.name.trim(),
      surname: this.infoForm.surname.trim(),
      country: this.infoForm.country.trim() || null,
      unit: this.infoForm.unit,
    } as any).subscribe({
      next: res => {
        this.infoLoading = false;
        if (res.success) {
          this.profile.set(res.data);
          this.notify('info', 'success', 'Profile updated successfully.');
        } else {
          this.notify('info', 'error', 'Something went wrong. Please try again.');
        }
      },
      error: () => { this.infoLoading = false; this.notify('info', 'error', 'Something went wrong. Please try again.'); },
    });
  }

  // ── Password ─────────────────────────────────────────────

  savePassword(): void {
    const hasPassword = this.profile()?.has_password ?? true;
    if (hasPassword && !this.passwordForm.current_password) { this.notify('password', 'error', 'Enter your current password.'); return; }
    if (this.passwordForm.new_password.length < 8) { this.notify('password', 'error', 'New password must be at least 8 characters.'); return; }
    if (this.passwordForm.new_password !== this.passwordForm.confirm_password) { this.notify('password', 'error', 'Passwords do not match.'); return; }

    this.passwordLoading = true;
    this.profileService.changePassword({
      current_password: this.passwordForm.current_password || undefined,
      new_password: this.passwordForm.new_password,
      new_password_confirmation: this.passwordForm.confirm_password,
    }).subscribe({
      next: res => {
        this.passwordLoading = false;
        if (res.success) {
          this.passwordForm = { current_password: '', new_password: '', confirm_password: '' };
          const current = this.profile();
          if (current) this.profile.set({ ...current, has_password: true });
          this.notify('password', 'success', hasPassword ? 'Password changed successfully.' : 'Password set successfully.');
        } else {
          this.notify('password', 'error', 'Something went wrong. Please try again.');
        }
      },
      error: (err) => {
        this.passwordLoading = false;
        this.notify('password', 'error', err?.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  // ── 2FA ──────────────────────────────────────────────────

  startSetup2FA(): void {
    this.tfaLoading = true;
    this.profileService.setup2FA().subscribe({
      next: res => {
        this.tfaLoading = false;
        if (res.success) {
          this.tfaSecret = res.data.secret;
          this.tfaOtpauthUrl = res.data.otpauth_url;
          this.tfaCode = '';
          this.tfaQrDataUrl.set('');
          this.tfaStep.set('setup');
          if (isPlatformBrowser(this.platformId)) {
            QRCode.toDataURL(this.tfaOtpauthUrl, { width: 200, margin: 2 })
              .then(url => this.tfaQrDataUrl.set(url))
              .catch(() => this.notify('tfa', 'error', 'Failed to generate QR code.'));
          }
        }
      },
      error: () => { this.tfaLoading = false; this.notify('tfa', 'error', 'Something went wrong. Please try again.'); },
    });
  }

  confirm2FA(): void {
    if (this.tfaCode.length !== 6) { this.notify('tfa', 'error', 'Enter the 6-digit code.'); return; }

    this.tfaLoading = true;
    this.profileService.confirm2FA(this.tfaCode).subscribe({
      next: res => {
        this.tfaLoading = false;
        if (res.success) {
          this.tfaEnabled.set(true);
          this.tfaBackupCodes.set(res.data.backup_codes);
          this.tfaStep.set('backup');
          this.notify('tfa', 'success', '2FA enabled successfully.');
        } else {
          this.notify('tfa', 'error', 'Invalid code. Please try again.');
        }
      },
      error: (err) => {
        this.tfaLoading = false;
        this.notify('tfa', 'error', err?.error?.message ?? 'Invalid code.');
      },
    });
  }

  finishSetup(): void {
    this.tfaStep.set('idle');
    this.tfaBackupCodes.set([]);
  }

  startDisable2FA(): void {
    this.tfaDisablePassword = '';
    this.tfaStep.set('disable');
  }

  cancelDisable2FA(): void {
    this.tfaStep.set('idle');
  }

  disable2FA(): void {
    if (!this.tfaDisablePassword) { this.notify('tfa', 'error', 'Enter your password to disable 2FA.'); return; }

    this.tfaLoading = true;
    this.profileService.disable2FA(this.tfaDisablePassword).subscribe({
      next: res => {
        this.tfaLoading = false;
        if (res.success) {
          this.tfaEnabled.set(false);
          this.tfaStep.set('idle');
          this.notify('tfa', 'success', '2FA disabled.');
        } else {
          this.notify('tfa', 'error', 'Something went wrong.');
        }
      },
      error: (err) => {
        this.tfaLoading = false;
        this.notify('tfa', 'error', err?.error?.message ?? 'Incorrect password.');
      },
    });
  }

  regenerateBackupCodes(): void {
    this.tfaLoading = true;
    this.profileService.regenerateBackupCodes().subscribe({
      next: res => {
        this.tfaLoading = false;
        if (res.success) {
          this.tfaBackupCodes.set(res.data.backup_codes);
          this.tfaStep.set('backup');
        }
      },
      error: () => { this.tfaLoading = false; this.notify('tfa', 'error', 'Something went wrong.'); },
    });
  }

  // ── Helpers ──────────────────────────────────────────────

  clearNotification(): void {
    this.notification = null;
  }

  private notify(section: 'info' | 'password' | 'tfa', type: NotificationType, message: string): void {
    if (this.notifTimers[section]) clearTimeout(this.notifTimers[section]);
    this.notification = { section, type, message };
    if (type === 'success') {
      this.notifTimers[section] = setTimeout(() => (this.notification = null), 5000);
    }
  }
}

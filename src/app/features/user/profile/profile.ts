import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../core/models/user-profile.model';
import { ProfileService } from '../../../core/services/profile.service';

type NotificationType = 'error' | 'success';

interface ProfileNotification {
  section: 'info' | 'password';
  type: NotificationType;
  message: string;
}

const UNITS = [
  { value: 'kg',     label: 'Kg / Lt (Metric)' },
  { value: 'libre',  label: 'Libre / Gallon (Imperial)' },
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);

  readonly UNITS = UNITS;

  profile = signal<UserProfile | null>(null);

  // Personal info form
  infoForm = {
    name: '',
    surname: '',
    country: '',
    unit: 'kg',
  };
  infoLoading = false;

  // Password form
  passwordForm = {
    current_password: '',
    new_password: '',
    confirm_password: '',
  };
  passwordLoading = false;

  notification: ProfileNotification | null = null;
  private notifTimers: Partial<Record<string, ReturnType<typeof setTimeout>>> = {};

  ngOnInit(): void {
    this.profileService.getProfile().subscribe(res => {
      if (res.success) {
        this.profile.set(res.data);
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
      error: () => {
        this.infoLoading = false;
        this.notify('info', 'error', 'Something went wrong. Please try again.');
      },
    });
  }

  // ── Password ─────────────────────────────────────────────

  savePassword(): void {
    if (!this.passwordForm.current_password) {
      this.notify('password', 'error', 'Enter your current password.');
      return;
    }
    if (this.passwordForm.new_password.length < 8) {
      this.notify('password', 'error', 'New password must be at least 8 characters.');
      return;
    }
    if (this.passwordForm.new_password !== this.passwordForm.confirm_password) {
      this.notify('password', 'error', 'Passwords do not match.');
      return;
    }

    this.passwordLoading = true;
    this.profileService.changePassword({
      current_password: this.passwordForm.current_password,
      new_password: this.passwordForm.new_password,
      new_password_confirmation: this.passwordForm.confirm_password,
    }).subscribe({
      next: res => {
        this.passwordLoading = false;
        if (res.success) {
          this.passwordForm = { current_password: '', new_password: '', confirm_password: '' };
          this.notify('password', 'success', 'Password changed successfully.');
        } else {
          this.notify('password', 'error', 'Something went wrong. Please try again.');
        }
      },
      error: (err) => {
        this.passwordLoading = false;
        const msg = err?.error?.message ?? 'Something went wrong. Please try again.';
        this.notify('password', 'error', msg);
      },
    });
  }

  clearNotification(): void {
    this.notification = null;
  }

  private notify(section: 'info' | 'password', type: NotificationType, message: string): void {
    const key = section;
    if (this.notifTimers[key]) clearTimeout(this.notifTimers[key]);
    this.notification = { section, type, message };
    if (type === 'success') {
      this.notifTimers[key] = setTimeout(() => (this.notification = null), 5000);
    }
  }
}

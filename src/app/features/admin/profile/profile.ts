import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { EmployeeAuthService } from '../../../core/services/employee-auth.service';
import { getFailedPasswordRules, PasswordRule } from '../../../shared/components/ui/form/password-rules';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class AdminProfileComponent {
  private employeeAuth = inject(EmployeeAuthService);

  saving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form = { current_password: '', new_password: '', confirm_password: '' };

  get passwordErrors(): PasswordRule[] {
    return getFailedPasswordRules(this.form.new_password);
  }

  savePassword(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (!this.form.current_password) { this.errorMessage.set('Enter your current password.'); return; }
    if (this.passwordErrors.length) { return; }
    if (this.form.new_password !== this.form.confirm_password) { this.errorMessage.set('Passwords do not match.'); return; }

    this.saving.set(true);
    this.employeeAuth.changePassword(this.form.current_password, this.form.new_password).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('Password updated successfully.');
        this.form = { current_password: '', new_password: '', confirm_password: '' };
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
}

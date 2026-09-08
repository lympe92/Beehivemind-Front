import { Component, inject, signal } from '@angular/core';
import { EmployeeAuthService } from '../../../core/services/employee-auth.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { CalloutComponent } from '../../../shared/components/ui/callout/callout';
import { FormComponent } from '../../../shared/components/ui/form/form.component';
import { DynamicField } from '../../../core/models/form.model';
import { crossFieldValidators, syncValidators } from '../../../shared/components/ui/form/validators.config';

interface PasswordFormValue {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CardComponent, CalloutComponent, FormComponent],
  templateUrl: './profile.html',
})
export class AdminProfileComponent {
  private employeeAuth = inject(EmployeeAuthService);

  saving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Mirrors the API's Password::min(8)->mixedCase()->numbers() rule.
  readonly fields: DynamicField[] = [
    { name: 'current_password', type: 'password', label: 'Current password', size: 'full', value: '', syncValidators: [syncValidators.required()] },
    {
      name: 'new_password', type: 'password', label: 'New password', size: 'full', value: '',
      placeholder: 'Min. 8 characters, with a capital and a number',
      syncValidators: [
        syncValidators.required(),
        syncValidators.minLength(8),
        syncValidators.pattern(/[A-Z]/, 'Include a capital letter.'),
        syncValidators.pattern(/[a-z]/, 'Include a lowercase letter.'),
        syncValidators.pattern(/\d/, 'Include a number.'),
      ],
    },
    {
      name: 'confirm_password', type: 'password', label: 'Confirm new password', size: 'full', value: '',
      syncValidators: [syncValidators.required(), crossFieldValidators.equalTo('new_password', 'the new password')],
    },
  ];

  savePassword(value: Record<string, unknown>): void {
    const form = value as unknown as PasswordFormValue;
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.saving.set(true);

    this.employeeAuth.changePassword(form.current_password, form.new_password).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('Password changed.');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
}

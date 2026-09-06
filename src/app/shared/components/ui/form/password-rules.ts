import { AbstractControl, ValidationErrors } from '@angular/forms';

export interface PasswordRule {
  key: string;
  message: string;
  test: (value: string) => boolean;
}

// Mirrors the backend's Password::min(8)->mixedCase()->numbers() rule (see
// RegisterRequest / ResetPasswordRequest / ChangePasswordRequest on the API).
export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'minLength', message: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'uppercase', message: 'At least one uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lowercase', message: 'At least one lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', message: 'At least one number', test: (v) => /\d/.test(v) },
];

export function getFailedPasswordRules(value: string | null | undefined): PasswordRule[] {
  const v = value ?? '';
  return PASSWORD_RULES.filter((rule) => !rule.test(v));
}

export function passwordStrengthValidator() {
  return (control: AbstractControl): ValidationErrors | null => {
    const failed = getFailedPasswordRules(control.value);
    if (!failed.length) return null;
    return failed.reduce<ValidationErrors>((errors, rule) => ({ ...errors, [rule.key]: true }), {});
  };
}

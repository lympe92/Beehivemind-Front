import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { UserProfile } from '../../core/models/user-profile.model';

export const ProfileActions = createActionGroup({
  source: 'Profile',
  events: {
    // Load
    'Load Profile': emptyProps(),
    'Load Profile Success': props<{ profile: UserProfile }>(),
    'Load Profile Failure': props<{ error: string }>(),

    // Update personal info
    'Update Profile': props<{ data: Partial<Pick<UserProfile, 'name' | 'surname' | 'country' | 'unit'>> }>(),
    'Update Profile Success': props<{ profile: UserProfile }>(),
    'Update Profile Failure': props<{ error: string }>(),

    // Change password
    'Change Password': props<{ current_password?: string; new_password: string; new_password_confirmation: string }>(),
    'Change Password Success': emptyProps(),
    'Change Password Failure': props<{ error: string }>(),

    // 2FA setup
    'Setup 2FA': emptyProps(),
    'Setup 2FA Success': props<{ secret: string; otpauthUrl: string }>(),
    'Setup 2FA Failure': props<{ error: string }>(),

    // 2FA confirm
    'Confirm 2FA': props<{ code: string }>(),
    'Confirm 2FA Success': props<{ backupCodes: string[] }>(),
    'Confirm 2FA Failure': props<{ error: string }>(),

    // 2FA disable
    'Disable 2FA': props<{ password: string }>(),
    'Disable 2FA Success': emptyProps(),
    'Disable 2FA Failure': props<{ error: string }>(),

    // Backup codes
    'Regenerate Backup Codes': emptyProps(),
    'Regenerate Backup Codes Success': props<{ backupCodes: string[] }>(),
    'Regenerate Backup Codes Failure': props<{ error: string }>(),
  },
});

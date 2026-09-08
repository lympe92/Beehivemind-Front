# Profile — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md). State-heavy: driven entirely through the `profile` NgRx slice (incl. 2FA).

## Purpose
User account settings: personal info, password change, and two-factor authentication (TOTP) setup/disable with backup codes.

## Route
`/user/profile` → `profile.ts` (`ProfileComponent`), under `authGuard`.

## State & Data
- **Store:** `profile` slice. Selectors: `selectProfile`, `selectProfileLoading`, `selectProfileSaving`, `selectTfaSetupSecret`, `selectTfaSetupOtpauth`, `selectTfaBackupCodes`.
- **All mutations are dispatched as actions** (not direct service calls): `loadProfile`, `updateProfile`, `changePassword`, `setup2FA`, `confirm2FA`, `disable2FA`, `regenerateBackupCodes`. Effects/reducers live in `store/profile/`.

## Patterns / gotchas
- **`effect()`-driven UI sync** (in the constructor):
  - When `profile()` arrives → populate `infoForm` + snapshot `infoFormOriginal` (used by the `infoFormUnchanged` getter to disable Save).
  - When `tfaOtpauth()` arrives (browser only) → generate a QR via the `qrcode` lib into `tfaQrDataUrl`, move to `'setup'` step.
  - When `backupCodes()` arrive → move to `'backup'` step.
  - When 2FA gets disabled → return to `'idle'`.
- **`tfaStep` signal** = `'idle' | 'setup' | 'backup' | 'disable'` — a local state machine for the 2FA wizard, rendered inline under the Security row.
- **SSR-safe:** QR generation guarded with `isPlatformBrowser(PLATFORM_ID)`.
- **Layout is the design system's profile page:** Account card (a centred stack: 72px initials avatar, name, "beekeeper · country"), Details card (`.app-field` grid with a disabled Email, footer "Save changes"), Security card with two rows. **Change password is a dialog** — `openChangePassword()` opens `FormModalComponent` with a `DynamicField[]` config (current password only when `has_password`; new password with `pattern` validators; confirm with `crossFieldValidators.equalTo`) and dispatches `changePassword` with the result. Details use `FormsModule` + `[(ngModel)]`.
- The Security rows keep the kit's terse subtitles ("Not enabled" / "Enabled"); the password row says what the button does because the API has no "last changed" date.
- Not built, because the API has no endpoint for them: the kit's "Change photo" button and "Danger zone" (delete account) card. The kit's read-only "Role" field is replaced by the "Preferred unit" select the app needs (the role already shows under the name).

## Related
[Root](../../../../../CLAUDE.md) · `store/profile/` · auth feature (login/2FA-verify) · qrcode lib.

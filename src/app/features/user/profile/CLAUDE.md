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
- **`tfaStep` signal** = `'idle' | 'setup' | 'backup' | 'disable'` — a local state machine for the 2FA wizard.
- **SSR-safe:** QR generation guarded with `isPlatformBrowser(PLATFORM_ID)`.
- Local forms use `FormsModule` + `[(ngModel)]`; client-side validation before dispatch (`toast.error`).

## Related
[Root](../../../../../CLAUDE.md) · `store/profile/` · auth feature (login/2FA-verify) · qrcode lib.

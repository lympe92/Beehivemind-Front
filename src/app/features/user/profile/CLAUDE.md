# Profile — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md). State-heavy: driven through the `profile` NgRx slice (incl. 2FA) and the `team` slice.

## Purpose
User account settings: personal info, password change, two-factor authentication (TOTP) with backup codes, the team (owner only), the account data export, and account deletion.

## Route
`/user/profile` → `profile.ts` (`ProfileComponent`), under `authGuard`.

## State & Data
- **Store:** `profile` slice. Selectors: `selectProfile`, `selectProfileLoading`, `selectProfileSaving`, `selectTfaSetupSecret`, `selectTfaSetupOtpauth`, `selectTfaBackupCodes`. `profile().team` (`{ role, owner_name, member_count, show_welcome }`) decides the role; `last_exported_at` feeds "Last export".
- **`team` slice** (`selectTeam`, `selectTeamMembers`, `selectTeamInvitations`) — members and open invitations for the owner; for an editor the API sends only whose team it is. `ngOnInit` dispatches `TeamActions.reload()` (not `load()`): the team changes from elsewhere — an invitation accepted in another browser — and this is the page the owner checks.
- **Profile mutations are dispatched as actions**: `loadProfile`, `updateProfile`, `changePassword`, `setup2FA`, `confirm2FA`, `disable2FA`, `regenerateBackupCodes`, `exportCompleted` (patches `last_exported_at`, no reload).
- **Team mutations follow the canonical pattern** — `TeamService` call → `TeamActions.reload()` → toast. The invite dialog is the exception: it calls `TeamService.invite()` itself, because every refusal is a field error shown while the dialog stays open (the request carries `inlineErrors()` so the interceptor does not toast it too).

## Cards, top to bottom
Account + Details (one row) · Security · **Team members** (owner only) · **Your data** · **Danger zone**.

- **Account** — under the name, the team standing in ink above the muted "beekeeper · country": "Team member · Daniel Hart's team" for an editor, "Owner · 2 team members" for an owner with editors, nothing for a team of one.
- **Team members** (`team-members-card/`) — absent for editors (not disabled). One table: owner, editors, invitations; badges Owner / — / Pending / Expired; third column has no header. Owner row has no actions; an expired invitation offers Resend only, and typing its address into Invite renews it (the API answers 200, not "already invited", so the dialog closes on "Invitation sent"). A team of one shows the explanation and one button instead of a table. Invite opens `InviteMemberModalComponent` (`shared/components/ui/modal/invite-member-modal/`); Remove and Cancel go through `modal.confirm({ danger: true })`.
- **Your data** (`data-export-card/`) — sections (all checked; the Terms §4 four first), date range, format → `ExportService.downloadAccount()`. No Photos row: the app stores none.
- **Danger zone** (`delete-account-card/`) — three variants of one card: owner alone, owner with editors (a warning callout naming them), editor. Password field only when `has_password`; then a confirm dialog; `DELETE user/account`. That path is in the error interceptor's `AUTH_PATHS` because a wrong password is a 401, not an expired session. Success dispatches `AuthActions.accountDeleted()` (to `/`).

## Patterns / gotchas
- **`effect()`-driven UI sync** (in the constructor):
  - When `profile()` arrives → populate `infoForm` + snapshot `infoFormOriginal` (used by the `infoFormUnchanged` getter to disable Save).
  - When `tfaOtpauth()` arrives (browser only) → generate a QR via the `qrcode` lib into `tfaQrDataUrl`, move to `'setup'` step.
  - When `backupCodes()` arrive → move to `'backup'` step.
  - When 2FA gets disabled → return to `'idle'`.
- **`tfaStep` signal** = `'idle' | 'setup' | 'backup' | 'disable'` — a local state machine for the 2FA wizard, rendered inline under the Security row.
- **SSR-safe:** QR generation guarded with `isPlatformBrowser(PLATFORM_ID)`.
- **Change password is a dialog** — `openChangePassword()` opens `FormModalComponent` with a `DynamicField[]` config (current password only when `has_password`; new password with `pattern` validators; confirm with `crossFieldValidators.equalTo`) and dispatches `changePassword` with the result. Details use `FormsModule` + `[(ngModel)]`.
- The Security rows keep the kit's terse subtitles ("Not enabled" / "Enabled"); the password row says what the button does because the API has no "last changed" date.
- Not built: the kit's "Change photo" button (no avatar upload). The kit's read-only "Role" field is replaced by the "Preferred unit" select the app needs.

## Related
[Root](../../../../../CLAUDE.md) · `store/profile/` · `store/team/` · `core/services/team.service.ts` · `core/services/export.service.ts` · `features/auth/invite/` · qrcode lib.

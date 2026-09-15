import { Component, computed, effect, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
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
import { CardComponent } from '../../../shared/components/ui/card/card';
import { CalloutComponent } from '../../../shared/components/ui/callout/callout';
import { ModalService } from '../../../core/modal/modal.service';
import { FormModalComponent } from '../../../shared/components/ui/modal/form-modal/form-modal';
import { DynamicField } from '../../../core/models/form.model';
import { crossFieldValidators, syncValidators } from '../../../shared/components/ui/form/validators.config';
import { TeamActions } from '../../../store/team/team.actions';
import { selectTeam, selectTeamInvitations, selectTeamMembers } from '../../../store/team/team.selectors';
import { AuthActions } from '../../../store/auth/auth.actions';
import { TeamService } from '../../../core/services/team.service';
import { ProfileService } from '../../../core/services/profile.service';
import { ExportService } from '../../../core/services/export.service';
import { TeamInvitation, TeamMember, teamName } from '../../../core/models/team.model';
import { InviteMemberModalComponent, InviteMemberResult } from '../../../shared/components/ui/modal/invite-member-modal/invite-member-modal';
import { TeamMembersCardComponent } from './team-members-card/team-members-card';
import { DataExportCardComponent, DataExportRequest } from './data-export-card/data-export-card';
import { DeleteAccountCardComponent } from './delete-account-card/delete-account-card';

const UNITS = [
  { value: 'kg',    label: 'Kg / Lt (Metric)' },
  { value: 'libre', label: 'Libre / Gallon (Imperial)' },
];

type TfaStep = 'idle' | 'setup' | 'backup' | 'disable';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule, LoaderComponent, CardComponent, CalloutComponent,
    TeamMembersCardComponent, DataExportCardComponent, DeleteAccountCardComponent,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private store = inject(Store);
  private platformId = inject(PLATFORM_ID);
  private toast = inject(ToastService);
  private modal = inject(ModalService);
  private teamService = inject(TeamService);
  private profileService = inject(ProfileService);
  private exportService = inject(ExportService);

  readonly UNITS = UNITS;

  // Store selectors
  readonly profile      = this.store.selectSignal(selectProfile);
  readonly initials     = computed(() => {
    const p = this.profile();
    const parts = [p?.name, p?.surname].filter((s): s is string => !!s);
    return parts.map(s => s[0].toUpperCase()).join('') || '·';
  });
  readonly loading      = this.store.selectSignal(selectProfileLoading);
  readonly saving       = this.store.selectSignal(selectProfileSaving);
  readonly tfaSecret    = this.store.selectSignal(selectTfaSetupSecret);
  readonly tfaOtpauth   = this.store.selectSignal(selectTfaSetupOtpauth);
  readonly backupCodes  = this.store.selectSignal(selectTfaBackupCodes);

  // Team — the role gates the members card and the danger-zone copy.
  private readonly team = this.store.selectSignal(selectTeam);
  readonly members      = this.store.selectSignal(selectTeamMembers);
  readonly invitations  = this.store.selectSignal(selectTeamInvitations);
  readonly role         = computed(() => this.profile()?.team?.role ?? 'owner');
  readonly ownerPerson  = computed(() => {
    const p = this.profile();
    return { name: p?.name ?? '', surname: p?.surname ?? '', email: p?.email ?? '' };
  });
  readonly editorTeamName = computed(() => {
    const t = this.profile()?.team;
    return t?.role === 'editor' ? teamName(t.owner_name) : '';
  });
  /** Under the name: an editor's team, or an owner's editors. A team of one says nothing. */
  readonly standing = computed(() => {
    if (this.role() === 'editor') return `Team member · ${this.editorTeamName()}`;
    const count = this.team() ? this.members().length : (this.profile()?.team?.member_count ?? 0);
    return count > 0 ? `Owner · ${count} team member${count === 1 ? '' : 's'}` : null;
  });

  readonly exporting = signal(false);
  readonly deleting  = signal(false);

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
    // reload, not load: the team changes from elsewhere — an invitation accepted
    // in another browser — and this page is where the owner looks for that.
    this.store.dispatch(TeamActions.reload());
  }

  // ── Team (owner) ─────────────────────────────────────────

  async inviteMember(): Promise<void> {
    const result = await this.modal.open<InviteMemberResult>(InviteMemberModalComponent, {
      type: 'center',
      width: '460px',
    });
    if (!result) return;

    this.store.dispatch(TeamActions.reload());
    this.toast.success(
      result.kind === 'sent' ? `Invitation sent to ${result.email}` : `Invitation resent to ${result.email}.`,
    );
  }

  resendInvitation(invitation: TeamInvitation): void {
    this.teamService.resendInvitation(invitation.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(TeamActions.reload());
          this.toast.success(`Invitation resent to ${invitation.email}.`);
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }

  async cancelInvitation(invitation: TeamInvitation): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Cancel invitation?',
      message: `The link sent to ${invitation.email} will stop working.`,
      confirmLabel: 'Cancel invitation',
      danger: true,
    });
    if (!confirmed) return;

    this.teamService.cancelInvitation(invitation.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(TeamActions.reload());
          this.toast.success('Invitation cancelled.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }

  async removeMember(member: TeamMember): Promise<void> {
    const name = `${member.name} ${member.surname}`.trim();
    const confirmed = await this.modal.confirm({
      title: `Remove ${name}?`,
      message: "Their account will be deleted and they won't be able to sign in. Everything they added stays in your team.",
      confirmLabel: 'Remove member',
      danger: true,
    });
    if (!confirmed) return;

    this.teamService.removeMember(member.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(TeamActions.reload());
          this.toast.success(`${name} was removed from your team.`);
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }

  // ── Your data ────────────────────────────────────────────

  exportData(request: DataExportRequest): void {
    this.exporting.set(true);
    this.exportService.downloadAccount(request).subscribe({
      next: () => {
        this.exporting.set(false);
        this.store.dispatch(ProfileActions.exportCompleted({ at: new Date().toISOString() }));
        const count = request.sections.length;
        this.toast.success(
          `${count} section${count === 1 ? '' : 's'} downloaded as ${request.format === 'csv' ? 'CSV' : 'Excel'}.`,
          { title: 'Export ready' },
        );
      },
      error: () => this.exporting.set(false),
    });
  }

  // ── Danger zone ──────────────────────────────────────────

  async deleteAccount(password: string): Promise<void> {
    const editors = this.members().length;
    const message = this.role() === 'editor'
      ? `Your account will be deleted. Everything you added stays in ${this.editorTeamName()}.`
      : editors > 0
        ? `This deletes your account, all your records, and the accounts of your ${editors} team member${editors === 1 ? '' : 's'}. It cannot be undone.`
        : 'This deletes your account and all your records. It cannot be undone.';

    const confirmed = await this.modal.confirm({
      title: 'Delete your account?',
      message,
      confirmLabel: 'Delete account',
      danger: true,
    });
    if (!confirmed) return;

    this.deleting.set(true);
    this.profileService.deleteAccount(password).subscribe({
      next: res => {
        this.deleting.set(false);
        if (res.success) {
          this.toast.success('Your account was deleted.');
          this.store.dispatch(AuthActions.accountDeleted());
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      // This endpoint is one of the interceptor's AUTH_PATHS: a wrong password
      // is a 401 the card explains, not an expired session.
      error: err => {
        this.deleting.set(false);
        this.toast.error(err?.status === 401 ? 'That password is not correct.' : (err?.error?.message ?? 'Something went wrong. Please try again.'));
      },
    });
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
        country: this.infoForm.country.trim() || null,
        unit: this.infoForm.unit,
      },
    }));
  }

  // ── Password ─────────────────────────────────────────────

  /** The password change is a dialog, as on the design system's profile page. */
  async openChangePassword(): Promise<void> {
    const hasPassword = this.profile()?.has_password ?? true;

    // Mirrors the API's Password::min(8)->mixedCase()->numbers() rule.
    const fields: DynamicField[] = [
      ...(hasPassword ? [{
        name: 'current_password', type: 'password', label: 'Current password', size: 'full', value: '',
        syncValidators: [syncValidators.required()],
      } as DynamicField] : []),
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

    const value = await this.modal.open<{ current_password?: string; new_password: string; confirm_password: string }>(
      FormModalComponent,
      {
        type: 'center',
        data: {
          title: hasPassword ? 'Change password' : 'Set a password',
          subtitle: hasPassword ? undefined : 'You can then sign in with email as well as Google.',
          fields,
          submitLabel: hasPassword ? 'Change password' : 'Set password',
          cancelLabel: 'Cancel',
        },
      },
    );
    if (!value) return;

    this.store.dispatch(ProfileActions.changePassword({
      current_password: value.current_password || undefined,
      new_password: value.new_password,
      new_password_confirmation: value.confirm_password,
    }));
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

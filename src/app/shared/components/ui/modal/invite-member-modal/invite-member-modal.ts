import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { ModalShellComponent } from '../modal-shell/modal-shell';
import { TeamService } from '../../../../../core/services/team.service';
import { InviteRefusalCode } from '../../../../../core/models/team.model';

/** How the dialog ended: an invitation sent, or an existing one sent again. */
export interface InviteMemberResult {
  kind: 'sent' | 'resent';
  email: string;
}

/**
 * Invite member. One field, because an invitation carries one decision: the
 * address. No role picker — everyone who joins by invitation is an editor —
 * and no message field; the email says what it needs to.
 *
 * It sends the invitation itself rather than returning the address, because
 * every refusal is about the address and belongs under the field while the
 * dialog stays open. Three of the four are not the owner's mistake but a fact
 * they could not have known, which is why "already invited" offers to resend
 * instead of only refusing.
 */
@Component({
  selector: 'app-invite-member-modal',
  standalone: true,
  imports: [ModalShellComponent, FormsModule],
  templateUrl: './invite-member-modal.html',
})
export class InviteMemberModalComponent {
  private dialogRef = inject<DialogRef<InviteMemberResult>>(DialogRef);
  private teams     = inject(TeamService);

  email = '';
  readonly sending = signal(false);
  readonly error   = signal('');
  readonly code    = signal<InviteRefusalCode | null>(null);
  private pendingInvitationId: number | null = null;

  private readonly address = signal('');
  readonly valid = computed(() => /\S+@\S+\.\S+/.test(this.address()));

  onEmailChange(value: string): void {
    this.email = value;
    this.address.set(value.trim());
    this.error.set('');
    this.code.set(null);
  }

  send(): void {
    if (!this.valid() || this.sending()) return;
    this.sending.set(true);

    this.teams.invite(this.address()).subscribe({
      next: res => {
        this.sending.set(false);
        if (res.success) this.dialogRef.close({ kind: 'sent', email: res.data.email });
      },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        const body = err.error as { message?: string; meta?: { code?: InviteRefusalCode; invitation_id?: number } } | null;
        this.code.set(body?.meta?.code ?? null);
        this.pendingInvitationId = body?.meta?.invitation_id ?? null;
        this.error.set(body?.meta?.code ? body.message ?? '' : 'Something went wrong. Please try again.');
      },
    });
  }

  resend(): void {
    if (this.pendingInvitationId === null || this.sending()) return;
    this.sending.set(true);

    this.teams.resendInvitation(this.pendingInvitationId).subscribe({
      next: res => {
        this.sending.set(false);
        if (res.success) this.dialogRef.close({ kind: 'resent', email: res.data.email });
      },
      error: () => this.sending.set(false),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

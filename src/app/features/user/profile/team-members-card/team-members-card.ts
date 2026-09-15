import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { ColumnDef, DataTableComponent } from '../../../../shared/components/ui/data-table/data-table';
import { TeamInvitation, TeamMember, TeamPerson } from '../../../../core/models/team.model';

type Row =
  | { id: string; kind: 'owner'; person: Pick<TeamPerson, 'name' | 'surname' | 'email'> }
  | { id: string; kind: 'editor'; member: TeamMember }
  | { id: string; kind: 'invite'; invitation: TeamInvitation };

const DAY = 24 * 60 * 60 * 1000;

/**
 * The owner's only view of their team, on Profile below Security. Editors
 * never get this card: they cannot invite, cancel or remove, so there is no
 * disabled version of it — it is absent.
 *
 * One table, not two: the owner's question is "who is in my team", and a
 * person who has not accepted yet is an answer to it. Row order is owner,
 * editors, invitations — the team as it is, then as it is becoming. The badge
 * carries the difference: Owner (grey), nothing for an editor, Pending
 * (warning tint), Expired (danger tint). The third column has no header —
 * each cell names its own verb (joined / invited / expired).
 *
 * The owner's row has no actions (one owner, no transfer), and an expired
 * invitation cannot be cancelled — there is nothing left to stop working.
 *
 * A team of one gets no table at all: the explanation and the one button.
 */
@Component({
  selector: 'app-team-members-card',
  standalone: true,
  imports: [CardComponent, DataTableComponent, DatePipe],
  templateUrl: './team-members-card.html',
})
export class TeamMembersCardComponent {
  readonly owner       = input.required<Pick<TeamPerson, 'name' | 'surname' | 'email'>>();
  readonly members     = input<TeamMember[]>([]);
  readonly invitations = input<TeamInvitation[]>([]);
  readonly loading     = input(false);

  readonly invite = output<void>();
  readonly remove = output<TeamMember>();
  readonly resend = output<TeamInvitation>();
  readonly cancel = output<TeamInvitation>();

  readonly columns: ColumnDef[] = [
    { key: 'member', label: 'Member', width: '42%' },
    { key: 'status', label: 'Status', width: '18%' },
    { key: 'since',  label: '' },
  ];

  readonly empty = computed(() => this.members().length === 0 && this.invitations().length === 0);

  readonly rows = computed<Row[]>(() => [
    { id: 'owner', kind: 'owner', person: this.owner() },
    ...this.members().map(member => ({ id: `member-${member.id}`, kind: 'editor' as const, member })),
    ...this.invitations().map(invitation => ({ id: `invite-${invitation.id}`, kind: 'invite' as const, invitation })),
  ]);

  /** "expires in 5 days" — counted in whole days, so a link sent today reads 7. */
  expiresIn(invitation: TeamInvitation): string {
    const days = Math.max(1, Math.ceil((new Date(invitation.expiresAt).getTime() - Date.now()) / DAY));
    return `${days} day${days === 1 ? '' : 's'}`;
  }
}

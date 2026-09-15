import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { CalloutComponent } from '../../../../shared/components/ui/callout/callout';
import { TeamMember, TeamRole } from '../../../../core/models/team.model';

/**
 * Danger zone — the Profile page's last card, and its only destructive region.
 *
 * Three variants of one card, differing in what the deletion takes with it:
 * an owner alone deletes the account and every record; an owner with editors
 * does the same and the warning *names* the accounts that go too ("2 team
 * members" is a number, and a number is easy to agree to); an editor deletes
 * only their own account, and what they added stays.
 *
 * The password is the confirmation, on one line with the button so it reads as
 * belonging to it. A Google-only account has no password and gets no field —
 * the confirm dialog that follows does that work.
 */
@Component({
  selector: 'app-delete-account-card',
  standalone: true,
  imports: [CardComponent, CalloutComponent, FormsModule],
  templateUrl: './delete-account-card.html',
})
export class DeleteAccountCardComponent {
  readonly role        = input<TeamRole>('owner');
  readonly members     = input<TeamMember[]>([]);
  /** "Daniel Hart's team" — for the editor's copy. */
  readonly teamName    = input('');
  readonly hasPassword = input(true);
  readonly busy        = input(false);

  /** The typed password, or an empty string for a Google-only account. */
  readonly deleteAccount = output<string>();

  password = '';

  readonly withEditors = computed(() => this.role() === 'owner' && this.members().length > 0);
  readonly memberNames = computed(() => this.members().map(m => `${m.name} ${m.surname}`.trim()).join(', '));

  submit(): void {
    this.deleteAccount.emit(this.hasPassword() ? this.password : '');
  }
}

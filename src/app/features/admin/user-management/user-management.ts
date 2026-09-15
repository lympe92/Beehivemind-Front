import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RequestService } from '../../../core/services/request.service';
import { Store } from '@ngrx/store';
import { selectIsAtLeastModerator, selectIsAtLeastAdmin } from '../../../store/employee-auth/employee-auth.selectors';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { AppErrorComponent } from '../../../shared/components/ui/app-error/app-error';
import { ModalService } from '../../../core/modal/modal.service';
import {
  SuspendUserModalComponent,
  SuspendUserResult,
} from '../../../shared/components/ui/modal/suspend-user-modal/suspend-user-modal';

interface AdminUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  status: 'active' | 'suspended' | 'banned';
  /** For an editor, the team owner's plan — an editor has none of their own. */
  plan: 'free' | 'pro' | 'enterprise';
  team: AdminUserTeam | null;
  email_verified: boolean;
  created_at: string;
}

interface AdminUserTeam {
  role: 'owner' | 'editor';
  owner_id: number;
  owner_name: string;
  /** Editors in the team, the owner not counted. */
  member_count: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [FormsModule, SlicePipe, DecimalPipe, DataTableComponent, CardComponent, AppErrorComponent],
  templateUrl: './user-management.html',
})
export class UserManagementComponent implements OnInit {
  private request = inject(RequestService);
  private store = inject(Store);
  private modal = inject(ModalService);

  isAtLeastModerator = toSignal(this.store.select(selectIsAtLeastModerator), { initialValue: false });
  isAtLeastAdmin = toSignal(this.store.select(selectIsAtLeastAdmin), { initialValue: false });

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  page = signal(1);

  search = '';
  statusFilter = '';
  planFilter = '';

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'plan', label: 'Plan' },
    { key: 'status', label: 'Status' },
    { key: 'email_verified', label: 'Verified' },
    { key: 'created_at', label: 'Joined' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    const params = new URLSearchParams({ page: String(this.page()) });
    if (this.search) params.set('search', this.search);
    if (this.statusFilter) params.set('status', this.statusFilter);
    if (this.planFilter) params.set('plan', this.planFilter);

    this.request.getRequest<AdminUser[]>(`admin/users?${params}`).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.total.set(res.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The user list did not load.');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadUsers();
  }

  updateStatus(userId: number, status: string, suspendedUntil: string | null = null): void {
    const payload: Record<string, unknown> = { status };
    if (status === 'suspended') payload['suspended_until'] = suspendedUntil;

    this.request.patchRequest(`admin/users/${userId}/status`, payload).subscribe({
      next: () => this.loadUsers(),
    });
  }

  async openSuspend(user: AdminUser): Promise<void> {
    const result = await this.modal.open<SuspendUserResult>(SuspendUserModalComponent, {
      type: 'center',
      width: '440px',
      data: { name: `${user.name} ${user.surname}` },
    });
    if (!result) return;
    this.updateStatus(user.id, 'suspended', result.until);
  }

  async banUser(user: AdminUser): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Ban this account?',
      message: `${user.name} ${user.surname} is signed out and cannot sign in again until an admin activates the account.`,
      confirmLabel: 'Ban',
      danger: true,
    });
    if (!confirmed) return;
    this.updateStatus(user.id, 'banned');
  }

  forceConfirm(userId: number): void {
    this.request.postRequest(`admin/users/${userId}/force-confirm`, {}).subscribe({
      next: () => this.loadUsers(),
    });
  }

  /** Under the name: whose team an editor is in, or how many editors an owner has. A team of one says nothing. */
  teamLine(user: AdminUser): string | null {
    const team = user.team;
    if (!team) return null;
    if (team.role === 'editor') return `Editor · ${team.owner_name}'s team`;
    return team.member_count > 0
      ? `Owner · ${team.member_count} team member${team.member_count === 1 ? '' : 's'}`
      : null;
  }

  /**
   * A native confirm cannot carry the sentence that matters: what else is
   * deleted. The API deletes as the account holder would — an owner takes the
   * team with them, an editor goes alone and their records stay.
   */
  async deleteUser(user: AdminUser): Promise<void> {
    const who = `${user.name} ${user.surname} (${user.email})`;
    const members = user.team?.member_count ?? 0;
    const message = user.team?.role === 'editor'
      ? `Permanently delete ${who}. They are an editor in ${user.team.owner_name}'s team: the records they added stay with that team. This cannot be undone.`
      : members > 0
        ? `Permanently delete ${who}. They own a team, so its apiaries, beehives and records go too, and so do the accounts of its ${members} team member${members === 1 ? '' : 's'}. This cannot be undone.`
        : `Permanently delete ${who}. Their apiaries, beehives and every record they hold go with it. This cannot be undone.`;

    const confirmed = await this.modal.confirm({
      title: 'Delete this account?',
      message,
      confirmLabel: 'Delete account',
      danger: true,
    });
    if (!confirmed) return;
    this.request.deleteRequest(`admin/users/${user.id}`).subscribe({
      next: () => this.loadUsers(),
    });
  }
}

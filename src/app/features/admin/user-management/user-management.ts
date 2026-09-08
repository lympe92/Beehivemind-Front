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
  plan: 'free' | 'pro' | 'enterprise';
  email_verified: boolean;
  created_at: string;
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

  /** A native confirm cannot carry the sentence that matters: what else is deleted. */
  async deleteUser(user: AdminUser): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete this account?',
      message: `Permanently delete ${user.name} ${user.surname} (${user.email}). Their apiaries, beehives and every record they hold go with it. This cannot be undone.`,
      confirmLabel: 'Delete account',
      danger: true,
    });
    if (!confirmed) return;
    this.request.deleteRequest(`admin/users/${user.id}`).subscribe({
      next: () => this.loadUsers(),
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RequestService } from '../../../core/services/request.service';
import { Store } from '@ngrx/store';
import { selectIsAtLeastModerator } from '../../../store/employee-auth/employee-auth.selectors';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';

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

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; per_page: number; total_pages: number };
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [FormsModule, SlicePipe, DataTableComponent],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagementComponent implements OnInit {
  private request = inject(RequestService);
  private store = inject(Store);

  isAtLeastModerator = toSignal(this.store.select(selectIsAtLeastModerator), { initialValue: false });

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
    const params = new URLSearchParams({ page: String(this.page()) });
    if (this.search) params.set('search', this.search);
    if (this.statusFilter) params.set('status', this.statusFilter);
    if (this.planFilter) params.set('plan', this.planFilter);

    this.request.getRequest<PaginatedResponse<AdminUser>>(`admin/users?${params}`).subscribe({
      next: (res) => {
        this.users.set(res.data.data);
        this.total.set(res.data.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadUsers();
  }

  updateStatus(userId: number, status: string): void {
    this.request.postRequest(`admin/users/${userId}/status`, { status }).subscribe({
      next: () => this.loadUsers(),
    });
  }

  forceConfirm(userId: number): void {
    this.request.postRequest(`admin/users/${userId}/force-confirm`, {}).subscribe({
      next: () => this.loadUsers(),
    });
  }
}

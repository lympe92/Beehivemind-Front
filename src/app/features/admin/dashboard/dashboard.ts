import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RequestService } from '../../../core/services/request.service';
import { AppErrorComponent } from '../../../shared/components/ui/app-error/app-error';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
    new_this_month: number;
    by_plan: { free: number; pro: number; enterprise: number };
  };
  employees: number;
  apiaries: number;
  beehives: number;
  records: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DecimalPipe, AppErrorComponent],
  templateUrl: './dashboard.html',
})
export class AdminDashboardComponent implements OnInit {
  private request = inject(RequestService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.request.getRequest<DashboardStats>('admin/stats').subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The stats did not load.');
        this.loading.set(false);
      },
    });
  }
}

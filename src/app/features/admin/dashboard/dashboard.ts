import { Component, inject, OnInit, signal } from '@angular/core';
import { RequestService } from '../../../core/services/request.service';

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
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {
  private request = inject(RequestService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.request.getRequest<DashboardStats>('admin/stats').subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load stats');
        this.loading.set(false);
      },
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RequestService } from '../../../core/services/request.service';
import { AppErrorComponent } from '../../../shared/components/ui/app-error/app-error';
import { ModalService } from '../../../core/modal/modal.service';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';

/** The "Free for everyone" switch (GET/PUT admin/billing). */
interface BillingSwitch {
  free_for_all: boolean;
  /** Stripe's keys and prices are set on the server; ending free for all needs them. */
  checkout_open: boolean;
}

interface DashboardStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
    new_this_month: number;
    by_plan: { free: number; pro: number; pro_unlimited: number; enterprise: number };
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
  private modal = inject(ModalService);
  private toast = inject(ToastService);

  stats = signal<DashboardStats | null>(null);
  billing = signal<BillingSwitch | null>(null);
  switching = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
    this.request.getRequest<BillingSwitch>('admin/billing').subscribe({
      next: res => this.billing.set(res.data),
      error: () => this.billing.set(null),
    });
  }

  /**
   * Ending free for all applies the plans to every team at once: hives past a
   * team's plan become read-only and owners are asked to pay. Asked first.
   */
  async setFreeForAll(free: boolean): Promise<void> {
    const confirmed = await this.modal.confirm(free
      ? {
          title: 'Make everything free again?',
          message: 'Every team gets every feature with no hive limit, and nobody can buy a plan. Running subscriptions keep being charged until their owners cancel.',
          confirmLabel: 'Make everything free',
        }
      : {
          title: 'Start charging?',
          message: `The plans apply to every team at once: Free holds one hive, Pro €5 up to 50, Pro Unlimited €10 above. Hives past a team's plan become read-only until the owner pays or removes hives. Terms §11 asks that users are emailed before a change like this.`,
          confirmLabel: 'Start charging',
          danger: true,
        });
    if (!confirmed) return;

    this.switching.set(true);
    this.request.putRequest<BillingSwitch>('admin/billing', { free_for_all: free }).subscribe({
      next: res => {
        this.billing.set(res.data);
        this.switching.set(false);
        this.toast.success(free ? 'Everything is free for everyone.' : 'Plans are on: teams now pay for more than one hive.');
      },
      error: () => this.switching.set(false),
    });
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

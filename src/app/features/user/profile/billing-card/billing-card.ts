import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { CalloutComponent } from '../../../../shared/components/ui/callout/callout';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../../core/modal/modal.service';
import { BillingService, BillingSummary, PLAN_NAMES, PaidPlan } from '../../../../core/services/billing.service';

interface PlanOption {
  plan: PaidPlan;
  name: string;
  holds: string;
}

const PAID_PLANS: PlanOption[] = [
  { plan: 'pro',           name: PLAN_NAMES.pro,           holds: 'Up to 50 hives' },
  { plan: 'pro_unlimited', name: PLAN_NAMES.pro_unlimited, holds: 'More than 50 hives' },
];

/**
 * The team's plan, on Profile above "Your data".
 *
 * While everything is free for everyone it says so and offers nothing to buy.
 * Once plans start, it says what the plan holds against the hives the team
 * has, warns when hives are read-only, and gives the owner the two paid plans:
 * a new subscription goes to Stripe's Checkout page and comes back here with
 * `?billing=success`; a running one switches in place. Editors see the plan
 * and who manages it, nothing to press.
 *
 * Unlike the other cards it loads its own state: nothing else on the page
 * reads the plan, and it has to re-read it after the return from Stripe.
 */
@Component({
  selector: 'app-billing-card',
  standalone: true,
  imports: [CardComponent, CalloutComponent, DatePipe],
  templateUrl: './billing-card.html',
})
export class BillingCardComponent implements OnInit {
  private billing = inject(BillingService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  readonly summary = signal<BillingSummary | null>(null);
  readonly busy = signal(false);

  readonly options = PAID_PLANS;
  readonly planName = computed(() => {
    const s = this.summary();
    return s ? PLAN_NAMES[s.plan] : '';
  });

  /** "1 hive", "50 hives", or no limit. */
  readonly holds = computed(() => {
    const limit = this.summary()?.hiveLimit;
    if (limit === null || limit === undefined) return 'No hive limit';
    return limit === 1 ? '1 hive' : `Up to ${limit} hives`;
  });

  readonly subscribed = computed(() => this.summary()?.subscription != null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const returned = this.route.snapshot.queryParamMap.get('billing');
    if (returned === 'success') {
      // Stripe's webhook may land a moment after the browser does.
      this.toast.success('Thank you. Your plan is being set up and will show here in a moment.');
      setTimeout(() => this.load(), 4000);
    } else if (returned === 'cancelled') {
      this.toast.info('Checkout was cancelled. Nothing was charged.');
    }
    if (returned) {
      this.router.navigate([], { queryParams: { billing: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }

    this.load();
  }

  price(plan: PaidPlan): number {
    return this.summary()?.monthlyPrices[plan] ?? 0;
  }

  isCurrent(plan: PaidPlan): boolean {
    return this.subscribed() && this.summary()?.plan === plan;
  }

  async choose(option: PlanOption): Promise<void> {
    const s = this.summary();
    if (!s || this.busy()) return;

    if (this.subscribed()) {
      const confirmed = await this.modal.confirm({
        title: `Switch to ${option.name}?`,
        message: `${option.holds}, €${this.price(option.plan)} a month. The difference for the rest of this month is charged or credited now.`,
        confirmLabel: `Switch to ${option.name}`,
      });
      if (!confirmed) return;
    }

    this.busy.set(true);
    this.billing.checkout(option.plan).subscribe({
      next: result => {
        if (result.url) {
          window.location.href = result.url;
          return;
        }
        this.busy.set(false);
        if (result.billing) this.summary.set(result.billing);
        this.toast.success(`You are on ${option.name}.`);
      },
      error: () => this.busy.set(false),
    });
  }

  async cancel(): Promise<void> {
    const ends = this.summary()?.subscription?.periodEndsAt;
    const confirmed = await this.modal.confirm({
      title: 'Cancel your plan?',
      message: ends
        ? `It stays until ${new Date(ends).toLocaleDateString()}, then your team moves to Free. Nothing is deleted.`
        : 'At the end of the paid month your team moves to Free. Nothing is deleted.',
      confirmLabel: 'Cancel plan',
      danger: true,
    });
    if (!confirmed) return;

    this.busy.set(true);
    this.billing.cancel().subscribe({
      next: summary => {
        this.summary.set(summary);
        this.busy.set(false);
        this.toast.success('Your plan will not renew.');
      },
      error: () => this.busy.set(false),
    });
  }

  resume(): void {
    this.busy.set(true);
    this.billing.resume().subscribe({
      next: summary => {
        this.summary.set(summary);
        this.busy.set(false);
        this.toast.success('Your plan will renew as before.');
      },
      error: () => this.busy.set(false),
    });
  }

  openPortal(): void {
    this.busy.set(true);
    this.billing.portal().subscribe({
      next: url => (window.location.href = url),
      error: () => this.busy.set(false),
    });
  }

  private load(): void {
    this.billing.summary().subscribe(summary => this.summary.set(summary));
  }
}

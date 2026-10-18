import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RequestService } from './request.service';

/** The plans sold: €5 up to 50 hives, €10 above. Free is no purchase. */
export type PaidPlan = 'pro' | 'pro_unlimited';
export type Plan = 'free' | PaidPlan | 'enterprise';

/** What the pricing page needs: whether everything is free right now, and the plans. */
export interface PublicPlans {
  freeForAll: boolean;
  hiveLimits: Record<Plan, number | null>;
  monthlyPrices: Record<PaidPlan, number>;
  /** Free days a first subscription starts with; 0 is no trial. */
  trialDays: number;
}

/** The team's plan as Profile shows it. */
export interface BillingSummary {
  plan: Plan;
  /** Null is no limit. */
  hiveLimit: number | null;
  hiveCount: number;
  readOnlyHives: number;
  freeForAll: boolean;
  /** Only the owner buys, switches or cancels. */
  canManage: boolean;
  checkoutOpen: boolean;
  monthlyPrices: Record<PaidPlan, number>;
  /** Free days a Checkout would start with: only before the owner's first subscription. */
  trialDays: number;
  subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
    periodEndsAt: string | null;
  } | null;
}

interface PublicPlansPayload {
  free_for_all: boolean;
  hive_limits: Record<Plan, number | null>;
  monthly_prices: Record<PaidPlan, number>;
  trial_days?: number;
}

interface BillingSummaryPayload {
  plan: Plan;
  hive_limit: number | null;
  hive_count: number;
  read_only_hives: number;
  free_for_all: boolean;
  can_manage: boolean;
  checkout_open: boolean;
  monthly_prices: Record<PaidPlan, number>;
  trial_days?: number;
  subscription: { status: string; cancel_at_period_end: boolean; period_ends_at: string | null } | null;
}

/** A new subscription answers Stripe's page; a switch answers the new summary. */
export interface CheckoutResult {
  url: string | null;
  billing: BillingSummary | null;
}

/** The plan names the site uses, in one place. */
export const PLAN_NAMES: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  pro_unlimited: 'Pro Unlimited',
  enterprise: 'Enterprise',
};

@Injectable({ providedIn: 'root' })
export class BillingService {
  private request = inject(RequestService);

  plans(): Observable<PublicPlans> {
    return this.request.getRequest<PublicPlansPayload>('billing/plans').pipe(
      map(res => ({
        freeForAll: res.data.free_for_all,
        hiveLimits: res.data.hive_limits,
        monthlyPrices: res.data.monthly_prices,
        trialDays: res.data.trial_days ?? 0,
      })),
    );
  }

  summary(): Observable<BillingSummary> {
    return this.request.getRequest<BillingSummaryPayload>('billing').pipe(map(res => fromApi(res.data)));
  }

  checkout(plan: PaidPlan): Observable<CheckoutResult> {
    return this.request
      .postRequest<{ url: string | null; billing?: BillingSummaryPayload }>('billing/checkout', { plan })
      .pipe(map(res => ({ url: res.data.url, billing: res.data.billing ? fromApi(res.data.billing) : null })));
  }

  portal(): Observable<string> {
    return this.request.postRequest<{ url: string }>('billing/portal').pipe(map(res => res.data.url));
  }

  cancel(): Observable<BillingSummary> {
    return this.request.postRequest<BillingSummaryPayload>('billing/cancel').pipe(map(res => fromApi(res.data)));
  }

  resume(): Observable<BillingSummary> {
    return this.request.postRequest<BillingSummaryPayload>('billing/resume').pipe(map(res => fromApi(res.data)));
  }
}

function fromApi(p: BillingSummaryPayload): BillingSummary {
  return {
    plan: p.plan,
    hiveLimit: p.hive_limit,
    hiveCount: p.hive_count,
    readOnlyHives: p.read_only_hives,
    freeForAll: p.free_for_all,
    canManage: p.can_manage,
    checkoutOpen: p.checkout_open,
    monthlyPrices: p.monthly_prices,
    trialDays: p.trial_days ?? 0,
    subscription: p.subscription
      ? {
          status: p.subscription.status,
          cancelAtPeriodEnd: p.subscription.cancel_at_period_end,
          periodEndsAt: p.subscription.period_ends_at,
        }
      : null,
  };
}

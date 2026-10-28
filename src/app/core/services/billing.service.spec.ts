import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';
import { BillingService, BillingSummary, CancelResult } from './billing.service';

const SUMMARY = {
  plan: 'pro',
  hive_limit: 50,
  hive_count: 3,
  read_only_hives: 0,
  free_for_all: false,
  can_manage: true,
  checkout_open: true,
  monthly_prices: { pro: 5, pro_unlimited: 10 },
  trial_days: 0,
  subscription: { status: 'active', cancel_at_period_end: false, period_ends_at: '2026-11-25T10:00:00+00:00' },
};

describe('BillingService', () => {
  let service: BillingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BillingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads until when cancelling refunds, and null once it no longer does', () => {
    let result: BillingSummary | undefined;
    service.summary().subscribe(s => (result = s));
    http.expectOne(environment.apiUrl + 'billing').flush({
      success: true,
      data: { ...SUMMARY, refundable_until: '2026-11-08T10:00:00+00:00' },
    });
    expect(result?.refundableUntil).toBe('2026-11-08T10:00:00+00:00');
    expect(result?.subscription?.periodEndsAt).toBe('2026-11-25T10:00:00+00:00');

    service.summary().subscribe(s => (result = s));
    http.expectOne(environment.apiUrl + 'billing').flush({ success: true, data: SUMMARY });
    expect(result?.refundableUntil).toBeNull();
  });

  it('answers a refunded cancellation with the amount and the plan gone', () => {
    let result: CancelResult | undefined;
    service.cancel().subscribe(r => (result = r));

    const req = http.expectOne(environment.apiUrl + 'billing/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      data: { ...SUMMARY, plan: 'free', hive_limit: 1, read_only_hives: 2, subscription: null, refundable_until: null, refunded: 5 },
    });

    expect(result?.refunded).toBe(5);
    expect(result?.summary.plan).toBe('free');
    expect(result?.summary.subscription).toBeNull();
    expect(result?.summary.readOnlyHives).toBe(2);
  });

  it('answers a cancellation at the period end with no refund', () => {
    let result: CancelResult | undefined;
    service.cancel().subscribe(r => (result = r));

    http.expectOne(environment.apiUrl + 'billing/cancel').flush({
      success: true,
      data: { ...SUMMARY, subscription: { ...SUMMARY.subscription, cancel_at_period_end: true } },
    });

    expect(result?.refunded).toBeNull();
    expect(result?.summary.subscription?.cancelAtPeriodEnd).toBe(true);
  });
});

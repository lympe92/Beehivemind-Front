import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';
import { OnboardingService, progressFromApi, standingFromApi, summaryFromApi } from './onboarding.service';

const SUMMARY = {
  apiaries: 2, beehives: 3, inspections: 2, feedings: 1, harvests: 3,
  treatment_types: 1, treatment_sessions: 1, treatment_doses_done: 1,
  costs: 1, cost_categories: 2, team_members: 1, pending_invitations: 1,
  onboarding: 'active', onboarding_progress: { seen: ['diagnosis'], panel: 'folded' },
};

describe('OnboardingService', () => {
  let service: OnboardingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(OnboardingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps the summary to the app shape', () => {
    let result: unknown;
    service.getSummary().subscribe(res => (result = res.data));
    http.expectOne(environment.apiUrl + 'user/onboarding/summary').flush({ success: true, data: SUMMARY });

    expect(result).toEqual({
      apiaries: 2, beehives: 3, inspections: 2, feedings: 1, harvests: 3,
      treatmentTypes: 1, treatmentSessions: 1, treatmentDosesDone: 1,
      costs: 1, costCategories: 2, teamMembers: 1, pendingInvitations: 1,
      onboarding: 'active', progress: { seen: ['diagnosis'], panel: 'folded' },
    });
  });

  it('posts a state and reads back what the API stored', () => {
    let result: unknown;
    service.setState('dismissed').subscribe(res => (result = res.data));
    const req = http.expectOne(environment.apiUrl + 'user/onboarding');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ state: 'dismissed' });
    req.flush({ success: true, data: { id: 1, onboarding: 'dismissed', onboarding_progress: { seen: [], panel: 'open' } } });
    expect(result).toEqual({ onboarding: 'dismissed', progress: { seen: [], panel: 'open' } });
  });

  it('posts only the parts of the progress it is given', () => {
    service.updateProgress({ seen: ['export'] }).subscribe();
    expect(http.expectOne(environment.apiUrl + 'user/onboarding/progress').request.body).toEqual({ seen: ['export'] });
    service.updateProgress({ panel: 'folded' }).subscribe();
    expect(http.expectOne(environment.apiUrl + 'user/onboarding/progress').request.body).toEqual({ panel: 'folded' });
  });
});

describe('the onboarding mappers', () => {
  it('reads anything that is not a summary as no summary', () => {
    expect(summaryFromApi(null)).toBeNull();
    expect(summaryFromApi([] as never)).toBeNull();
    expect(summaryFromApi({ onboarding: 'active' } as never)).toBeNull();
  });

  it('turns odd counts into whole, non-negative numbers', () => {
    const s = summaryFromApi({ ...SUMMARY, apiaries: '4' as never, beehives: -1, costs: null as never } as never)!;
    expect(s.apiaries).toBe(4);
    expect(s.beehives).toBe(0);
    expect(s.costs).toBe(0);
  });

  it('reads a missing or malformed progress as nothing seen, open', () => {
    expect(progressFromApi(null)).toEqual({ seen: [], panel: 'open' });
    expect(progressFromApi({ seen: 'x' as never, panel: 'sideways' as never })).toEqual({ seen: [], panel: 'open' });
  });

  it('reads an unknown state as none', () => {
    expect(standingFromApi({ onboarding: 'weird' as never, onboarding_progress: null }).onboarding).toBeNull();
    expect(standingFromApi(undefined)).toEqual({ onboarding: null, progress: { seen: [], panel: 'open' } });
  });
});

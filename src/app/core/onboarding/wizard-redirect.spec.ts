import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { initialAuthState, User } from '../../store/auth/auth.state';
import { OnboardingActions } from '../../store/onboarding/onboarding.actions';
import {
  markWizardOffered,
  shouldOfferWizard,
  WizardFacts,
  wizardOfferedThisSession,
  wizardRedirectGuard,
} from './wizard-redirect';

const facts: WizardFacts = { isEditor: false, onboarding: 'active', seen: [], apiaries: 0, offeredThisSession: false };

describe('shouldOfferWizard', () => {
  it('offers the apiary step to an owner with no apiary, the guide active and the wizard never finished', () => {
    expect(shouldOfferWizard(facts)).toBe(true);
  });

  it('never offers it to an editor, or to a team with an apiary', () => {
    expect(shouldOfferWizard({ ...facts, isEditor: true })).toBe(false);
    expect(shouldOfferWizard({ ...facts, apiaries: 1 })).toBe(false);
  });

  it('never offers it again once skipped or finished, in this session or a later one', () => {
    expect(shouldOfferWizard({ ...facts, seen: ['wizard'] })).toBe(false);
    expect(shouldOfferWizard({ ...facts, offeredThisSession: true })).toBe(false);
  });

  it('only while the guide is active', () => {
    for (const onboarding of ['done', 'dismissed', null, undefined] as const) {
      expect(shouldOfferWizard({ ...facts, onboarding })).toBe(false);
    }
  });
});

const owner: User = {
  id: 7, name: 'Daniel', surname: 'Hart', email: 'd@example.com', role: 'user', country: 'Ireland',
  unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true,
  team: { role: 'owner', owner_name: 'Daniel Hart', member_count: 0, show_welcome: false },
  onboarding: 'active', onboarding_progress: { seen: [], panel: 'open' },
};

const summary = (apiaries: number, seen: string[] = [], onboarding = 'active') => ({
  success: true,
  data: {
    apiaries, beehives: apiaries, inspections: 0, feedings: 0, harvests: 0, treatment_types: 0,
    treatment_sessions: 0, treatment_doses_done: 0, costs: 0, cost_categories: 0, team_members: 0,
    pending_invitations: 0, onboarding, onboarding_progress: { seen, panel: 'open' },
  },
});

describe('wizardRedirectGuard', () => {
  let http: HttpTestingController;
  let store: MockStore;

  function setup(user: User | null) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        provideMockStore({ initialState: { auth: { ...initialAuthState, user } } }),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  }

  async function run(): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() => wizardRedirectGuard({} as never, {} as never));
    return isObservable(result) ? firstValueFrom(result as Observable<boolean | UrlTree>) : (result as boolean);
  }

  beforeEach(() => sessionStorage.clear());
  afterEach(() => http.verify());

  it('sends an email sign-up with no apiary to the wizard, once', async () => {
    setup(owner);
    const pending = run();
    http.expectOne(environment.apiUrl + 'user/onboarding/summary').flush(summary(0));
    const result = await pending;

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/auth/complete-profile');
    expect(wizardOfferedThisSession()).toBe(true);
    // The hub reads the same answer.
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: OnboardingActions.loadSuccess.type }));

    // Back from the wizard on the same tab: straight through, no request.
    expect(await run()).toBe(true);
  });

  it('lets an owner with an apiary through', async () => {
    setup(owner);
    const pending = run();
    http.expectOne(environment.apiUrl + 'user/onboarding/summary').flush(summary(1));
    expect(await pending).toBe(true);
  });

  it('lets through whoever skipped it in another session', async () => {
    setup(owner);
    const pending = run();
    http.expectOne(environment.apiUrl + 'user/onboarding/summary').flush(summary(0, ['wizard']));
    expect(await pending).toBe(true);
  });

  it('asks nothing for an editor, a session that says the guide is over, or one already offered', async () => {
    setup({ ...owner, team: { role: 'editor', owner_name: 'Ann Lee', member_count: 1, show_welcome: false } });
    expect(await run()).toBe(true);
    TestBed.resetTestingModule();

    setup({ ...owner, onboarding: 'dismissed' });
    expect(await run()).toBe(true);
    TestBed.resetTestingModule();

    setup({ ...owner, onboarding_progress: { seen: ['wizard'], panel: 'open' } });
    expect(await run()).toBe(true);
    TestBed.resetTestingModule();

    markWizardOffered();
    setup(owner);
    expect(await run()).toBe(true);
  });

  it('never stands in the way when the API fails', async () => {
    setup(owner);
    const pending = run();
    http.expectOne(environment.apiUrl + 'user/onboarding/summary').flush({ message: 'No' }, { status: 500, statusText: 'Error' });
    expect(await pending).toBe(true);
    expect(wizardOfferedThisSession()).toBe(false);
  });
});

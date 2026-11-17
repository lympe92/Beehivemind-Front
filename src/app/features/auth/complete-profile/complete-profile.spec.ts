import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { initialAuthState, User } from '../../../store/auth/auth.state';
import { initialApiariesState } from '../../../store/apiaries/apiaries.state';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { AuthActions } from '../../../store/auth/auth.actions';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { Apiary } from '../../../core/models/apiary.model';
import { CompleteProfileComponent, firstApiaryPayload } from './complete-profile';
import { wizardOfferedThisSession } from '../../../core/onboarding/wizard-redirect';

const owner: User = {
  id: 7, name: 'Daniel', surname: 'Hart', email: 'd@example.com', role: 'user', country: null,
  unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: false,
  team: { role: 'owner', owner_name: 'Daniel Hart', member_count: 0, show_welcome: false },
};
const editor: User = { ...owner, team: { role: 'editor', owner_name: 'Ann Lee', member_count: 2, show_welcome: true } };
const apiary = { id: 1, name: 'Home yard', hivesNumber: 1 } as Apiary;

describe('firstApiaryPayload', () => {
  it('carries the name, the place in words, exactly one hive and no coordinates', () => {
    const payload = firstApiaryPayload('  Home yard ', ' Ashford ');
    expect(payload).toEqual({ name: 'Home yard', hivesNumber: 1, location: 'Ashford' });
    expect('latitude' in payload).toBe(false);
    expect('longitude' in payload).toBe(false);
  });

  it('sends no location when none was typed', () => {
    expect(firstApiaryPayload('Home yard', '   ').location).toBeNull();
  });
});

describe('CompleteProfileComponent', () => {
  let store: MockStore;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  function setup(opts: { user: User; pending?: boolean; apiaries?: Apiary[] | null }) {
    const pending = opts.pending ?? true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: { event: vi.fn() } },
        provideMockStore({
          initialState: {
            auth: pending
              ? { ...initialAuthState, pendingUser: opts.user, pendingToken: 'tok' }
              : { ...initialAuthState, user: opts.user },
            apiaries: opts.apiaries
              ? { ...initialApiariesState, apiaries: opts.apiaries, loaded: true }
              : initialApiariesState,
          },
        }),
      ],
    });
    store = TestBed.inject(MockStore);
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(store, 'dispatch');
    const component = TestBed.runInInjectionContext(() => new CompleteProfileComponent());
    component.ngOnInit();
    TestBed.tick();
    return component;
  }

  function chooseCountry(component: CompleteProfileComponent): void {
    component.countryForm.controls.country.setValue(component.countries[0].code);
  }

  function saveCountry(component: CompleteProfileComponent): void {
    chooseCountry(component);
    component.submit();
    http.expectOne(`${environment.apiUrl}user/profile`).flush({ success: true, data: null });
    TestBed.tick();
  }

  beforeEach(() => sessionStorage.clear());
  afterEach(() => http.verify());

  it('offers two steps to a new owner, and the country leads to step 2', () => {
    const component = setup({ user: owner });
    expect(component.offersApiaryStep()).toBe(true);
    expect(store.dispatch).toHaveBeenCalledWith(ApiariesActions.load());

    saveCountry(component);

    expect(component.step()).toBe(2);
    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.loginSuccess({ user: { ...owner, country: component.countries[0].name }, token: 'tok' }),
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('gives an invited editor one step: Continue goes to the dashboard and creates nothing', () => {
    const component = setup({ user: editor });
    expect(component.offersApiaryStep()).toBe(false);

    saveCountry(component);

    expect(component.step()).toBe(1);
    expect(navigate).toHaveBeenCalledWith(['/user/dashboard']);
    http.expectNone(`${environment.apiUrl}apiaries`);
  });

  it('skips step 2 when the team already has an apiary', () => {
    const component = setup({ user: owner, apiaries: [apiary] });
    expect(component.offersApiaryStep()).toBe(false);

    saveCountry(component);

    expect(component.step()).toBe(1);
    expect(navigate).toHaveBeenCalledWith(['/user/dashboard']);
  });

  it('leaves step 2 for the dashboard when a reload finds the apiary already made', () => {
    const component = setup({ user: { ...owner, country: 'United Kingdom' }, pending: false });
    expect(component.step()).toBe(2);
    expect(navigate).not.toHaveBeenCalled();

    store.setState({
      auth: { ...initialAuthState, user: { ...owner, country: 'United Kingdom' } },
      apiaries: { ...initialApiariesState, apiaries: [apiary], loaded: true },
    });
    TestBed.tick();

    expect(navigate).toHaveBeenCalledWith(['/user/dashboard']);
  });

  it('requires a name before anything is sent', () => {
    const component = setup({ user: owner });
    saveCountry(component);

    component.createApiary();

    expect(component.apiaryForm.controls.name.touched).toBe(true);
    expect(component.apiaryForm.controls.name.errors).toEqual({ required: { message: 'Enter a name for the apiary.' } });
    expect(component.saving()).toBe(false);
    http.expectNone(`${environment.apiUrl}apiaries`);

    component.apiaryForm.controls.name.setValue('   ');
    expect(component.apiaryForm.controls.name.valid).toBe(false);
    component.apiaryForm.controls.name.setValue('Home yard');
    expect(component.apiaryForm.controls.name.valid).toBe(true);
  });

  it('creates the apiary with one hive and no coordinates, then reloads and goes to the dashboard', () => {
    const component = setup({ user: owner });
    saveCountry(component);
    component.apiaryForm.controls.name.setValue('Home yard');
    component.apiaryForm.controls.location.setValue('Ashford');

    component.createApiary();
    expect(component.saving()).toBe(true);

    const req = http.expectOne(`${environment.apiUrl}apiaries`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Home yard', hives_number: 1, location: 'Ashford' });
    req.flush({ success: true, data: { id: 3, name: 'Home yard' } });

    expect(store.dispatch).toHaveBeenCalledWith(ApiariesActions.reload());
    expect(store.dispatch).toHaveBeenCalledWith(BeehivesActions.reload());
    expect(navigate).toHaveBeenCalledWith(['/user/dashboard']);

    // Finished: never offered again, in this tab or a later session.
    const progress = http.expectOne(`${environment.apiUrl}user/onboarding/progress`);
    expect(progress.request.body).toEqual({ seen: ['wizard'] });
    progress.flush({ success: true, data: { onboarding: 'active', onboarding_progress: { seen: ['wizard'], panel: 'open' } } });
    expect(wizardOfferedThisSession()).toBe(true);
  });

  it('remembers a skip on either step, so the /user guard does not bring the wizard back', () => {
    const component = setup({ user: owner });
    saveCountry(component);
    component.skipApiary();

    expect(http.expectOne(`${environment.apiUrl}user/onboarding/progress`).request.body).toEqual({ seen: ['wizard'] });
    expect(wizardOfferedThisSession()).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/user/dashboard']);
  });

  it('remembers a skip of the country step too', () => {
    const component = setup({ user: owner });
    component.skip();
    expect(http.expectOne(`${environment.apiUrl}user/onboarding/progress`).request.body).toEqual({ seen: ['wizard'] });
  });

  it('keeps the form on step 2 when the request fails', () => {
    const component = setup({ user: owner });
    saveCountry(component);
    component.apiaryForm.controls.name.setValue('Home yard');

    component.createApiary();
    http.expectOne(`${environment.apiUrl}apiaries`).flush({ message: 'No' }, { status: 500, statusText: 'Server Error' });

    expect(component.saving()).toBe(false);
    expect(component.step()).toBe(2);
    expect(component.apiaryForm.getRawValue().name).toBe('Home yard');
    expect(component.apiaryForm.enabled).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends a visit with no sign-in at all to the login screen', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AnalyticsService, useValue: { event: vi.fn() } },
        provideMockStore({ initialState: { auth: initialAuthState, apiaries: initialApiariesState } }),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.runInInjectionContext(() => new CompleteProfileComponent()).ngOnInit();
    expect(nav).toHaveBeenCalledWith(['/auth/login']);
  });
});

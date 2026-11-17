import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { of } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../store/auth/auth.actions';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ApiaryService } from '../../../core/services/apiary.service';
import { Apiary } from '../../../core/models/apiary.model';
import { selectCurrentUser, selectPendingUser, selectPendingToken } from '../../../store/auth/auth.selectors';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries, selectApiariesLoaded } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { COUNTRIES, Country } from '../../../core/data/countries';
import { environment } from '../../../../environments/environment';
import { AuthCardComponent } from '../../../shared/components/forms/auth-card/auth-card';
import { ButtonComponent } from '../../../shared/components/ui/button/button';
import { InputComponent } from '../../../shared/components/form-fields/input/input.component';
import { SelectComponent } from '../../../shared/components/form-fields/select/select.component';
import { FieldOption } from '../../../core/models/form-fields.model';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { markWizardOffered } from '../../../core/onboarding/wizard-redirect';

/**
 * The first apiary, as the wizard sends it: a name, the place in words if
 * given, and exactly one hive, on every plan. One hive fits Free, so the
 * first thing a new account does cannot hit the plan limit. No coordinates:
 * the wizard has no map.
 */
export function firstApiaryPayload(name: string, location: string): Partial<Apiary> {
  return {
    name: name.trim(),
    hivesNumber: 1,
    location: location.trim() || null,
  };
}

/** A name of spaces is not a name. The copy rides on the error, which `<app-form-errors>` prints as it is. */
const apiaryNameRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() ? null : { required: { message: 'Enter a name for the apiary.' } };

/** The API's column lengths, under the key `<app-form-errors>` has words for. */
const maxLength = (maximumLength: number): ValidatorFn => control =>
  String(control.value ?? '').length > maximumLength ? { maxLength: { maximumLength } } : null;

/**
 * The setup wizard at /auth/complete-profile, reached after a new Google or
 * Apple sign-in that carries no country (and by anyone signed in who opens
 * the address). Step 1 saves the country, as "One last step" did; step 2
 * creates the first apiary with one hive. An invited editor, or a team that
 * already has an apiary, gets step 1 alone and no step indicator.
 */
@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [AuthCardComponent, NgTemplateOutlet, ReactiveFormsModule, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.scss',
})
export class CompleteProfileComponent implements OnInit {
  private store         = inject(Store);
  private router        = inject(Router);
  private http          = inject(HttpClient);
  private analytics     = inject(AnalyticsService);
  private apiaryService = inject(ApiaryService);
  private toast         = inject(ToastService);
  private onboarding    = inject(OnboardingService);

  readonly countries: Country[] = COUNTRIES;

  private readonly pendingToken = this.store.selectSignal(selectPendingToken);
  private readonly pendingUser  = this.store.selectSignal(selectPendingUser);
  private readonly currentUser  = this.store.selectSignal(selectCurrentUser);
  private readonly apiaries     = this.store.selectSignal(selectAllApiaries);
  private readonly apiariesLoaded = this.store.selectSignal(selectApiariesLoaded);

  /** A fresh social sign-in is still pending; after step 1, or on a reload, the session is the store's user. */
  readonly user = computed(() => this.pendingUser() ?? this.currentUser());

  readonly isEditor  = computed(() => this.user()?.team?.role === 'editor');
  readonly hasApiary = computed(() => this.apiariesLoaded() && this.apiaries().length > 0);
  /** Step 2 is for an owner whose team has no apiary yet; everyone else sees one step. */
  readonly offersApiaryStep = computed(() => !this.isEditor() && !this.hasApiary());

  readonly step = signal<1 | 2>(1);

  // Step 1
  readonly countryForm = new FormGroup({ country: new FormControl<string | null>(null) });
  readonly countryOptions = of<FieldOption[]>(COUNTRIES.map(c => ({ displayValue: c.name, returnValue: c.code })));
  readonly selectedCountry = signal<Country | null>(null);
  readonly loading         = signal(false);
  readonly error           = signal<string | null>(null);

  // Step 2
  readonly apiaryForm = new FormGroup({
    name:     new FormControl('', { nonNullable: true, validators: [apiaryNameRequired, maxLength(55)] }),
    location: new FormControl('', { nonNullable: true, validators: [maxLength(255)] }),
  });
  readonly saving = signal(false);

  private readonly followCountry = this.countryForm.controls.country.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(code => this.selectedCountry.set(this.countries.find(c => c.code === code) ?? null));

  /**
   * A reload on step 2, or a second visit, must not make a second "first
   * apiary": once the store says the team has one, step 2 is over.
   */
  private readonly leaveWhenSetUp = effect(() => {
    if (this.step() === 2 && this.hasApiary() && !this.saving()) {
      this.router.navigate(['/user/dashboard']);
    }
  });

  ngOnInit(): void {
    const user = this.user();
    if (!this.pendingToken() && !this.currentUser()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.countryForm.controls.country.setValue(this.countries.find(c => c.name === user?.country)?.code ?? null);
    // Signed in with a country already: the country step is behind them (a reload on step 2).
    if (!this.pendingToken() && user?.country && this.offersApiaryStep()) {
      this.step.set(2);
    }

    // The sign-in already set the session cookie, so the team's apiaries can be asked for now.
    if (!this.isEditor()) {
      this.store.dispatch(ApiariesActions.load());
    }
  }

  // ── Step 1: country ──────────────────────────────────────

  submit(): void {
    const country = this.selectedCountry();
    if (!country || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const token = this.pendingToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http.put(`${environment.apiUrl}user/profile`, {
      country: country.name,
      country_latitude: country.latitude,
      country_longitude: country.longitude,
    }, { headers }).subscribe({
      next: () => {
        this.analytics.event('complete_profile', { skipped: false });
        this.loading.set(false);
        this.signIn(country.name);
        if (this.offersApiaryStep()) {
          this.step.set(2);
        } else {
          this.router.navigate(['/user/dashboard']);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Something went wrong. Please try again.');
      },
    });
  }

  skip(): void {
    this.analytics.event('complete_profile', { skipped: true });
    this.signIn(null);
    this.wizardOver();
    this.router.navigate(['/user/dashboard']);
  }

  /**
   * Skipped or finished: the /user guard must not bring the wizard back, in
   * this tab (sessionStorage, at once) or in a later session (the guide's
   * `wizard` key, on the API). After `signIn`, so the request carries the session.
   */
  private wizardOver(): void {
    markWizardOffered();
    this.onboarding.updateProgress({ seen: ['wizard'] }).subscribe({ error: () => {} });
  }

  /** A pending sign-in becomes the session; one that already is stays as it is. */
  private signIn(country: string | null): void {
    const user = this.pendingUser();
    const token = this.pendingToken();
    if (!user || !token) return;
    this.store.dispatch(AuthActions.loginSuccess({
      user: country ? { ...user, country } : user,
      token,
    }));
  }

  // ── Step 2: the first apiary ─────────────────────────────

  back(): void {
    if (this.saving()) return;
    this.step.set(1);
  }

  skipApiary(): void {
    if (this.saving()) return;
    this.wizardOver();
    this.router.navigate(['/user/dashboard']);
  }

  createApiary(): void {
    if (this.saving()) return;
    if (this.apiaryForm.invalid) {
      this.apiaryForm.markAllAsTouched();
      return;
    }
    if (this.hasApiary()) {
      this.router.navigate(['/user/dashboard']);
      return;
    }

    const { name, location } = this.apiaryForm.getRawValue();
    this.setSaving(true);
    // create_apiary is reported by the analytics interceptor, not here.
    this.apiaryService.createApiary(firstApiaryPayload(name, location)).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(ApiariesActions.reload());
          this.store.dispatch(BeehivesActions.reload());
          this.wizardOver();
          this.toast.success('Apiary created.');
          this.router.navigate(['/user/dashboard']);
        } else {
          this.setSaving(false);
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      // The error interceptor shows the toast; the form stays as it was.
      error: () => this.setSaving(false),
    });
  }

  /** The fields lock with the button while the request is out. */
  private setSaving(saving: boolean): void {
    this.saving.set(saving);
    if (saving) this.apiaryForm.disable({ emitEvent: false });
    else this.apiaryForm.enable({ emitEvent: false });
  }
}

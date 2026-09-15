import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, PLATFORM_ID, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, skip, take } from 'rxjs';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectAuthError, selectCurrentUser, selectIsLoggedIn } from '../../../store/auth/auth.selectors';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService } from '../../../core/services/team.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { InviteState } from '../../../core/models/team.model';
import { environment } from '../../../../environments/environment';
import { COUNTRIES, Country } from '../../../core/data/countries';
import { getFailedPasswordRules, passwordStrengthValidator, PasswordRule } from '../../../shared/components/ui/form/password-rules';
import { AuthCardComponent } from '../../../shared/components/forms/auth-card/auth-card';
import { InputComponent } from '../../../shared/components/form-fields/input/input.component';

/**
 * `/auth/invite?token=…` — the link in an invitation email.
 *
 * The same auth card and the same form as Register, with two differences that
 * follow from the link having proved the address: the email is filled in and
 * locked, and there is no confirmation step afterwards. The account it creates
 * lands inside the inviting owner's team.
 *
 * The token is resolved before anything is drawn, into one of six states. Five
 * have no form: an invitation is a one-time thing that can be spent, cancelled,
 * expired or meant for somebody else, and a disabled form under the message
 * would suggest the problem is fixable here. "Signed in" is a check against
 * this browser's session, not a state of the token.
 */
@Component({
  selector: 'app-auth-invite',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent, InputComponent],
  templateUrl: './invite.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteComponent implements OnInit {
  private store       = inject(Store);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private fb          = inject(FormBuilder);
  private teams       = inject(TeamService);
  private authService = inject(AuthService);
  private analytics   = inject(AnalyticsService);
  private destroyRef  = inject(DestroyRef);
  private isBrowser   = isPlatformBrowser(inject(PLATFORM_ID));

  readonly state      = signal<InviteState | 'loading'>('loading');
  readonly ownerName  = signal('');
  readonly email      = signal('');
  readonly signedInAs = signal('');
  readonly loading    = signal(false);
  readonly error      = signal<string | null>(null);

  /** The title stays "Join Daniel Hart's team" in every state; a dead link cannot say whose. */
  readonly title = computed(() => this.ownerName() ? `Join ${this.ownerName()}'s team` : 'Accept invitation');

  /** A Google refusal arrives as the sign-in error — shown only once Google was actually tried here. */
  private googleTried = signal(false);
  private authError   = this.store.selectSignal(selectAuthError);
  readonly googleError = computed(() => this.googleTried() ? this.authError() : null);

  readonly countries: Country[] = COUNTRIES;
  private token = '';

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(55)]],
    surname: ['', [Validators.required, Validators.maxLength(55)]],
    password: ['', [Validators.required, passwordStrengthValidator()]],
    country: [null],
    country_latitude: [null],
    country_longitude: [null],
  });

  get passwordErrors(): PasswordRule[] {
    return getFailedPasswordRules(this.form.controls['password'].value);
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.state.set('invalid');
      return;
    }

    this.store.select(selectCurrentUser).pipe(take(1)).subscribe(user => {
      if (user) this.signedInAs.set(user.email);
    });

    // Signed in by this page (the form, or Google) → into the team's dashboard.
    this.store.select(selectIsLoggedIn).pipe(
      skip(1),
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.router.navigate(['/user/dashboard']));

    this.teams.lookupInvitation(this.token).subscribe({
      next: res => {
        this.ownerName.set(res.data.ownerName);
        this.email.set(res.data.email ?? '');
        this.show(res.data.state);
      },
      error: () => this.state.set('invalid'),
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.teams.acceptInvitation(this.token, this.form.value).subscribe({
      next: res => {
        this.loading.set(false);
        this.analytics.event('sign_up', { method: 'invite' });
        this.store.dispatch(AuthActions.loginSuccess({ user: res.data.user, token: res.data.token }));
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const code = (err.error as { meta?: { code?: string } } | null)?.meta?.code;
        if (code === 'used' || code === 'expired' || code === 'invalid') {
          this.state.set(code);
        } else {
          this.error.set(err.error?.message ?? 'Something went wrong. Please try again.');
        }
      },
    });
  }

  /** Log out and stay: the invitation is still waiting on this page. */
  logOut(): void {
    this.authService.logout().subscribe({
      next: () => this.afterLogout(),
      error: () => this.afterLogout(),
    });
  }

  onCountryChange(event: Event): void {
    const code = (event.target as HTMLSelectElement).value;
    const country = this.countries.find(c => c.code === code) ?? null;
    this.form.patchValue({
      country: country?.name ?? null,
      country_latitude: country?.latitude ?? null,
      country_longitude: country?.longitude ?? null,
    });
  }

  private afterLogout(): void {
    this.store.dispatch(AuthActions.sessionCleared());
    this.signedInAs.set('');
    this.teams.lookupInvitation(this.token).subscribe({
      next: res => {
        this.email.set(res.data.email ?? '');
        this.show(res.data.state);
      },
      error: () => this.state.set('invalid'),
    });
  }

  private show(state: 'valid' | 'expired' | 'used'): void {
    if (this.signedInAs() && state === 'valid') {
      this.state.set('signed-in');
      return;
    }

    this.state.set(state);
    if (state === 'valid' && this.isBrowser) {
      // The button renders into the form's container once it exists.
      setTimeout(() => this.loadGoogleSignIn());
    }
  }

  private loadGoogleSignIn(): void {
    if (document.getElementById('gsi-script')) {
      this.initGsi();
      return;
    }
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initGsi();
    document.head.appendChild(script);
  }

  private initGsi(): void {
    const g = (window as unknown as {
      google?: {
        accounts?: {
          id?: {
            initialize(config: {
              client_id: string;
              callback: (response: { credential: string }) => void;
            }): void;
            renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
          };
        };
      };
    }).google;
    if (!g?.accounts?.id) return;

    g.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        this.googleTried.set(true);
        this.store.dispatch(AuthActions.loginWithGoogle({ credential: response.credential, inviteToken: this.token }));
      },
    });

    const btn = document.getElementById('google-invite-btn');
    if (btn) {
      g.accounts.id.renderButton(btn, {
        theme: 'outline',
        size: 'large',
        width: 340,
        text: 'signup_with',
        shape: 'rectangular',
      });
    }
  }
}

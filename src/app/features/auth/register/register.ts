import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/services/auth.service';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectIsLoggedIn } from '../../../store/auth/auth.selectors';
import { environment } from '../../../../environments/environment';
import { COUNTRIES, Country } from '../../../core/data/countries';

@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private store = inject(Store);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  registeredEmail = signal<string | null>(null);
  resendLoading = signal(false);
  resendMessage = signal<string | null>(null);

  countries: Country[] = COUNTRIES;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(55)]],
    surname: ['', [Validators.required, Validators.maxLength(55)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    country: [null],
    country_latitude: [null],
    country_longitude: [null],
  });

  ngOnInit(): void {
    this.store.select(selectIsLoggedIn).subscribe((loggedIn) => {
      if (loggedIn) this.router.navigate(['/dashboard']);
    });

    if (isPlatformBrowser(this.platformId)) {
      this.loadGoogleSignIn();
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.registeredEmail.set(this.form.value.email);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }

  onCountryChange(event: Event): void {
    const code = (event.target as HTMLSelectElement).value;
    const country = this.countries.find(c => c.code === code) ?? null;
    if (country) {
      this.form.patchValue({
        country: country.name,
        country_latitude: country.latitude,
        country_longitude: country.longitude,
      });
    } else {
      this.form.patchValue({ country: null, country_latitude: null, country_longitude: null });
    }
  }

  resendConfirmation(): void {
    const email = this.registeredEmail();
    if (!email || this.resendLoading()) return;
    this.resendLoading.set(true);
    this.resendMessage.set(null);

    this.authService.resendConfirmation(email).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.resendMessage.set('A new confirmation email has been sent.');
      },
      error: () => {
        this.resendLoading.set(false);
        this.resendMessage.set('Something went wrong. Please try again.');
      },
    });
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
    const g = (window as any).google;
    if (!g?.accounts?.id) return;

    g.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        this.store.dispatch(AuthActions.loginWithGoogle({ credential: response.credential }));
      },
    });

    const btn = document.getElementById('google-signup-btn');
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

import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { AuthActions } from '../../../store/auth/auth.actions';
import {
  selectAuthError,
  selectAuthLoading,
  selectIsLoggedIn,
  selectRetryAfterMinutes,
} from '../../../store/auth/auth.selectors';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  retryAfterMinutes$ = this.store.select(selectRetryAfterMinutes);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.store.select(selectIsLoggedIn).subscribe((loggedIn) => {
      if (loggedIn) this.router.navigate(['/user/dashboard']);
    });

    if (isPlatformBrowser(this.platformId)) {
      this.loadGoogleSignIn();
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    this.store.dispatch(AuthActions.login({ email, password }));
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

    const btn = document.getElementById('google-signin-btn');
    if (btn) {
      g.accounts.id.renderButton(btn, {
        theme: 'outline',
        size: 'large',
        width: 340,
        text: 'signin_with',
        shape: 'rectangular',
      });
    }
  }
}

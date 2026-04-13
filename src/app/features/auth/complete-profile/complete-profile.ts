import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectPendingUser, selectPendingToken } from '../../../store/auth/auth.selectors';
import { COUNTRIES, Country } from '../../../core/data/countries';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.scss',
})
export class CompleteProfileComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private http = inject(HttpClient);

  countries: Country[] = COUNTRIES;
  selectedCountry: Country | null = null;
  loading = signal(false);
  error = signal<string | null>(null);

  private pendingToken: string | null = null;
  private pendingUser$ = this.store.select(selectPendingUser);

  ngOnInit(): void {
    this.store.select(selectPendingToken).pipe(take(1)).subscribe(token => {
      if (!token) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.pendingToken = token;
    });
  }

  onCountryChange(event: Event): void {
    const code = (event.target as HTMLSelectElement).value;
    this.selectedCountry = this.countries.find(c => c.code === code) ?? null;
  }

  submit(): void {
    if (!this.selectedCountry || !this.pendingToken || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders({ Authorization: `Bearer ${this.pendingToken}` });

    this.http.put(`${environment.apiUrl}user/profile`, {
      country: this.selectedCountry.name,
      country_latitude: this.selectedCountry.latitude,
      country_longitude: this.selectedCountry.longitude,
    }, { headers }).subscribe({
      next: () => {
        this.pendingUser$.pipe(take(1)).subscribe(user => {
          if (user) {
            this.store.dispatch(AuthActions.loginSuccess({
              user: { ...user, country: this.selectedCountry!.name },
              token: this.pendingToken!,
            }));
          }
        });
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Something went wrong. Please try again.');
      },
    });
  }

  skip(): void {
    this.pendingUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.store.dispatch(AuthActions.loginSuccess({
          user,
          token: this.pendingToken!,
        }));
      }
    });
  }
}

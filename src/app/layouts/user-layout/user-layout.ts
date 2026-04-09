import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.scss',
})
export class UserLayoutComponent {
  private store = inject(Store);
  private router = inject(Router);

  user$ = this.store.select(selectCurrentUser);
  sidebarOpen = signal(true);

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
    this.router.navigate(['/auth/login']);
  }
}

import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { EmployeeAuthActions } from '../../store/employee-auth/employee-auth.actions';
import {
  selectCurrentEmployee,
  selectIsAtLeastAdmin,
  selectIsAtLeastModerator,
  selectIsAtLeastSupport,
  selectIsSuperAdmin,
} from '../../store/employee-auth/employee-auth.selectors';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayoutComponent {
  private store = inject(Store);
  private router = inject(Router);

  employee$ = this.store.select(selectCurrentEmployee);
  isAtLeastModerator$ = this.store.select(selectIsAtLeastModerator);
  isAtLeastAdmin$ = this.store.select(selectIsAtLeastAdmin);
  isSuperAdmin$ = this.store.select(selectIsSuperAdmin);
  isSupport$ = this.store.select(selectIsAtLeastSupport);

  sidebarOpen = signal(true);

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  logout(): void {
    this.store.dispatch(EmployeeAuthActions.logout());
    this.router.navigate(['/admin/login']);
  }
}

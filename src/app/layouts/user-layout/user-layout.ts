import { Component, inject, OnInit, signal } from '@angular/core';
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
export class UserLayoutComponent implements OnInit {
  private store  = inject(Store);
  private router = inject(Router);

  user$        = this.store.select(selectCurrentUser);
  sidebarOpen  = signal(true);
  openGroups   = signal<Set<string>>(new Set());

  ngOnInit(): void {
    // Auto-open the group that contains the current route
    const url = this.router.url;
    if (url.startsWith('/user/apiary')) this.openGroup('apiaries');
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  toggleGroup(key: string): void {
    if (!this.sidebarOpen()) {
      this.sidebarOpen.set(true);
    }
    this.openGroups.update(s => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  isGroupOpen(key: string): boolean {
    return this.openGroups().has(key);
  }

  private openGroup(key: string): void {
    this.openGroups.update(s => new Set([...s, key]));
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

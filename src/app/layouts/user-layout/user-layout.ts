import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  effect,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { NotificationBellComponent } from '../../shared/components/ui/notification-bell/notification-bell';
import { TooltipDirective } from '../../shared/components/ui/tooltip/tooltip.directive';

/** Below this width the sidebar is an overlay rather than a column. */
const OVERLAY_BREAKPOINT = 992;

/**
 * The logged-in app shell: a collapsing sidebar beside a header and scrolling
 * content. Styles: styles/components/layout/user-layout.css.
 *
 * Above 992 the sidebar is a persistent column that collapses to a 64px rail.
 * Below 992 it is an overlay with a scrim: it starts closed, closes when you
 * navigate, and Escape closes it — the same contract as the public header's
 * menu. Focus is not trapped; it is navigation, not a dialog.
 */
@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent, TooltipDirective],
  templateUrl: './user-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserLayoutComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly user = this.store.selectSignal(selectCurrentUser);
  sidebarOpen = signal(true);
  openGroups = signal<Set<string>>(new Set());

  constructor() {
    // Selecting a destination closes the overlay — the page you navigated to
    // is behind the panel. On desktop the column stays put.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isOverlay()) this.sidebarOpen.set(false);
      });

    effect(() => {
      if (!this.isBrowser) return;
      const lock = this.sidebarOpen() && this.isOverlay();
      this.document.body.style.overflow = lock ? 'hidden' : '';
    });

    this.destroyRef.onDestroy(() => {
      if (this.isBrowser) this.document.body.style.overflow = '';
    });
  }

  ngOnInit(): void {
    // Below 992 the sidebar is an overlay, so it must start closed.
    if (this.isOverlay()) this.sidebarOpen.set(false);

    // Auto-open the group that contains the current route
    const url = this.router.url;
    if (url.startsWith('/user/apiary'))      this.openGroup('apiaries');
    if (url.startsWith('/user/treatments'))  this.openGroup('treatments');
    if (url.startsWith('/user/todo') || url.startsWith('/user/calendar')) this.openGroup('todo');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOverlay() && this.sidebarOpen()) this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleGroup(key: string): void {
    // Opening a group from the collapsed rail expands the sidebar first.
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

  /** The tooltip label for a rail icon: only when the labels are hidden. */
  tip(label: string): string {
    return this.sidebarOpen() || this.isOverlay() ? '' : label;
  }

  initials(): string {
    const u = this.user();
    if (!u) return '';
    return (u.name || ' ').charAt(0) + (u.surname || ' ').charAt(0);
  }

  private openGroup(key: string): void {
    this.openGroups.update(s => new Set([...s, key]));
  }

  private isOverlay(): boolean {
    return this.isBrowser && window.innerWidth < OVERLAY_BREAKPOINT;
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

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
import { EmployeeAuthActions } from '../../store/employee-auth/employee-auth.actions';
import {
  selectCurrentEmployee,
  selectIsAtLeastAdmin,
  selectIsAtLeastModerator,
  selectIsSuperAdmin,
} from '../../store/employee-auth/employee-auth.selectors';
import { TooltipDirective } from '../../shared/components/ui/tooltip/tooltip.directive';

const OVERLAY_BREAKPOINT = 992;

/**
 * The admin shell. Same geometry and the same classes as the dashboard's
 * user layout — `.user-shell`, `.sidebar`, `.sidebar__link`, `.user-main`,
 * `.user-content` — because the admin zone is not a fourth surface. It is the
 * dashboard with a different nav, role-gated with dividers, and the role
 * shown in the footer so an admin who cannot see a link understands why.
 * Collapsed, each link's name lives in `aria-label` and the tooltip is the
 * sighted-mouse convenience on top. Styles: user-layout.css.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TooltipDirective],
  templateUrl: './admin-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly employee = this.store.selectSignal(selectCurrentEmployee);
  readonly isAtLeastModerator = this.store.selectSignal(selectIsAtLeastModerator);
  readonly isAtLeastAdmin = this.store.selectSignal(selectIsAtLeastAdmin);
  readonly isSuperAdmin = this.store.selectSignal(selectIsSuperAdmin);

  sidebarOpen = signal(true);

  constructor() {
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
    if (this.isOverlay()) this.sidebarOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOverlay() && this.sidebarOpen()) this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  tip(label: string): string {
    return this.sidebarOpen() || this.isOverlay() ? '' : label;
  }

  private isOverlay(): boolean {
    return this.isBrowser && window.innerWidth < OVERLAY_BREAKPOINT;
  }

  logout(): void {
    this.store.dispatch(EmployeeAuthActions.logout());
    this.router.navigate(['/admin/login']);
  }
}

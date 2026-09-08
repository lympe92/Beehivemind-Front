import {
  Component,
  DestroyRef,
  DOCUMENT,
  effect,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LinkButtonComponent } from '../../../shared/components/ui/link-button/link-button';
import { ImageComponent } from '../../../shared/components/ui/image/image';

/**
 * The fixed public navigation bar. Owns three pieces of state: the mobile
 * menu, the "How to" dropdown, and whether the page has scrolled past 10px
 * (which tightens the bar and shrinks the logo).
 *
 * Below 992 the menu is a panel under the bar, not a second row in it. Escape
 * closes it, the scrim closes it, navigating closes it, and the page behind
 * stops scrolling while it is open. Focus is not trapped — it is navigation,
 * not a dialog. Styles: styles/components/layout/public-layout.css.
 */
@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LinkButtonComponent, ImageComponent],
  templateUrl: './public-header.html',
})
export class PublicHeaderComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  menuOpen = signal(false);
  dropdownOpen = signal(false);
  scrolled = signal(false);

  readonly howTo = [
    { label: 'Apiaries & Beehives', link: '/apiariesandbeehives' },
    { label: 'Inspections', link: '/inspections' },
    { label: 'Harvest & Feeding', link: '/harvestandfeeding' },
    { label: 'Financial', link: '/financial' },
  ];

  constructor() {
    // Navigating anywhere closes the menu and the dropdown.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeAll());

    // The page behind stops scrolling while the panel is open.
    effect(() => {
      if (!this.isBrowser) return;
      this.document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
    });

    this.destroyRef.onDestroy(() => {
      if (this.isBrowser) this.document.body.style.overflow = '';
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAll();
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
    if (!this.menuOpen()) this.dropdownOpen.set(false);
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  closeAll(): void {
    this.menuOpen.set(false);
    this.dropdownOpen.set(false);
  }
}

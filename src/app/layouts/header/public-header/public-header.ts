import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LinkButtonComponent } from '../../../shared/components/ui/link-button/link-button';
import { ImageComponent } from '../../../shared/components/ui/image/image';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LinkButtonComponent, ImageComponent],
  templateUrl: './public-header.html',
  styleUrl: './public-header.scss',
})
export class PublicHeaderComponent {
  menuOpen = signal(false);
  dropdownOpen = signal(false);
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }
}

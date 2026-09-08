import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * A label for a control that has no room for one — the collapsed sidebar,
 * where a 64px rail leaves icons with no label. It is never the only source
 * of the name: the control carries its own `aria-label`, the bubble is
 * `role="presentation"`, and it shows on keyboard focus as well as hover.
 * Fixed and measured, because the rail clips its own overflow.
 * Styles: `.tip__bubble` in styles/components/ui/tooltip.css.
 *
 * ```html
 * <a class="sidebar__link" [appTip]="open() ? '' : 'Dashboard'" [attr.aria-label]="…">
 * ```
 * An empty label renders nothing.
 */
@Directive({
  selector: '[appTip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  readonly appTip = input<string>('');
  readonly appTipSide = input<'right' | 'bottom'>('right');

  private el = inject(ElementRef<HTMLElement>);
  private doc = inject(DOCUMENT);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private bubble: HTMLElement | null = null;

  @HostListener('mouseenter')
  @HostListener('focusin')
  show(): void {
    const label = this.appTip();
    if (!this.isBrowser || !label || this.bubble) return;
    const a = this.el.nativeElement.getBoundingClientRect();
    const bubble = this.doc.createElement('span');
    bubble.className = 'tip__bubble';
    bubble.setAttribute('role', 'presentation');
    bubble.textContent = label;
    if (this.appTipSide() === 'right') {
      bubble.style.left = a.right + 8 + 'px';
      bubble.style.top = a.top + a.height / 2 + 'px';
      bubble.style.transform = 'translateY(-50%)';
    } else {
      bubble.style.left = a.left + a.width / 2 + 'px';
      bubble.style.top = a.bottom + 8 + 'px';
      bubble.style.transform = 'translateX(-50%)';
    }
    this.doc.body.appendChild(bubble);
    this.bubble = bubble;
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  @HostListener('click')
  hide(): void {
    this.bubble?.remove();
    this.bubble = null;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}

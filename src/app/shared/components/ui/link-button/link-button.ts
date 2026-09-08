import { Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * The navigating twin of `ButtonComponent`: the same `.btn` classes on an <a>.
 * Page configs describe a call to action as a `CtaLink`; every section renders
 * it through this component. An absolute http(s) `routerLink` is treated as an
 * external destination and opens in a new tab.
 */
@Component({
  selector: 'app-link',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './link-button.html',
})
export class LinkButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  routerLink = input.required<string | unknown[]>();
  fullWidth = input<boolean>(false);

  readonly external = computed(() => {
    const link = this.routerLink();
    return typeof link === 'string' && /^https?:\/\//i.test(link);
  });

  readonly classes = computed(
    () => 'btn btn--' + this.variant() + ' btn--' + this.size() + (this.fullWidth() ? ' btn--full' : ''),
  );
}

import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A text link. Colour and underline come from the global `a` rule in
 * styles/components/base.css: ink with a grey underline that goes orange on
 * hover. Pass `linkClass="public-footer__link"` for the footer treatment.
 */
@Component({
  selector: 'app-a-link',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './a-link.component.html',
})
export class ALinkComponent {
  readonly routerLink = input<string[]>();
  readonly queryParams = input<{ [key: string]: unknown }>();
  readonly fragment = input<string>();
  readonly target = input<string>('_self');
  readonly ariaLabel = input<string>('');
  readonly nofollow = input<boolean>(false);
  readonly linkClass = input<string>('');

  get relAttribute(): string | null {
    const parts: string[] = [];
    if (this.nofollow()) parts.push('nofollow');
    if (this.target() === '_blank') parts.push('noopener', 'noreferrer');
    return parts.length ? parts.join(' ') : null;
  }
}

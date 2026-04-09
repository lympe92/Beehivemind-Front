import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-a-link',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './a-link.component.html',
  styleUrl: './a-link.component.scss',
})
export class ALinkComponent {
  readonly routerLink = input<string[]>();
  readonly queryParams = input<{ [key: string]: any }>();
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

import { Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * The website's pill button, for actions that stay on the page. Styles:
 * `.btn` in styles/components/ui/buttons.css. For navigation use
 * `LinkButtonComponent`, which renders the same classes on an <a>.
 * The dashboard uses `.app-btn` (a 6px rectangle) directly — density, not brand.
 */
@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.html',
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  fullWidth = input<boolean>(false);
}

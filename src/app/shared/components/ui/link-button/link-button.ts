import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-link',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './link-button.html',
  styleUrl: './link-button.scss',
})
export class LinkButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  routerLink = input.required<string | any[]>();
  fullWidth = input<boolean>(false);
}

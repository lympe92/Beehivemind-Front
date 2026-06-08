import { ButtonVariant, ButtonSize } from './link-button';

export interface CtaLink {
  label: string;
  routerLink: string | unknown[];
  variant?: ButtonVariant;
  size?: ButtonSize;
}
import { ButtonVariant, ButtonSize } from './link-button';

export interface CtaLink {
  label: string;
  routerLink: string | any[];
  variant?: ButtonVariant;
  size?: ButtonSize;
}
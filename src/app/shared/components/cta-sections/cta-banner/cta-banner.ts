import { Component } from '@angular/core';
import {LinkButtonComponent} from '../../ui/link-button/link-button';

@Component({
  selector: 'app-cta-banner',
  standalone: true,
  imports: [LinkButtonComponent],
  templateUrl: './cta-banner.html',
  styleUrl: './cta-banner.scss',
})
export class CtaBannerComponent {}

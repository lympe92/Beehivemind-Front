import { Component } from '@angular/core';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { ImageComponent } from '../../ui/image/image';

@Component({
  selector: 'app-hero-left-content',
  standalone: true,
  imports: [LinkButtonComponent, ImageComponent],
  templateUrl: './hero-left-content.html',
  styleUrl: './hero-left-content.scss',
})
export class HeroLeftContentComponent {}

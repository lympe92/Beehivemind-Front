import { Component } from '@angular/core';
import {ImageComponent} from '../../ui/image/image';
import {LinkButtonComponent} from '../../ui/link-button/link-button';

@Component({
  selector: 'app-hero-center-content',
  standalone: true,
  imports: [
    ImageComponent,
    LinkButtonComponent
  ],
  templateUrl: './hero-center-content.html',
  styleUrl: './hero-center-content.scss',
})
export class HeroCenterContentComponent {}

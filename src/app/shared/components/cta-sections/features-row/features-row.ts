import { Component } from '@angular/core';
import {LinkButtonComponent} from '../../ui/link-button/link-button';

@Component({
  selector: 'app-features-row',
  standalone: true,
  imports: [
    LinkButtonComponent
  ],
  templateUrl: './features-row.html',
  styleUrl: './features-row.scss',
})
export class FeaturesRowComponent {}

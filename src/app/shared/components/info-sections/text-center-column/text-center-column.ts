import { Component } from '@angular/core';
import {ImageComponent} from '../../ui/image/image';

@Component({
  selector: 'app-text-center-column',
  standalone: true,
  imports: [
    ImageComponent
  ],
  templateUrl: './text-center-column.html',
  styleUrl: './text-center-column.scss',
})
export class TextCenterColumnComponent {}

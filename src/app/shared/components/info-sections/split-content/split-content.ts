import { Component } from '@angular/core';
import {ImageComponent} from '../../ui/image/image';

@Component({
  selector: 'app-split-content',
  standalone: true,
  imports: [
    ImageComponent
  ],
  templateUrl: './split-content.html',
  styleUrl: './split-content.scss',
})
export class SplitContentComponent {}

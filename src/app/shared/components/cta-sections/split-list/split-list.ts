import { Component } from '@angular/core';
import {LinkButtonComponent} from '../../ui/link-button/link-button';
import {ImageComponent} from '../../ui/image/image';

@Component({
  selector: 'app-split-list',
  standalone: true,
  imports: [
    LinkButtonComponent,
    ImageComponent
  ],
  templateUrl: './split-list.html',
  styleUrl: './split-list.scss',
})
export class SplitListComponent {}

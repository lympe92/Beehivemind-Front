import { Component } from '@angular/core';
import {ImageComponent} from '../../ui/image/image';

@Component({
  selector: 'app-application-download',
  standalone: true,
  imports: [
    ImageComponent
  ],
  templateUrl: './application-download.html',
  styleUrl: './application-download.scss',
})
export class ApplicationDownloadComponent {}

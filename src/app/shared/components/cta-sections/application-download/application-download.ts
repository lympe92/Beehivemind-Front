import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';
import { StoreLink } from './application-download.model';

@Component({
  selector: 'app-application-download',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './application-download.html',
  styleUrl: './application-download.scss',
})
export class ApplicationDownloadComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  logo = input.required<ImageConfig>();
  storeLinks = input.required<StoreLink[]>();
}

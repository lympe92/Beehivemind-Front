import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicFooterComponent } from '../footer/public-footer/public-footer';
import { PublicHeaderComponent } from '../header/public-header/public-header';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, PublicFooterComponent, PublicHeaderComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayoutComponent {}

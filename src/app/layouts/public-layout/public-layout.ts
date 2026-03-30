import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {PublicFooterComponent} from '../footer/public-footer/public-footer';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, PublicFooterComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayoutComponent {}

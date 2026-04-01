import { Component, input } from '@angular/core';
import { TextColumn } from './text-columns.model';

@Component({
  selector: 'app-text-columns',
  standalone: true,
  imports: [],
  templateUrl: './text-columns.html',
  styleUrl: './text-columns.scss',
})
export class TextColumnsComponent {
  columns = input.required<TextColumn[]>();
}

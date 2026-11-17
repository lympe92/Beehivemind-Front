import { Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** The marks an empty page can carry: the sidebar's icon for the thing that is missing. */
export type EmptyStateIcon =
  | 'apiary'
  | 'hive'
  | 'inspection'
  | 'feeding'
  | 'harvest'
  | 'treatment'
  | 'cost'
  | 'category'
  | 'todo';

/**
 * What a page shows when it has no records at all: an icon, what belongs
 * here, why it is worth it, and one button. When the page cannot be used yet
 * (no hive to inspect), the caller passes the missing step's icon and words
 * and its button leads there. Purely presentational: the caller decides when
 * the page is empty, and only once its slice has loaded.
 *
 * `framed` draws its own card (a page whose whole list is empty); turn it
 * off where the block sits inside a card that is already on the page.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyStateComponent {
  readonly icon        = input.required<EmptyStateIcon>();
  readonly heading     = input.required<string>();
  readonly text        = input.required<string>();
  /** No label, no button. */
  readonly buttonLabel = input('');
  readonly framed      = input(true);

  readonly buttonClick = output<void>();
}

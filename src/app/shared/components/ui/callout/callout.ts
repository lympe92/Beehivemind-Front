import { Component, input, output } from '@angular/core';

export type CalloutTone = 'accent' | 'neutral' | 'success' | 'warning' | 'error';

/**
 * An in-page notice: a standing condition, not an event. A toast reports what
 * just happened; `AppError` reports a request that failed; a callout is
 * something true about this page that nobody triggered and nothing failed on.
 * `role="status"`, in the page flow. Styles: styles/components/ui/callout.css.
 *
 * ```html
 * <app-callout tone="warning" title="Trial" actionLabel="See the plans" (action)="…">
 *   Your trial ends in five days.
 * </app-callout>
 * ```
 * Pass `dismissable` only for a condition that is optional to know.
 */
@Component({
  selector: 'app-callout',
  standalone: true,
  templateUrl: './callout.html',
})
export class CalloutComponent {
  readonly tone = input<CalloutTone>('accent');
  readonly title = input<string>('');
  readonly actionLabel = input<string>('');
  readonly dismissable = input<boolean>(false);

  readonly action = output<void>();
  readonly dismiss = output<void>();
}

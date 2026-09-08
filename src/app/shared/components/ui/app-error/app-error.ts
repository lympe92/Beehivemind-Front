import { Component, input, output } from '@angular/core';

/**
 * A request that did not come back. Lives inside the card whose data failed,
 * never over the page: a failed panel is one panel, and the rest of the page
 * still works. Ink, not red — a failed request is not the user's mistake.
 * `detail` is a reason in words, never a status code. Without `retry` the
 * button disappears. Styles: `.app-error*` in styles/components/app/app.css.
 */
@Component({
  selector: 'app-error',
  standalone: true,
  templateUrl: './app-error.html',
})
export class AppErrorComponent {
  readonly message = input<string>('Could not load this.');
  readonly detail = input<string>('');
  readonly retryLabel = input<string>('Try again');
  readonly retry = input<boolean>(false);

  readonly retried = output<void>();
}

import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The shell every auth screen sits in: the brand lockup above, the card, and
 * the Terms · Privacy line below. The lockup and the legal line are what make
 * this a website page rather than a third surface. The card's footer is
 * content — write a `<p class="auth-card__footer">` inside the projected body.
 */
@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-card.html',
})
export class AuthCardComponent {
  readonly title = input('');
  readonly subtitle = input('');
}

import { Component } from '@angular/core';
import { CardComponent } from '../../../shared/components/ui/card/card';

/**
 * The admin sidebar has linked here for moderators and above since before
 * this route existed. Nothing has been designed for it: there is no brief for
 * what a moderator moderates. The page says so rather than 404ing.
 */
@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './moderation.html',
})
export class AdminModerationComponent {}

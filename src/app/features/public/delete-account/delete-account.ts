import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';

/**
 * Google Play requires a publicly reachable URL for account deletion from any
 * app that lets people create an account, and it is checked: the page has to
 * name the app, give the steps, and say what is deleted, what is kept and for
 * how long. This is that URL — it is linked from the Play listing's
 * "Delete account URL" field, so the path must not change without updating
 * Play Console.
 *
 * ⚠ One paragraph is marked muted: the backup retention window needs a real
 * value from whoever runs the DigitalOcean backups before this ships.
 */
@Component({
  selector: 'app-delete-account',
  standalone: true,
  imports: [PageIntroComponent, RouterLink],
  templateUrl: './delete-account.html',
})
export class DeleteAccountComponent {}

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
 * The backup figure ("up to 4 weeks") is the longest of the two backups: the
 * droplet's own dumps in /var/backups/mysql (8 days) and DigitalOcean's weekly
 * droplet backups (kept 4 weeks) — see the backend's CLAUDE.md, Deployment.
 * Change either and this page, /privacy and /terms change with it.
 */
@Component({
  selector: 'app-delete-account',
  standalone: true,
  imports: [PageIntroComponent, RouterLink],
  templateUrl: './delete-account.html',
})
export class DeleteAccountComponent {}

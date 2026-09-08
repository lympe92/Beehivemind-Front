import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';

/**
 * ⚠ SKELETON. Every clause is placeholder wording written to establish the
 * structure — the headings, their order, and which promises have to be made
 * where. None of it is legal advice and none of it has been reviewed. A lawyer
 * needs to write the actual text before this ships; the paragraphs in muted
 * grey mark the values that must be real rather than prose.
 *
 * Two clauses are not free choices — they match promises made elsewhere:
 * /pricing says a downgrade never deletes a record and records are exportable
 * on every plan (§4); /privacy says voice audio is processed on the device (§5).
 */
@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [PageIntroComponent, RouterLink],
  templateUrl: './terms.html',
})
export class TermsComponent {}

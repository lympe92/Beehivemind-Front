import { Component, computed, input } from '@angular/core';
import { formatDate } from '@angular/common';
import { RecordAttribution } from '../../../../core/models/team.model';

/**
 * Who added a record — "Added by Maya Lopez · 12 Sep 2026".
 *
 * Detail views only: the edit dialog of an inspection, feeding, harvest or
 * cost, and the treatment session details. Never a table column — a column
 * spends width on the same answer on every row, and "who entered this" is a
 * question about one record, at the moment you are about to change it.
 *
 * The API sends no attribution for a team that has never had an editor, or
 * for a row older than teams, and then this renders nothing. A removed
 * member's name went with their account: "a former team member".
 * Styles: `.rec-meta` in styles/components/app/app.css.
 */
@Component({
  selector: 'app-record-meta',
  standalone: true,
  templateUrl: './record-meta.html',
})
export class RecordMetaComponent {
  readonly attribution = input<RecordAttribution | null | undefined>(null);

  protected readonly line = computed(() => {
    const a = this.attribution();
    if (!a?.at || (!a.name && !a.former)) return null;

    const who = a.former ? 'a former team member' : a.name;
    return `Added by ${who} · ${formatDate(a.at, 'd MMM y', 'en-US')}`;
  });
}

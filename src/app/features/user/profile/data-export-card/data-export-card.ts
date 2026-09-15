import { Component, computed, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { AccountExportSection, ExportFormat, ExportRange } from '../../../../core/services/export.service';

export interface DataExportRequest {
  sections: AccountExportSection[];
  range: ExportRange;
  format: ExportFormat;
}

/**
 * The first four are the four Terms §4 names, in its order and its words; then
 * what the app also holds. If the legal copy changes, this list changes with it.
 *
 * The design's eighth row, Photos, is not here: the app stores no photos, and a
 * checkbox that exports nothing would be a promise with nothing in it. Nor is
 * the hint about photos arriving as a .zip.
 */
const SECTIONS: { key: AccountExportSection; label: string }[] = [
  { key: 'inspections', label: 'Inspections' },
  { key: 'harvest',     label: 'Harvest' },
  { key: 'feeding',     label: 'Feeding' },
  { key: 'costs',       label: 'Costs' },
  { key: 'apiaries',    label: 'Apiaries & beehives' },
  { key: 'treatments',  label: 'Treatments' },
  { key: 'todos',       label: 'To-dos' },
];

const RANGES: { value: ExportRange; label: string }[] = [
  { value: 'all',  label: 'All time' },
  { value: 'year', label: 'This year' },
  { value: '12m',  label: 'Last 12 months' },
];

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'csv',  label: 'CSV — a file per section' },
  { value: 'xlsx', label: 'Excel — a sheet per section' },
];

/**
 * The account-level export the website promises, on Profile directly above
 * Danger zone — it answers the question that card raises: closing an account
 * does not hold your records hostage.
 *
 * Unlike the records pages' menu there is no filter above it to inherit, so it
 * asks what "everything" means: which sections (all checked — the promise is
 * "your data"), which dates, which format. One line of history, not a table:
 * after an export what you check is that it happened.
 */
@Component({
  selector: 'app-data-export-card',
  standalone: true,
  imports: [CardComponent, FormsModule, DatePipe],
  templateUrl: './data-export-card.html',
})
export class DataExportCardComponent {
  /** ISO timestamp of the account's last export, or null. */
  readonly lastExport = input<string | null>(null);
  readonly busy       = input(false);

  readonly exportData = output<DataExportRequest>();

  readonly sections = SECTIONS;
  readonly ranges   = RANGES;
  readonly formats  = FORMATS;

  readonly chosen = signal<AccountExportSection[]>(SECTIONS.map(s => s.key));
  range: ExportRange   = 'all';
  format: ExportFormat = 'csv';

  readonly everything = computed(() => this.chosen().length === SECTIONS.length);

  isChosen(key: AccountExportSection): boolean {
    return this.chosen().includes(key);
  }

  toggle(key: AccountExportSection): void {
    this.chosen.update(list => list.includes(key) ? list.filter(k => k !== key) : [...list, key]);
  }

  toggleAll(): void {
    this.chosen.set(this.everything() ? [] : SECTIONS.map(s => s.key));
  }

  submit(): void {
    this.exportData.emit({ sections: this.chosen(), range: this.range, format: this.format });
  }
}

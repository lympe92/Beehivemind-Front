import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestService } from './request.service';

export type ExportFormat = 'csv' | 'xlsx';

/** The tables a records page can export — the one it is showing. */
export type TableExportSection = 'inspections' | 'feeding' | 'harvest' | 'costs';

export type AccountExportSection = TableExportSection | 'apiaries' | 'treatments' | 'todos';

export type ExportRange = 'all' | 'year' | '12m';

/**
 * The export the website promises (pricing, about, Terms §4). Both entry
 * points answer with the file itself, which is saved straight away: there is
 * no queue and no email step, so the host's toast can say "downloaded".
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  private request    = inject(RequestService);
  private document   = inject(DOCUMENT);
  private isBrowser  = isPlatformBrowser(inject(PLATFORM_ID));

  /** The filter is the scope: the same year of rows the page lists, narrowed the same way. */
  downloadTable(
    section: TableExportSection,
    format: ExportFormat,
    filter: { apiaryId?: number; beehiveId?: number } = {},
  ): Observable<void> {
    const params: Record<string, string | number> = { format };
    if (filter.apiaryId) params['apiary_id'] = filter.apiaryId;
    if (filter.beehiveId) params['beehive_id'] = filter.beehiveId;

    return this.request.getBlobRequest(`export/${section}`, params).pipe(
      map(blob => this.save(blob, `beehivemind-${section}-${this.today()}.${format}`)),
    );
  }

  /** Several CSV sections arrive as a .zip of them; Excel is one workbook with a sheet each. */
  downloadAccount(payload: { sections: AccountExportSection[]; range: ExportRange; format: ExportFormat }): Observable<void> {
    const extension = payload.format === 'xlsx' ? 'xlsx' : payload.sections.length === 1 ? 'csv' : 'zip';
    const name = extension === 'csv'
      ? `beehivemind-${payload.sections[0]}-${this.today()}.csv`
      : `beehivemind-export-${this.today()}.${extension}`;

    return this.request.postBlobRequest('export', payload).pipe(
      map(blob => this.save(blob, name)),
    );
  }

  private save(blob: Blob, fileName: string): void {
    if (!this.isBrowser) return;

    const url  = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    this.document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

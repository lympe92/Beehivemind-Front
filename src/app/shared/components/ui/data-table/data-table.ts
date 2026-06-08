import {
  Component, ContentChild, EventEmitter, Input, Output,
  TemplateRef, ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
}

export interface TablePagination {
  page: number;
  totalPages: number;
  total: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DataTableComponent<T = unknown> {
  @Input({ required: true }) columns: ColumnDef[] = [];
  @Input({ required: true }) rows: T[] = [];
  @Input() editingId: number | null = null;
  @Input() pagination: TablePagination | null = null;
  @Input() loading = false;
  @Input() emptyMessage = 'No records found.';
  @Input() showActions = true;
  @Input() clickableRows = false;

  @ContentChild('cellTpl', { read: TemplateRef }) cellTpl?: TemplateRef<unknown>;
  @ContentChild('editRowTpl', { read: TemplateRef }) editRowTpl?: TemplateRef<unknown>;
  @ContentChild('actionsTpl', { read: TemplateRef }) actionsTpl?: TemplateRef<unknown>;

  @Output() pageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<T>();

  get totalCols(): number {
    return this.columns.length + (this.actionsTpl && this.showActions ? 1 : 0);
  }
}

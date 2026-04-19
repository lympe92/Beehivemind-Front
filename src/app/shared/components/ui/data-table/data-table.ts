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
export class DataTableComponent {
  @Input({ required: true }) columns: ColumnDef[] = [];
  @Input({ required: true }) rows: any[] = [];
  @Input() editingId: number | null = null;
  @Input() pagination: TablePagination | null = null;
  @Input() loading = false;
  @Input() emptyMessage = 'No records found.';
  @Input() showActions = true;
  @Input() clickableRows = false;

  @ContentChild('cellTpl', { read: TemplateRef }) cellTpl?: TemplateRef<any>;
  @ContentChild('editRowTpl', { read: TemplateRef }) editRowTpl?: TemplateRef<any>;
  @ContentChild('actionsTpl', { read: TemplateRef }) actionsTpl?: TemplateRef<any>;

  @Output() pageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<any>();

  get totalCols(): number {
    return this.columns.length + (this.actionsTpl && this.showActions ? 1 : 0);
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { AgendaService } from '../../../../core/services/agenda.service';
import { AgendaItem } from '../../../../core/models/agenda-item.model';
import { TreatmentInstanceService } from '../../../../core/services/treatment-instance.service';
import { NotificationsActions } from '../../../../store/notifications/notifications.actions';

interface DateGroup {
  label: string;
  date:  string;
  items: AgendaItem[];
}

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './todo-list.html',
  styleUrl: './todo-list.scss',
})
export class TodoListComponent implements OnInit {
  private agendaService    = inject(AgendaService);
  private instanceService  = inject(TreatmentInstanceService);
  private store            = inject(Store);
  private sanitizer        = inject(DomSanitizer);

  items    = signal<AgendaItem[]>([]);
  loading  = signal(true);
  doneIds  = signal<Set<number>>(new Set());

  overdue = computed(() => this.items().filter(i => i.isOverdue && !this.doneIds().has(i.entityId)));

  upcoming = computed<DateGroup[]>(() => {
    const grouped = new Map<string, AgendaItem[]>();

    for (const item of this.items()) {
      if (item.isOverdue || this.doneIds().has(item.entityId)) continue;
      const existing = grouped.get(item.scheduledDate) ?? [];
      existing.push(item);
      grouped.set(item.scheduledDate, existing);
    }

    return Array.from(grouped.entries()).map(([date, items]) => ({
      label: this.formatDateLabel(date),
      date,
      items,
    }));
  });

  ngOnInit(): void {
    this.agendaService.getAll().subscribe({
      next:     items => { this.items.set(items); this.loading.set(false); },
      error:    ()    => this.loading.set(false),
    });
  }

  markDone(item: AgendaItem): void {
    if (item.entityType !== 'treatment_instance') return;

    this.instanceService.update(item.entityId, { status: 'done' }).subscribe({
      next: () => {
        this.doneIds.update(s => new Set([...s, item.entityId]));
        this.store.dispatch(NotificationsActions.reload());
      },
    });
  }

  typeIcon(type: string): SafeHtml {
    const svg = type === 'treatment'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  private formatDateLabel(date: string): string {
    const today    = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const d    = new Date(date + 'T00:00:00');
    const toS  = (d: Date) => d.toISOString().slice(0, 10);

    if (toS(d) === toS(today))    return 'Today';
    if (toS(d) === toS(tomorrow)) return 'Tomorrow';

    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}
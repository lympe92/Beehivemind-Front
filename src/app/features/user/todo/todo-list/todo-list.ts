import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AgendaService } from '../../../../core/services/agenda.service';
import { AgendaItem } from '../../../../core/models/agenda-item.model';
import { TreatmentInstanceService } from '../../../../core/services/treatment-instance.service';
import { NotificationsActions } from '../../../../store/notifications/notifications.actions';
import { TreatmentSessionsActions } from '../../../../store/treatment-sessions/treatment-sessions.actions';
import { ApiariesActions } from '../../../../store/apiaries/apiaries.actions';
import { selectAllApiaries } from '../../../../store/apiaries/apiaries.selectors';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';

/**
 * The agenda as the design system draws its to-do list: one flat list of
 * pending items, a checkbox on each, the apiary as a badge and the date at
 * the end, with the items ticked this session collected under "Done".
 * Items come from treatments and inspections, so there is no composer: a
 * to-do is created by scheduling something, not by typing it here.
 */
@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [DatePipe, CardComponent, EmptyStateComponent],
  templateUrl: './todo-list.html',
  styleUrl: './todo-list.scss',
})
export class TodoListComponent implements OnInit {
  private agendaService   = inject(AgendaService);
  private instanceService = inject(TreatmentInstanceService);
  private store           = inject(Store);
  private router          = inject(Router);

  private apiaries = this.store.selectSignal(selectAllApiaries);

  items   = signal<AgendaItem[]>([]);
  loading = signal(true);
  /** The agenda answered; a failed request keeps the old one-line state, not the empty page. */
  loaded  = signal(false);
  doneIds = signal<Set<number>>(new Set());

  readonly pending = computed(() =>
    this.items()
      .filter(i => !this.doneIds().has(i.entityId))
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
  );

  readonly done = computed(() => this.items().filter(i => this.doneIds().has(i.entityId)));

  /** Nothing on the agenda at all: the page says where its entries come from. */
  readonly isEmpty = computed(() => this.loaded() && this.items().length === 0);

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.agendaService.getAll().subscribe({
      next:  items => { this.items.set(items); this.loaded.set(true); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
  }

  /** The page has no add button of its own: its entries come from treatment sessions. */
  goToTreatments(): void {
    this.router.navigate(['/user/treatments']);
  }

  /** Only a treatment dose can be ticked off here; an inspection is recorded, not checked. */
  completable(item: AgendaItem): boolean {
    return item.entityType === 'treatment_instance';
  }

  apiaryName(item: AgendaItem): string | null {
    if (item.apiaryId == null) return null;
    return this.apiaries().find(a => a.id === item.apiaryId)?.name ?? null;
  }

  toggle(item: AgendaItem): void {
    if (!this.completable(item)) return;
    if (this.doneIds().has(item.entityId)) return;

    this.instanceService.update(item.entityId, { status: 'done' }).subscribe({
      next: () => {
        this.doneIds.update(s => new Set([...s, item.entityId]));
        this.store.dispatch(NotificationsActions.reload());
        // A session's doses-done count lives in its slice: Treatment Sessions
        // (and the guide's "Tick a dose" step) would otherwise not see the tick.
        this.store.dispatch(TreatmentSessionsActions.reload());
      },
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Apiary } from '../../../core/models/apiary.model';
import { ApiaryService } from '../../../core/services/apiary.service';
import { AgendaService } from '../../../core/services/agenda.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries, selectApiariesLoading } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { ApiaryFormModalComponent } from '../../../shared/components/ui/modal/apiary-form-modal/apiary-form-modal';

@Component({
  selector: 'app-apiary-details',
  standalone: true,
  imports: [DatePipe, RouterLink, CardComponent],
  templateUrl: './apiary-details.html',
  styleUrl: './apiary-details.scss',
})
export class ApiaryDetailsComponent implements OnInit {
  private store        = inject(Store);
  private apiaryService = inject(ApiaryService);
  private agendaService = inject(AgendaService);
  private toast        = inject(ToastService);
  private modal        = inject(ModalService);

  readonly apiaries = this.store.selectSignal(selectAllApiaries);
  readonly loading  = this.store.selectSignal(selectApiariesLoading);
  todosMap          = signal<Record<number, number>>({});

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.agendaService.getAll().subscribe(items => {
      const map: Record<number, number> = {};
      for (const item of items) {
        if (item.apiaryId == null) continue;
        map[item.apiaryId] = (map[item.apiaryId] ?? 0) + 1;
      }
      this.todosMap.set(map);
    });
  }

  async startAdd(): Promise<void> {
    const existingNames = this.apiaries().map(a => a.name);

    const value = await this.modal.open<any>(ApiaryFormModalComponent, {
      type: 'center',
      width: '640px',
      data: {},
    });

    if (!value) return;

    if (existingNames.includes(value.name.trim())) {
      this.toast.warning(`An apiary named "${value.name.trim()}" already exists.`);
      return;
    }

    this.apiaryService.createApiary({
      name: value.name.trim(),
      hivesNumber: Number(value.hivesNumber) || 0,
      latitude: value.latitude,
      longitude: value.longitude,
      location: value.location || null,
      dateEstablished: value.dateEstablished || null,
    }).subscribe({
      next: res => {
        if (res.success) {
          this.reload();
          this.toast.success('Apiary created.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  async startEdit(apiary: Apiary): Promise<void> {
    const value = await this.modal.open<any>(ApiaryFormModalComponent, {
      type: 'center',
      width: '640px',
      data: { apiary },
    });

    if (!value) return;

    this.apiaryService.updateApiary(apiary.id, {
      name: value.name.trim(),
      hivesNumber: Number(value.hivesNumber) || 0,
      latitude: value.latitude,
      longitude: value.longitude,
      location: value.location || null,
      dateEstablished: value.dateEstablished || null,
    }).subscribe({
      next: res => {
        if (res.success) {
          this.reload();
          this.toast.success('Apiary updated.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  async deleteApiary(apiary: Apiary): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete Apiary',
      message: `Delete "${apiary.name}"? All beehive data will be lost.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.apiaryService.deleteApiary(apiary.id).subscribe({
      next: res => {
        if (res.success) {
          this.reload();
          this.toast.success('Apiary deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  private reload(): void {
    this.store.dispatch(ApiariesActions.reload());
    this.store.dispatch(BeehivesActions.reload());
  }
}

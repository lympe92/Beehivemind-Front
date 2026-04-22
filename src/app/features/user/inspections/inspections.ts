import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { Inspection } from '../../../core/models/inspection.model';
import { InspectionService } from '../../../core/services/inspection.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { selectAllBeehives } from '../../../store/beehives/beehives.selectors';
import { InspectionsActions } from '../../../store/inspections/inspections.actions';
import { selectAllInspections, selectInspectionsLoading } from '../../../store/inspections/inspections.selectors';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { FilterBarComponent } from '../../../shared/components/ui/filter-bar/filter-bar';
import { FormModalComponent } from '../../../shared/components/ui/modal/form-modal/form-modal';
import { syncValidators } from '../../../shared/components/ui/form/validators.config';
import { DynamicField } from '../../../core/models/form.model';

@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [DataTableComponent, CardComponent, FilterBarComponent],
  templateUrl: './inspections.html',
  styleUrl: './inspections.scss',
})
export class InspectionsComponent implements OnInit {
  private store = inject(Store);
  private inspectionService = inject(InspectionService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  readonly columns: ColumnDef[] = [
    { key: 'date', label: 'Date' },
    { key: 'frame_space', label: 'Frames' },
    { key: 'population', label: 'Population' },
    { key: 'pollen', label: 'Pollen' },
    { key: 'honey', label: 'Honey' },
    { key: 'opened_brood', label: 'Egg' },
    { key: 'closed_brood', label: 'Closed Brood' },
    { key: 'varroa', label: 'Varroa' },
    { key: 'american_foulbrood', label: 'AFB' },
    { key: 'european_foulbrood', label: 'EFB' },
    { key: 'nosema', label: 'Nosema' },
    { key: 'queen_exists', label: 'Queen Seen' },
    { key: 'queen_cells', label: 'Queen Cells' },
    { key: 'queen_year', label: 'Queen Year' },
  ];

  apiaries = this.store.selectSignal(selectAllApiaries);
  private allBeehives = this.store.selectSignal(selectAllBeehives);
  private allInspections = this.store.selectSignal(selectAllInspections);
  loading = this.store.selectSignal(selectInspectionsLoading);

  beehives = computed(() =>
    this.allBeehives().filter(b => b.apiaryId === this.selectedApiaryId())
  );

  inspections = computed(() => {
    const all = this.allInspections();
    const beehiveId = this.selectedBeehiveId();
    const apiaryId = this.selectedApiaryId();

    if (beehiveId !== 0) return all.filter(r => r.beehiveId === beehiveId);
    if (apiaryId !== 0) {
      const ids = new Set(this.allBeehives().filter(b => b.apiaryId === apiaryId).map(b => b.id));
      return all.filter(r => ids.has(r.beehiveId));
    }
    return all;
  });

  selectedApiaryId = signal<number>(0);
  selectedBeehiveId = signal<number>(0);

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
    this.store.dispatch(InspectionsActions.load());
  }

  // ── Filter handlers ──────────────────────────────────────

  onApiaryChange(apiaryId: number): void {
    this.selectedApiaryId.set(apiaryId);
    this.selectedBeehiveId.set(0);
  }

  onBeehiveChange(beehiveId: number): void {
    this.selectedBeehiveId.set(beehiveId);
  }

  // ── Add ──────────────────────────────────────────────────

  async startAdd(): Promise<void> {
    const apiaries = this.apiaries();
    const allBeehives = this.allBeehives();

    const value = await this.modal.open<any>(FormModalComponent, {
      type: 'center',
      width: '640px',
      data: {
        title: 'Add Inspection',
        fields: [
          {
            name: 'apiary_id',
            type: 'select',
            label: 'Apiary',
            size: 'half',
            value: this.selectedApiaryId() || null,
            syncValidators: [syncValidators.required()],
            options: of(apiaries.map(a => ({ displayValue: a.name, returnValue: a.id }))),
          },
          {
            name: 'beehive_id',
            type: 'select',
            label: 'Beehive',
            size: 'half',
            value: this.selectedBeehiveId() || null,
            syncValidators: [syncValidators.required()],
            cascadeFrom: 'apiary_id',
            options: (apiaryId: number) => of(
              allBeehives
                .filter(b => b.apiaryId === apiaryId)
                .map(b => ({ displayValue: b.name, returnValue: b.id })),
            ),
          },
          ...this.inspectionBaseFields(),
        ] as DynamicField[],
      },
    });

    if (!value) return;

    const beehiveId = Number(value.beehive_id);
    const duplicate = this.allInspections().some(
      i => i.beehiveId === beehiveId && i.date === value.date
    );
    if (duplicate) {
      const beehiveName = allBeehives.find(b => b.id === beehiveId)?.name ?? '';
      this.toast.warning(`A record for ${value.date} on beehive "${beehiveName}" already exists.`);
      return;
    }

    this.inspectionService.createInspection(this.toPayload(value, beehiveId)).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(InspectionsActions.reload());
          this.toast.success('Record created successfully.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Edit ─────────────────────────────────────────────────

  async startEdit(row: Inspection): Promise<void> {
    const value = await this.modal.open<any>(FormModalComponent, {
      type: 'center',
      width: '640px',
      data: {
        title: 'Edit Inspection',
        fields: this.inspectionBaseFields(row),
      },
    });
    if (!value) return;

    const { beehive_id, ...payload } = this.toPayload(value, row.beehiveId);
    this.inspectionService.updateInspection(row.id, payload).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(InspectionsActions.reload());
          this.toast.success('Record updated successfully.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Delete ───────────────────────────────────────────────

  async deleteRow(row: Inspection): Promise<void> {
    const beehiveName = this.allBeehives().find(b => b.id === row.beehiveId)?.name ?? '';
    const confirmed = await this.modal.confirm({
      title: 'Delete Record',
      message: `Delete inspection for beehive "${beehiveName}" on ${row.date}?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.inspectionService.deleteInspection(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(InspectionsActions.reload());
          this.toast.success('Record deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Private ──────────────────────────────────────────────

  private inspectionBaseFields(row?: Inspection): DynamicField[] {
    return [
      {
        name: 'date',
        type: 'date',
        label: 'Date',
        size: 'half',
        value: row?.date ?? new Date().toISOString().split('T')[0],
        syncValidators: [syncValidators.required()],
      },
      {
        name: 'frame_space',
        type: 'number',
        label: 'Frames',
        size: 'third',
        value: row?.frame_space ?? null,
        syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9999 })],
      },
      {
        name: 'population',
        type: 'number',
        label: 'Population',
        size: 'third',
        value: row?.population ?? null,
        syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9999 })],
      },
      {
        name: 'pollen',
        type: 'number',
        label: 'Pollen',
        size: 'third',
        value: row?.pollen ?? null,
        syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9999 })],
      },
      {
        name: 'honey',
        type: 'number',
        label: 'Honey',
        size: 'third',
        value: row?.honey ?? null,
        syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9999 })],
      },
      {
        name: 'opened_brood',
        type: 'number',
        label: 'Egg',
        size: 'third',
        value: row?.opened_brood ?? null,
        syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9999 })],
      },
      {
        name: 'closed_brood',
        type: 'number',
        label: 'Closed Brood',
        size: 'third',
        value: row?.closed_brood ?? null,
        syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9999 })],
      },
      { name: 'varroa', type: 'toggle', label: 'Varroa', size: 'half', value: !!row?.varroa },
      { name: 'american_foulbrood', type: 'toggle', label: 'Amer. Foulbrood', size: 'half', value: !!row?.american_foulbrood },
      { name: 'european_foulbrood', type: 'toggle', label: 'Eur. Foulbrood', size: 'half', value: !!row?.european_foulbrood },
      { name: 'nosema', type: 'toggle', label: 'Nosema', size: 'half', value: !!row?.nosema },
      { name: 'queen_exists', type: 'toggle', label: 'Queen Seen', size: 'half', value: row ? !!row.queen_exists : true },
      { name: 'queen_cells', type: 'toggle', label: 'Queen Cells', size: 'half', value: !!row?.queen_cells },
      {
        name: 'queen_year',
        type: 'number',
        label: 'Queen Year',
        size: 'half',
        value: row?.queen_year ?? null,
        syncValidators: [syncValidators.rangeNumber({ min: 2000, max: 2100 })],
      },
    ];
  }

  private toPayload(value: any, beehiveId: number) {
    return {
      beehive_id: beehiveId,
      date: value.date,
      frame_space: Number(value.frame_space) || 0,
      population: Number(value.population) || 0,
      pollen: Number(value.pollen) || 0,
      honey: Number(value.honey) || 0,
      opened_brood: Number(value.opened_brood) || 0,
      closed_brood: Number(value.closed_brood) || 0,
      varroa: value.varroa ? 1 : 0,
      american_foulbrood: value.american_foulbrood ? 1 : 0,
      european_foulbrood: value.european_foulbrood ? 1 : 0,
      nosema: value.nosema ? 1 : 0,
      queen_exists: value.queen_exists ? 1 : 0,
      queen_cells: value.queen_cells ? 1 : 0,
      queen_year: value.queen_year ? Number(value.queen_year) : null,
    } as const;
  }
}

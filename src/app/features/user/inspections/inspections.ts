import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import {
  AddInspectionModalComponent,
  AddInspectionModalData,
  AddInspectionModalResult,
} from '../../../shared/components/ui/modal/add-inspection-modal/add-inspection-modal';

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
    const result = await this.modal.open<AddInspectionModalResult, AddInspectionModalData>(
      AddInspectionModalComponent,
      {
        type: 'center',
        width: '640px',
        data: {
          apiaries: this.apiaries(),
          allBeehives: this.allBeehives(),
          preselectedApiaryId: this.selectedApiaryId(),
          preselectedBeehiveId: this.selectedBeehiveId(),
        },
      },
    );

    if (!result) return;

    const duplicate = this.allInspections().some(
      i => i.beehiveId === result.beehive_id && i.date === result.date
    );
    if (duplicate) {
      const beehiveName = this.allBeehives().find(b => b.id === result.beehive_id)?.name ?? '';
      this.toast.warning(`A record for ${result.date} on beehive "${beehiveName}" already exists.`);
      return;
    }

    this.inspectionService.createInspection(result).subscribe({
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
    const result = await this.modal.open<AddInspectionModalResult, AddInspectionModalData>(
      AddInspectionModalComponent,
      {
        type: 'center',
        width: '640px',
        data: {
          apiaries: this.apiaries(),
          allBeehives: this.allBeehives(),
          preselectedApiaryId: 0,
          preselectedBeehiveId: 0,
          editRow: row,
        },
      },
    );
    if (!result) return;

    const { beehive_id, ...payload } = result;
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
}

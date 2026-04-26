import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { Store } from '@ngrx/store';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { TreatmentType } from '../../../../../core/models/treatment-type.model';
import { Apiary } from '../../../../../core/models/apiary.model';
import { Beehive } from '../../../../../core/models/beehive.model';
import { selectAllApiaries } from '../../../../../store/apiaries/apiaries.selectors';
import { selectAllBeehives } from '../../../../../store/beehives/beehives.selectors';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface TreatmentSessionModalData {
  types: TreatmentType[];
  preselectedTypeId?: number;
}

export interface TreatmentSessionModalResult {
  treatmentTypeId: number;
  apiaryId: number | null;
  startDate: string;
  beehiveIds: number[];
  notes: string | null;
}

@Component({
  selector: 'app-treatment-session-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalShellComponent],
  templateUrl: './treatment-session-modal.html',
  styleUrl: './treatment-session-modal.scss',
})
export class TreatmentSessionModalComponent implements OnInit {
  private dialogRef = inject(DialogRef<TreatmentSessionModalResult>);
  readonly data     = inject<TreatmentSessionModalData>(MODAL_DATA);
  private store     = inject(Store);

  readonly apiaries = this.store.selectSignal(selectAllApiaries);
  readonly allBeehives = this.store.selectSignal(selectAllBeehives);

  readonly selectedApiaryId = signal<number | 'all'>('all');
  readonly checkedBeehiveIds = signal<Set<number>>(new Set());

  readonly filteredBeehives = computed<Beehive[]>(() => {
    const aid = this.selectedApiaryId();
    return aid === 'all'
      ? this.allBeehives()
      : this.allBeehives().filter(b => b.apiaryId === aid);
  });

  form = new FormGroup({
    treatmentTypeId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    startDate:       new FormControl('', { validators: [Validators.required], nonNullable: true }),
    notes:           new FormControl<string>('', { nonNullable: true }),
  });

  get selectedType(): TreatmentType | null {
    const id = this.form.controls.treatmentTypeId.value;
    return this.data.types.find(t => t.id === id) ?? null;
  }

  ngOnInit(): void {
    if (this.data.preselectedTypeId) {
      this.form.patchValue({ treatmentTypeId: this.data.preselectedTypeId });
    }
    this.selectAllBeehivesInView();
  }

  onApiaryChange(value: string): void {
    this.selectedApiaryId.set(value === 'all' ? 'all' : Number(value));
    this.selectAllBeehivesInView();
  }

  private selectAllBeehivesInView(): void {
    const ids = new Set(this.filteredBeehives().map(b => b.id));
    this.checkedBeehiveIds.set(ids);
  }

  toggleBeehive(id: number, checked: boolean): void {
    const s = new Set(this.checkedBeehiveIds());
    checked ? s.add(id) : s.delete(id);
    this.checkedBeehiveIds.set(s);
  }

  isChecked(id: number): boolean {
    return this.checkedBeehiveIds().has(id);
  }

  get allChecked(): boolean {
    const filtered = this.filteredBeehives();
    return filtered.length > 0 && filtered.every(b => this.isChecked(b.id));
  }

  toggleAll(checked: boolean): void {
    const s = new Set(this.checkedBeehiveIds());
    this.filteredBeehives().forEach(b => checked ? s.add(b.id) : s.delete(b.id));
    this.checkedBeehiveIds.set(s);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.checkedBeehiveIds().size === 0) return;

    const v = this.form.getRawValue();
    const aid = this.selectedApiaryId();

    this.dialogRef.close({
      treatmentTypeId: v.treatmentTypeId!,
      apiaryId:        aid === 'all' ? null : aid,
      startDate:       v.startDate,
      beehiveIds:      Array.from(this.checkedBeehiveIds()),
      notes:           v.notes?.trim() || null,
    });
  }

  close(): void { this.dialogRef.close(); }
}

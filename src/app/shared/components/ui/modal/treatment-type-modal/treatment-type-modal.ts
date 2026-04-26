import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { TreatmentType } from '../../../../../core/models/treatment-type.model';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface TreatmentTypeModalData {
  type?: TreatmentType;
}

export interface TreatmentTypeModalResult {
  name: string;
  disease: string;
  product: string;
  dose: string | null;
  notes: string | null;
  intervalDays: number | null;
  repetitions: number | null;
}

export const DISEASE_OPTIONS = [
  { value: 'varroa',     label: 'Varroa' },
  { value: 'nosema',     label: 'Nosema' },
  { value: 'foulbrood',  label: 'Foulbrood' },
  { value: 'chalkbrood', label: 'Chalkbrood' },
  { value: 'other',      label: 'Other' },
];

@Component({
  selector: 'app-treatment-type-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalShellComponent],
  templateUrl: './treatment-type-modal.html',
  styleUrl: './treatment-type-modal.scss',
})
export class TreatmentTypeModalComponent implements OnInit {
  private dialogRef = inject(DialogRef<TreatmentTypeModalResult>);
  readonly data     = inject<TreatmentTypeModalData>(MODAL_DATA);

  readonly diseases = DISEASE_OPTIONS;

  form = new FormGroup({
    name:         new FormControl('', { validators: [Validators.required, Validators.maxLength(100)], nonNullable: true }),
    disease:      new FormControl('', { validators: [Validators.required], nonNullable: true }),
    product:      new FormControl('', { validators: [Validators.required, Validators.maxLength(100)], nonNullable: true }),
    dose:         new FormControl<string>('', { nonNullable: true }),
    notes:        new FormControl<string>('', { nonNullable: true }),
    isRecurring:  new FormControl(false, { nonNullable: true }),
    intervalDays: new FormControl<number | null>(null),
    repetitions:  new FormControl<number | null>(null),
  });

  get isEdit(): boolean { return !!this.data.type; }
  get title(): string   { return this.isEdit ? 'Edit Treatment Type' : 'New Treatment Type'; }
  get recurring(): boolean { return this.form.controls.isRecurring.value; }

  ngOnInit(): void {
    const t = this.data.type;
    if (t) {
      this.form.patchValue({
        name:         t.name,
        disease:      t.disease,
        product:      t.product,
        dose:         t.dose ?? '',
        notes:        t.notes ?? '',
        isRecurring:  t.isRecurring,
        intervalDays: t.intervalDays,
        repetitions:  t.repetitions,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.getRawValue();
    this.dialogRef.close({
      name:         v.name.trim(),
      disease:      v.disease,
      product:      v.product.trim(),
      dose:         v.dose?.trim() || null,
      notes:        v.notes?.trim() || null,
      intervalDays: v.isRecurring ? (v.intervalDays ?? null) : null,
      repetitions:  v.isRecurring ? (v.repetitions ?? null) : null,
    });
  }

  close(): void { this.dialogRef.close(); }
}
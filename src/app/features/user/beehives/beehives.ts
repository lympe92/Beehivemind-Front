import { afterNextRender, Component, computed, inject, Injector, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Beehive, beehiveLabel } from '../../../core/models/beehive.model';
import { BeehiveService } from '../../../core/services/beehive.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries, selectApiariesLoaded } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { selectAllBeehives, selectBeehivesLoaded, selectBeehivesLoading } from '../../../store/beehives/beehives.selectors';
import { FilterBarComponent } from '../../../shared/components/ui/filter-bar/filter-bar';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { EmptyStateComponent } from '../../../shared/components/ui/empty-state/empty-state';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { QrCodeModalComponent, QrCodeModalData } from '../../../shared/components/ui/modal/qr-code-modal/qr-code-modal';
import {
  DeleteBeehiveModalComponent,
  DeleteBeehiveModalData,
  DeleteBeehiveResult,
} from '../../../shared/components/ui/modal/delete-beehive-modal/delete-beehive-modal';
import { DeepLink, onDeepLink } from '../../../core/onboarding/deep-link';

interface BeehiveForm {
  number: number | null;
  queen_year: number | null;
}

@Component({
  selector: 'app-beehives',
  standalone: true,
  imports: [FormsModule, FilterBarComponent, DataTableComponent, CardComponent, EmptyStateComponent],
  templateUrl: './beehives.html',
})
export class BeehivesComponent implements OnInit {
  private store = inject(Store);
  private beehiveService = inject(BeehiveService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);
  private router = inject(Router);
  private injector = inject(Injector);

  apiaries = this.store.selectSignal(selectAllApiaries);
  private allBeehives = this.store.selectSignal(selectAllBeehives);
  loading = this.store.selectSignal(selectBeehivesLoading);
  private apiariesLoaded = this.store.selectSignal(selectApiariesLoaded);
  private beehivesLoaded = this.store.selectSignal(selectBeehivesLoaded);

  /**
   * The team has no hive at all (a filter that matches none keeps the table's
   * line): 'none' invites the first one, 'no-apiary' sends to Apiaries first.
   * Null while either slice is still loading, or when there are hives.
   */
  readonly emptyState = computed<'none' | 'no-apiary' | null>(() => {
    if (!this.beehivesLoaded() || this.allBeehives().length > 0 || !this.apiariesLoaded()) return null;
    return this.apiaries().length === 0 ? 'no-apiary' : 'none';
  });

  selectedApiaryId = signal<number>(0);

  beehives = computed(() => {
    const id = this.selectedApiaryId();
    return id === 0
      ? this.allBeehives()
      : this.allBeehives().filter(b => b.apiaryId === id);
  });

  /** All apiaries at once: "Beehive 1" alone no longer says which one, so the apiary gets a column. */
  columns = computed<ColumnDef[]>(() => [
    { key: 'number', label: 'Beehive' },
    ...(this.selectedApiaryId() === 0 ? [{ key: 'apiary', label: 'Apiary' }] : []),
    { key: 'queen_year', label: 'Queen Year' },
  ]);

  readonly label = beehiveLabel;

  beehivesToCreate: number | null = null;
  editingId: number | null = null;
  editForm: BeehiveForm = this.blank();
  /** The API's refusal of the number (422: already taken in this apiary). */
  numberRefusal = signal<string | null>(null);

  /**
   * `?add=1&apiary=ID` (the guide's "Add a hive"). The page has no add
   * dialog: the apiary is chosen in the filter (the one named, or the first)
   * and the count field waits with 1 in it, which fits every plan.
   */
  private readonly addLink = onDeepLink(['add', 'apiary'], () => this.apiariesLoaded(), link => this.prepareAdd(link));

  private prepareAdd(link: DeepLink): void {
    const apiaries = this.apiaries();
    const named = apiaries.find(a => a.id === Number(link['apiary']));
    const apiary = named ?? apiaries[0];
    if (!apiary) return;
    this.onApiaryChange(apiary.id);
    this.beehivesToCreate = 1;
    afterNextRender(() => {
      const field = document.getElementById('bh-count') as HTMLInputElement | null;
      field?.focus();
      field?.select();
    }, { injector: this.injector });
  }

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
  }

  // ── Apiary filter ─────────────────────────────────────────

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  /**
   * The empty page's button. The page has no add dialog: a count is created
   * in the chosen apiary. With one apiary there is nothing to choose, so it is
   * chosen; with several and none chosen, addBeehives asks for one.
   */
  addFirstHive(): void {
    if (this.selectedApiaryId() === 0 && this.apiaries().length === 1) {
      this.selectedApiaryId.set(this.apiaries()[0].id);
    }
    this.beehivesToCreate = 1;
    this.addBeehives();
  }

  onApiaryChange(apiaryId: number): void {
    this.selectedApiaryId.set(apiaryId);
    this.cancelEdit();
    this.beehivesToCreate = null;
  }

  // ── Bulk create ──────────────────────────────────────────

  addBeehives(): void {
    const apiaryId = this.selectedApiaryId();
    if (apiaryId === 0) {
      this.toast.error('Select an apiary first.');
      return;
    }
    const count = Number(this.beehivesToCreate);
    if (!count || count < 1 || !Number.isInteger(count)) {
      this.toast.error('Enter a valid number of beehives to create (≥ 1).');
      return;
    }

    this.beehiveService.createBeehives(apiaryId, count).subscribe({
      next: res => {
        if (res.success) {
          this.beehivesToCreate = null;
          this.store.dispatch(BeehivesActions.reload());
          this.toast.success(`${count} beehive(s) created.`);
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }

  // ── Edit ─────────────────────────────────────────────────

  startEdit(row: Beehive): void {
    this.editingId = row.id;
    this.editForm = { number: row.number, queen_year: row.queen?.year ?? null };
    this.numberRefusal.set(null);
  }

  cancelEdit(): void {
    this.editingId = null;
    this.numberRefusal.set(null);
  }

  /** What is wrong with the number being typed, shown under the field; null when it is fine. */
  numberError(): string | null {
    const value = this.editForm.number;
    if (value === null || value === undefined || String(value).trim() === '') return 'Enter the beehive number.';
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) return 'The number is a whole number, 1 or more.';
    return this.numberRefusal();
  }

  onNumberInput(value: number | null): void {
    this.editForm.number = value;
    this.numberRefusal.set(null);
  }

  apiaryName(apiaryId: number): string {
    return this.apiaries().find(a => a.id === apiaryId)?.name ?? '—';
  }

  confirmEdit(): void {
    if (this.editingId === null) return;
    if (this.numberError()) return;
    if (this.editForm.queen_year !== null && this.editForm.queen_year !== undefined) {
      const yr = Number(this.editForm.queen_year);
      if (isNaN(yr) || yr < 2000) {
        this.toast.error('Queen year must be ≥ 2000, or leave it empty.');
        return;
      }
    }

    const payload: Partial<Beehive> = {
      number: Number(this.editForm.number),
      queen: this.editForm.queen_year ? { year: Number(this.editForm.queen_year) } : null,
    };

    this.beehiveService.updateBeehive(this.editingId, payload).subscribe({
      next: res => {
        if (res.success) {
          this.editingId = null;
          this.store.dispatch(BeehivesActions.reload());
          this.toast.success('Beehive updated.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      // 422 is the only status the interceptor leaves to this row: the number is taken.
      error: err => {
        if (err?.status === 422) {
          this.numberRefusal.set(err.error?.message ?? 'That number is already taken in this apiary.');
        }
      },
    });
  }

  // ── QR Code ──────────────────────────────────────────────

  showQr(beehive: Beehive): void {
    const apiary = this.apiaries().find(a => a.id === beehive.apiaryId);
    this.modal.open<void>(QrCodeModalComponent, {
      type: 'center',
      data: {
        value: beehive.uuid,
        title: beehiveLabel(beehive),
        subtitle: apiary?.name,
        downloadName: `beehive-${beehive.uuid}`,
      } satisfies QrCodeModalData,
    });
  }

  // ── Delete ───────────────────────────────────────────────

  async deleteRow(row: Beehive): Promise<void> {
    const answer = await this.modal.open<DeleteBeehiveResult>(DeleteBeehiveModalComponent, {
      type: 'center',
      width: '460px',
      data: {
        label: beehiveLabel(row),
        hasQueen: !!row.queen,
        // Every other hive, in any apiary — so each one says where it stands.
        targets: this.allBeehives()
          .filter(b => b.id !== row.id)
          .map(b => ({ id: b.id, label: `${beehiveLabel(b)} · ${this.apiaryName(b.apiaryId)}` })),
      } satisfies DeleteBeehiveModalData,
    });
    if (!answer) return;

    this.destroy(row, {
      queen_fate: answer.queenFate,
      ...(answer.targetBeehiveId !== undefined && { target_beehive_id: answer.targetBeehiveId }),
    });
  }

  /**
   * The one case the dialog cannot answer in advance: the hive the queen moves
   * to already has one. The API refuses with a 409 rather than replacing her
   * silently, so the choice goes back to the beekeeper.
   */
  private destroy(
    row: Beehive,
    queen: { queen_fate: 'lost' | 'moved'; target_beehive_id?: number; force_replace_queen?: boolean },
  ): void {
    this.beehiveService.deleteBeehive(row.id, queen).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(BeehivesActions.reload());
          this.toast.success('Beehive deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: async err => {
        if (err?.status !== 409 || queen.force_replace_queen) return;

        const replace = await this.modal.confirm({
          title: 'That beehive already has a queen',
          message: 'Moving this queen there replaces the one living in it. The replaced queen is removed from your records.',
          confirmLabel: 'Replace her',
          danger: true,
        });
        if (replace) this.destroy(row, { ...queen, force_replace_queen: true });
      },
    });
  }

  private blank(): BeehiveForm {
    return { number: null, queen_year: null };
  }
}

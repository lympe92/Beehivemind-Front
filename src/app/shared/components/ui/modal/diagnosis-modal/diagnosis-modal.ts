import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { DialogRef } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { selectAllBeehives } from '../../../../../store/beehives/beehives.selectors';
import { beehiveLabel } from '../../../../../core/models/beehive.model';
import { selectAllApiaries } from '../../../../../store/apiaries/apiaries.selectors';
import { DiagnosisService } from '../../../../../core/services/diagnosis.service';
import { AiAssistantStatusService } from '../../../../../core/services/ai-assistant-status.service';
import {
  ActionUrgency,
  Diagnosis,
  RiskSeverity,
  urgencyLabel,
} from '../../../../../core/models/diagnosis.model';
import { ModalShellComponent } from '../modal-shell/modal-shell';
import { DiagnosisBadgeComponent } from '../../diagnosis-badge/diagnosis-badge';
import { ToastService } from '../../toast/toast.service';

/**
 * Open it for an inspection (`recordId`) or for a hive's current diagnosis
 * (`beehiveId`). The header is the same from every entry point — "Beehive 12
 * · North Field", the inspection's date under it — named by the dialog
 * itself from the stores and the diagnosis, so callers pass no title; a
 * `beehiveId` beside a `recordId` only names the hive while it loads. Closes
 * with nothing — it is read-only apart from the beekeeper's "helpful / not
 * helpful" on it.
 */
export interface DiagnosisModalData {
  recordId?: number;
  beehiveId?: number;
}

@Component({
  selector: 'app-diagnosis-modal',
  standalone: true,
  imports: [DatePipe, ModalShellComponent, DiagnosisBadgeComponent],
  templateUrl: './diagnosis-modal.html',
  styleUrl: './diagnosis-modal.scss',
})
export class DiagnosisModalComponent implements OnInit {
  private dialogRef = inject(DialogRef);
  private router    = inject(Router);
  private store     = inject(Store);
  private service   = inject(DiagnosisService);
  private toast     = inject(ToastService);
  readonly data     = inject<DiagnosisModalData>(MODAL_DATA);
  /** "Ask the assistant" only where the API takes messages. */
  readonly assistant = inject(AiAssistantStatusService);

  private beehives = this.store.selectSignal(selectAllBeehives);
  private apiaries = this.store.selectSignal(selectAllApiaries);

  diagnosis = signal<Diagnosis | null>(null);
  loading   = signal(true);
  missing   = signal(false);
  sendingFeedback = signal(false);

  /** "Beehive 12 · North Field": the hive's number from the store, else the diagnosis' own. */
  readonly title = computed(() => {
    const d  = this.diagnosis();
    const id = this.data.beehiveId ?? d?.beehiveId ?? null;
    if (id === null) return 'Diagnosis';
    const hive   = this.beehives().find(b => b.id === id);
    const apiary = hive ? this.apiaries().find(a => a.id === hive.apiaryId)?.name ?? d?.apiaryName : d?.apiaryName;
    const number = hive?.number ?? d?.beehiveNumber ?? null;
    const label  = number !== null ? beehiveLabel({ number }) : 'Beehive';
    return apiary ? `${label} · ${apiary}` : label;
  });

  readonly subtitle = computed(() => {
    const date = this.diagnosis()?.date;
    return date ? `Inspection of ${formatDate(date, 'mediumDate', 'en-US')}` : '';
  });

  ngOnInit(): void {
    this.assistant.load();

    const request = this.data.recordId
      ? this.service.getRecord(this.data.recordId)
      : this.service.getBeehive(this.data.beehiveId ?? 0);

    request.subscribe({
      next: res => {
        this.diagnosis.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        // A hive without an inspection answers 404: nothing to read yet.
        this.missing.set(true);
        this.loading.set(false);
      },
    });
  }

  severityClass(severity: RiskSeverity): string {
    switch (severity) {
      case 'critical':
      case 'high':   return 'app-badge--banned';
      case 'medium': return 'app-badge--pending';
      default:       return 'app-badge--neutral';
    }
  }

  urgencyClass(urgency: ActionUrgency): string {
    switch (urgency) {
      case 'immediate':   return 'app-badge--banned';
      case 'within_week': return 'app-badge--pending';
      default:            return 'app-badge--neutral';
    }
  }

  urgencyLabel = urgencyLabel;

  feedback(value: 'helpful' | 'not_helpful'): void {
    const d = this.diagnosis();
    if (!d || this.sendingFeedback()) return;
    this.sendingFeedback.set(true);

    this.service.sendFeedback(d.recordId, value).subscribe({
      next: res => {
        this.sendingFeedback.set(false);
        if (res.success) {
          this.diagnosis.set({ ...d, feedback: { value, text: null } });
          this.toast.success('Thanks, noted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.sendingFeedback.set(false),
    });
  }

  /**
   * The chat with this hive's data in front of the assistant: its latest
   * inspections and this diagnosis. The assistant explains; it does not
   * decide — see the AI chat feature.
   */
  askAssistant(): void {
    const d = this.diagnosis();
    if (!d) return;
    this.dialogRef.close();
    this.router.navigate(['/user/ai-chat'], { queryParams: { beehive: d.beehiveId } });
  }

  close(): void {
    this.dialogRef.close();
  }
}

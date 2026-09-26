import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DialogRef } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { DiagnosisService } from '../../../../../core/services/diagnosis.service';
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
 * (`beehiveId`); `title` and `subtitle` name the hive for the header while
 * the diagnosis loads. Closes with nothing — it is read-only apart from the
 * beekeeper's "helpful / not helpful" on it.
 */
export interface DiagnosisModalData {
  recordId?: number;
  beehiveId?: number;
  title?: string;
  subtitle?: string;
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
  private service   = inject(DiagnosisService);
  private toast     = inject(ToastService);
  readonly data     = inject<DiagnosisModalData>(MODAL_DATA);

  diagnosis = signal<Diagnosis | null>(null);
  loading   = signal(true);
  missing   = signal(false);
  sendingFeedback = signal(false);

  ngOnInit(): void {
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

  title(): string {
    const d = this.diagnosis();
    if (this.data.title) return this.data.title;
    if (!d) return 'Diagnosis';
    const hive = d.beehiveNumber !== null ? `Hive ${d.beehiveNumber}` : `Hive #${d.beehiveId}`;
    return d.apiaryName ? `${hive} · ${d.apiaryName}` : hive;
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

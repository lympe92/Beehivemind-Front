import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { RequestService } from '../../../core/services/request.service';
import { DataTableComponent, ColumnDef, TablePagination } from '../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { CalloutComponent } from '../../../shared/components/ui/callout/callout';

interface PendingResponse {
  message_id: number;
  conversation_id: number;
  user_question: string | null;
  ai_response: string | null;
  tool_calls: unknown[] | null;
  created_at: string;
}

interface JudgmentRubric {
  factual_accuracy: number;
  tool_correctness: number;
  refusal_appropriateness: number | null;
  helpfulness: number;
  hallucination_flag: boolean;
  safety_flag: boolean;
  composite_score: number;
  reasoning: string;
  detector_flags: unknown[] | null;
  rules_engine_alignment: unknown | null;
}

interface JudgmentResult {
  id: number;
  conversation_id: number;
  user_question: string | null;
  ai_response: string | null;
  judgment: JudgmentRubric;
}

@Component({
  selector: 'app-ai-responses',
  standalone: true,
  imports: [SlicePipe, DecimalPipe, DataTableComponent, CardComponent, CalloutComponent],
  templateUrl: './ai-responses.html',
})
export class AiResponsesComponent implements OnInit {
  private request = inject(RequestService);

  pending = signal<PendingResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  totalPages = signal(1);
  page = signal(1);

  /** message_id currently being judged (spinner state) */
  judgingId = signal<number | null>(null);
  /** completed judgments keyed by message_id */
  results = signal<Record<number, JudgmentRubric>>({});
  /** the result currently shown in the detail panel */
  selectedResult = signal<JudgmentResult | null>(null);

  readonly columns: ColumnDef[] = [
    { key: 'user_question', label: 'User question' },
    { key: 'ai_response', label: 'AI response' },
    { key: 'created_at', label: 'Date', width: '120px' },
  ];

  get tablePagination(): TablePagination {
    return { page: this.page(), totalPages: this.totalPages(), total: this.total() };
  }

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.loading.set(true);
    this.error.set(null);
    this.request
      .getRequest<PendingResponse[]>(`admin/ai-responses/pending?page=${this.page()}`)
      .subscribe({
        next: (res) => {
          this.pending.set(res.data);
          this.total.set(res.meta?.total ?? 0);
          this.totalPages.set(res.meta?.total_pages ?? 1);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('The pending responses did not load.');
          this.loading.set(false);
        },
      });
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadPending();
  }

  judge(messageId: number): void {
    if (this.judgingId() !== null) return;
    this.judgingId.set(messageId);

    this.request
      .postRequest<JudgmentResult>(`admin/ai-responses/${messageId}/judge`, {})
      .subscribe({
        next: (res) => {
          const result = res.data;
          this.results.update((map) => ({ ...map, [messageId]: result.judgment }));
          this.selectedResult.set(result);
          this.judgingId.set(null);
        },
        error: () => {
          this.error.set('The judgment did not complete. Try again.');
          this.judgingId.set(null);
        },
      });
  }

  viewResult(messageId: number): void {
    const rubric = this.results()[messageId];
    if (!rubric) return;
    const row = this.pending().find((r) => r.message_id === messageId);
    this.selectedResult.set({
      id: 0,
      conversation_id: row?.conversation_id ?? 0,
      user_question: row?.user_question ?? null,
      ai_response: row?.ai_response ?? null,
      judgment: rubric,
    });
  }

  closeResult(): void {
    this.selectedResult.set(null);
  }
}

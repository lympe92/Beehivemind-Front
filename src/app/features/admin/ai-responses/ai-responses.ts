import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { RequestService } from '../../../core/services/request.service';
import { DataTableComponent, ColumnDef, TablePagination } from '../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { CalloutComponent } from '../../../shared/components/ui/callout/callout';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';

/** An assistant reply nobody has judged yet. */
interface PendingResponse {
  message_id: number;
  conversation_id: number;
  user_question: string | null;
  ai_response: string | null;
  created_at: string;
}

interface JudgmentRubric {
  factual_accuracy: number;
  refusal_appropriateness: number | null;
  helpfulness: number;
  hallucination_flag: boolean;
  safety_flag: boolean;
  composite_score: number;
  reasoning: string;
  detector_flags: { type: string; value?: unknown }[] | null;
}

/** A judged reply, as the list and the detail return it. */
interface JudgmentResult {
  id: number;
  conversation_id: number;
  user_question: string | null;
  ai_response: string | null;
  judgment: JudgmentRubric;
  admin: { reviewed_by: number | null; notes: string | null; flagged_for_retraining: boolean };
  created_at: string | null;
  judged_at: string | null;
}

interface ConversationMessage {
  id: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  created_at: string;
}

type Tab = 'pending' | 'judged';
type JudgedFilter = '' | 'hallucination' | 'safety' | 'low_score' | 'unreviewed' | 'flagged_for_retraining';

@Component({
  selector: 'app-ai-responses',
  standalone: true,
  imports: [SlicePipe, DecimalPipe, DataTableComponent, CardComponent, CalloutComponent],
  templateUrl: './ai-responses.html',
})
export class AiResponsesComponent implements OnInit {
  private request = inject(RequestService);
  private toast = inject(ToastService);

  tab = signal<Tab>('pending');
  error = signal<string | null>(null);

  // ── Pending ────────────────────────────────────────────────
  pending = signal<PendingResponse[]>([]);
  pendingLoading = signal(true);
  pendingTotal = signal(0);
  pendingTotalPages = signal(1);
  pendingPage = signal(1);
  /** message_id currently being judged (spinner state) */
  judgingId = signal<number | null>(null);

  // ── Judged ─────────────────────────────────────────────────
  judged = signal<JudgmentResult[]>([]);
  judgedLoading = signal(false);
  judgedLoaded = signal(false);
  judgedTotal = signal(0);
  judgedTotalPages = signal(1);
  judgedPage = signal(1);
  judgedFilter = signal<JudgedFilter>('');
  judgedSort = signal<'score_asc' | 'score_desc' | 'date_desc'>('date_desc');

  // ── Detail ─────────────────────────────────────────────────
  selected = signal<JudgmentResult | null>(null);
  conversation = signal<ConversationMessage[]>([]);
  conversationLoading = signal(false);
  notesDraft = signal('');
  flagDraft = signal(false);
  saving = signal(false);

  readonly pendingColumns: ColumnDef[] = [
    { key: 'user_question', label: 'User question' },
    { key: 'ai_response', label: 'AI response' },
    { key: 'created_at', label: 'Date', width: '120px' },
  ];

  readonly judgedColumns: ColumnDef[] = [
    { key: 'user_question', label: 'User question' },
    { key: 'score', label: 'Score', width: '90px' },
    { key: 'flags', label: 'Flags', width: '150px' },
    { key: 'reviewed', label: 'Reviewed', width: '110px' },
    { key: 'judged_at', label: 'Judged', width: '120px' },
  ];

  readonly filters: { value: JudgedFilter; label: string }[] = [
    { value: '', label: 'All judged' },
    { value: 'low_score', label: 'Low score (≤ 2.5)' },
    { value: 'hallucination', label: 'Hallucination' },
    { value: 'safety', label: 'Safety concern' },
    { value: 'unreviewed', label: 'Not reviewed by an admin' },
    { value: 'flagged_for_retraining', label: 'Flagged for retraining' },
  ];

  pendingPagination = computed<TablePagination>(() => ({
    page: this.pendingPage(), totalPages: this.pendingTotalPages(), total: this.pendingTotal(),
  }));
  judgedPagination = computed<TablePagination>(() => ({
    page: this.judgedPage(), totalPages: this.judgedTotalPages(), total: this.judgedTotal(),
  }));

  ngOnInit(): void {
    this.loadPending();
  }

  showTab(tab: Tab): void {
    this.tab.set(tab);
    this.selected.set(null);
    if (tab === 'judged' && !this.judgedLoaded()) this.loadJudged();
  }

  // ── Pending ────────────────────────────────────────────────

  loadPending(): void {
    this.pendingLoading.set(true);
    this.error.set(null);
    this.request
      .getRequest<PendingResponse[]>(`admin/ai-responses/pending?page=${this.pendingPage()}`)
      .subscribe({
        next: (res) => {
          this.pending.set(res.data);
          this.pendingTotal.set(res.meta?.total ?? 0);
          this.pendingTotalPages.set(res.meta?.total_pages ?? 1);
          this.pendingLoading.set(false);
        },
        error: () => {
          this.error.set('The pending responses did not load.');
          this.pendingLoading.set(false);
        },
      });
  }

  goToPendingPage(p: number): void {
    this.pendingPage.set(p);
    this.loadPending();
  }

  /** Runs the judge on one reply; the result opens in the detail panel. */
  judge(messageId: number): void {
    if (this.judgingId() !== null) return;
    this.judgingId.set(messageId);
    this.error.set(null);

    this.request
      .postRequest<JudgmentResult>(`admin/ai-responses/${messageId}/judge`, {})
      .subscribe({
        next: (res) => {
          this.judgingId.set(null);
          this.pending.update(rows => rows.filter(r => r.message_id !== messageId));
          this.pendingTotal.update(n => Math.max(0, n - 1));
          this.judgedLoaded.set(false);
          this.open(res.data);
        },
        error: () => {
          this.error.set('The judgment did not complete. Try again.');
          this.judgingId.set(null);
        },
      });
  }

  // ── Judged ─────────────────────────────────────────────────

  loadJudged(): void {
    this.judgedLoading.set(true);
    this.error.set(null);
    const params = new URLSearchParams({ page: String(this.judgedPage()), sort: this.judgedSort() });
    if (this.judgedFilter()) params.set('flag', this.judgedFilter());

    this.request
      .getRequest<JudgmentResult[]>(`admin/ai-responses?${params}`)
      .subscribe({
        next: (res) => {
          this.judged.set(res.data);
          this.judgedTotal.set(res.meta?.total ?? 0);
          this.judgedTotalPages.set(res.meta?.total_pages ?? 1);
          this.judgedLoading.set(false);
          this.judgedLoaded.set(true);
        },
        error: () => {
          this.error.set('The judged responses did not load.');
          this.judgedLoading.set(false);
        },
      });
  }

  onFilterChange(event: Event): void {
    this.judgedFilter.set((event.target as HTMLSelectElement).value as JudgedFilter);
    this.judgedPage.set(1);
    this.loadJudged();
  }

  onSortChange(event: Event): void {
    this.judgedSort.set((event.target as HTMLSelectElement).value as 'score_asc' | 'score_desc' | 'date_desc');
    this.judgedPage.set(1);
    this.loadJudged();
  }

  goToJudgedPage(p: number): void {
    this.judgedPage.set(p);
    this.loadJudged();
  }

  flagsOf(row: JudgmentResult): string {
    const flags: string[] = [];
    if (row.judgment.hallucination_flag) flags.push('hallucination');
    if (row.judgment.safety_flag) flags.push('safety');
    if (row.admin.flagged_for_retraining) flags.push('retraining');
    return flags.join(', ') || '—';
  }

  // ── Detail ─────────────────────────────────────────────────

  /** The rubric, the admin's notes, and the whole conversation it sits in. */
  open(result: JudgmentResult): void {
    this.selected.set(result);
    this.notesDraft.set(result.admin?.notes ?? '');
    this.flagDraft.set(!!result.admin?.flagged_for_retraining);
    this.conversation.set([]);
    this.conversationLoading.set(true);

    this.request
      .getRequest<{ judgment: JudgmentResult; conversation: { messages: ConversationMessage[] } }>(`admin/ai-responses/${result.id}`)
      .subscribe({
        next: (res) => {
          this.conversation.set(
            res.data.conversation.messages.filter(m => m.role === 'user' || m.role === 'assistant'),
          );
          this.conversationLoading.set(false);
        },
        error: () => this.conversationLoading.set(false),
      });
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  onNotesInput(event: Event): void {
    this.notesDraft.set((event.target as HTMLTextAreaElement).value);
  }

  onFlagChange(event: Event): void {
    this.flagDraft.set((event.target as HTMLInputElement).checked);
  }

  saveReview(): void {
    const current = this.selected();
    if (!current || this.saving()) return;
    this.saving.set(true);

    this.request
      .patchRequest<JudgmentResult>(`admin/ai-responses/${current.id}/admin-review`, {
        admin_notes: this.notesDraft().trim() || null,
        flagged_for_retraining: this.flagDraft(),
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res.success) {
            this.selected.set(res.data);
            this.judged.update(rows => rows.map(r => (r.id === res.data.id ? res.data : r)));
            this.toast.success('Review saved.');
          } else {
            this.toast.error('Something went wrong. Please try again.');
          }
        },
        error: () => this.saving.set(false),
      });
  }
}

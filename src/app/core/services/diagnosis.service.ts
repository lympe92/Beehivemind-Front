import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import {
  Diagnosis,
  DiagnosisAction,
  DiagnosisForbiddenAction,
  DiagnosisLevel,
  DiagnosisRisk,
  DiagnosisSummary,
  DiagnosisTrend,
  HiveDiagnosis,
} from '../models/diagnosis.model';

// ── API shapes (snake_case) ────────────────────────────────────────────────

interface SubjectPayload {
  level: DiagnosisLevel;
  is_current: boolean;
  mode: Diagnosis['mode'];
  evaluated_at: string | null;
  beehive: { id: number; number: number | null; apiary_id: number | null };
  apiary: { id: number | null; name: string | null };
}

interface SummaryPayload extends SubjectPayload {
  id: number;
  record_id: number;
  date: string | null;
  top_risks: { code: string; name_en: string; severity: DiagnosisRisk['severity'] }[];
  risk_count: number;
  action_count: number;
  first_action: string | null;
}

interface DiagnosisPayload extends SubjectPayload {
  id: number;
  record: { id: number; date: string | null };
  confidence: Diagnosis['confidence'];
  risks: { code: string; name_en: string; name_el: string; severity: DiagnosisRisk['severity']; category: string }[];
  recommended_actions: { code: string; name_en: string; name_el: string; urgency: DiagnosisAction['urgency']; category: string }[];
  forbidden_actions: { code: string; name_en: string; name_el: string }[];
  reasoning: { en: string; el: string };
  triggered_rule_codes: string[];
  trends: {
    detector_code: string; severity: string; direction: DiagnosisTrend['direction']; confidence: string;
    insight_en: string; insight_el: string; window_start: string | null; window_end: string | null;
  }[];
  feedback: Diagnosis['feedback'];
}

interface HivePayload {
  beehive: { id: number; number: number | null; apiary_id: number };
  diagnosis: SummaryPayload | null;
}

/**
 * Reads of the stored diagnoses. The client never asks for one to be
 * computed — the API refreshes them on every inspection write and every
 * morning. Every read is scoped to the team by the API.
 */
@Injectable({ providedIn: 'root' })
export class DiagnosisService {
  private request = inject(RequestService);

  /** Every hive of the team whose current diagnosis is serious — the dashboard. */
  getAttention(): Observable<ApiResponse<DiagnosisSummary[]>> {
    return this.request.getRequest<SummaryPayload[]>('diagnosis/attention').pipe(
      map(res => ({ ...res, data: (res.data ?? []).map(summaryFromApi) }))
    );
  }

  /** A summary per inspection of the last year, in the given filter (0 = all). */
  getRecordSummaries(apiaryId = 0, beehiveId = 0): Observable<ApiResponse<DiagnosisSummary[]>> {
    const params = new URLSearchParams();
    if (apiaryId)  params.set('apiary_id', String(apiaryId));
    if (beehiveId) params.set('beehive_id', String(beehiveId));
    const query = params.toString();

    return this.request.getRequest<SummaryPayload[]>(`diagnosis/records${query ? '?' + query : ''}`).pipe(
      map(res => ({ ...res, data: (res.data ?? []).map(summaryFromApi) }))
    );
  }

  /** One inspection's diagnosis in full. */
  getRecord(recordId: number): Observable<ApiResponse<Diagnosis>> {
    return this.request.getRequest<DiagnosisPayload>(`diagnosis/records/${recordId}`).pipe(
      map(res => ({ ...res, data: fromApi(res.data) }))
    );
  }

  /** The hive's current diagnosis in full; 404 when it has no inspection. */
  getBeehive(beehiveId: number): Observable<ApiResponse<Diagnosis>> {
    return this.request.getRequest<DiagnosisPayload>(`diagnosis/beehives/${beehiveId}`).pipe(
      map(res => ({ ...res, data: fromApi(res.data) }))
    );
  }

  /** The beekeeper's verdict on an inspection's diagnosis. */
  sendFeedback(recordId: number, value: 'helpful' | 'not_helpful' | 'incorrect'): Observable<ApiResponse<null>> {
    return this.request.postRequest<null>(`inspections/${recordId}/feedback`, { feedback: value });
  }

  /** The current diagnosis of every hive in the apiary (null = no inspection yet). */
  getApiary(apiaryId: number): Observable<ApiResponse<HiveDiagnosis[]>> {
    return this.request.getRequest<HivePayload[]>(`diagnosis/apiaries/${apiaryId}`).pipe(
      map(res => ({
        ...res,
        data: (res.data ?? []).map(h => ({
          beehiveId:     h.beehive.id,
          beehiveNumber: h.beehive.number,
          diagnosis:     h.diagnosis ? summaryFromApi(h.diagnosis) : null,
        })),
      }))
    );
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────

function subjectFromApi(p: SubjectPayload, recordId: number, date: string | null) {
  return {
    recordId,
    date,
    beehiveId:     p.beehive.id,
    beehiveNumber: p.beehive.number,
    apiaryId:      p.apiary?.id ?? p.beehive.apiary_id ?? null,
    apiaryName:    p.apiary?.name ?? null,
    level:         p.level ?? 'unknown',
    isCurrent:     !!p.is_current,
    mode:          p.mode ?? 'unknown',
    evaluatedAt:   p.evaluated_at ?? null,
  };
}

function summaryFromApi(p: SummaryPayload): DiagnosisSummary {
  return {
    ...subjectFromApi(p, p.record_id, p.date),
    id:          p.id,
    topRisks:    (p.top_risks ?? []).map(r => ({ code: r.code, nameEn: r.name_en, severity: r.severity })),
    riskCount:   p.risk_count ?? 0,
    actionCount: p.action_count ?? 0,
    firstAction: p.first_action ?? null,
  };
}

function fromApi(p: DiagnosisPayload): Diagnosis {
  return {
    ...subjectFromApi(p, p.record.id, p.record.date),
    id:         p.id,
    confidence: p.confidence ?? 'low',
    risks: (p.risks ?? []).map(r => ({
      code: r.code, nameEn: r.name_en, nameEl: r.name_el, severity: r.severity, category: r.category,
    })),
    recommendedActions: (p.recommended_actions ?? []).map(a => ({
      code: a.code, nameEn: a.name_en, nameEl: a.name_el, urgency: a.urgency, category: a.category,
    })),
    forbiddenActions: (p.forbidden_actions ?? []).map((a): DiagnosisForbiddenAction => ({
      code: a.code, nameEn: a.name_en, nameEl: a.name_el,
    })),
    reasoning:          p.reasoning ?? { en: '', el: '' },
    triggeredRuleCodes: p.triggered_rule_codes ?? [],
    trends: (p.trends ?? []).map(t => ({
      detectorCode: t.detector_code, severity: t.severity, direction: t.direction, confidence: t.confidence,
      insightEn: t.insight_en, insightEl: t.insight_el, windowStart: t.window_start, windowEnd: t.window_end,
    })),
    feedback: p.feedback ?? null,
  };
}

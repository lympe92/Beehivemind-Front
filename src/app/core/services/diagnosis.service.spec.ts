import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';
import { DiagnosisService } from './diagnosis.service';
import { diagnosisLevelBadgeClass, diagnosisLevelLabel, isSeriousLevel } from '../models/diagnosis.model';

describe('DiagnosisService', () => {
  let service: DiagnosisService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DiagnosisService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps a summary to the app shape', () => {
    let result: unknown;
    service.getAttention().subscribe(res => (result = res.data));

    http.expectOne(environment.apiUrl + 'diagnosis/attention').flush({
      success: true, code: 200, message: 'OK',
      data: [{
        id: 7, record_id: 504, date: '2026-08-27', level: 'survival', is_current: true, mode: 'survival',
        beehive: { id: 14, number: 3, apiary_id: 1 }, apiary: { id: 1, name: 'North Field' },
        top_risks: [{ code: 'colony_starvation', name_en: 'Colony starvation', severity: 'critical' }],
        risk_count: 1, action_count: 2, first_action: 'Emergency fondant feeding', evaluated_at: '2026-09-06T08:00:00Z',
      }],
    });

    expect(result).toEqual([{
      id: 7, recordId: 504, date: '2026-08-27', beehiveId: 14, beehiveNumber: 3, apiaryId: 1, apiaryName: 'North Field',
      level: 'survival', isCurrent: true, mode: 'survival', evaluatedAt: '2026-09-06T08:00:00Z',
      topRisks: [{ code: 'colony_starvation', nameEn: 'Colony starvation', severity: 'critical' }],
      riskCount: 1, actionCount: 2, firstAction: 'Emergency fondant feeding',
    }]);
  });

  it('sends the filter as query parameters and only when set', () => {
    service.getRecordSummaries(0, 0).subscribe();
    http.expectOne(environment.apiUrl + 'diagnosis/records').flush({ success: true, data: [] });

    service.getRecordSummaries(2, 9).subscribe();
    http.expectOne(environment.apiUrl + 'diagnosis/records?apiary_id=2&beehive_id=9').flush({ success: true, data: [] });
  });

  it('maps the full diagnosis, its lists and its trends', () => {
    let result: any;
    service.getBeehive(14).subscribe(res => (result = res.data));

    http.expectOne(environment.apiUrl + 'diagnosis/beehives/14').flush({
      success: true, code: 200, message: 'OK',
      data: {
        id: 7, record: { id: 504, date: '2026-08-27' }, level: 'attention', is_current: true, mode: 'normal', confidence: 'medium',
        beehive: { id: 14, number: null, apiary_id: 1 }, apiary: { id: 1, name: 'North Field' },
        risks: [{ code: 'r', name_en: 'Risk', name_el: 'Κίνδυνος', severity: 'high', category: 'disease' }],
        recommended_actions: [{ code: 'a', name_en: 'Act', name_el: 'Δράση', urgency: 'immediate', category: 'x' }],
        forbidden_actions: [{ code: 'f', name_en: 'Forbidden', name_el: 'Απαγορεύεται' }],
        reasoning: { en: 'Because.', el: 'Επειδή.' }, triggered_rule_codes: ['rule_a'],
        trends: [{ detector_code: 'population_decline', severity: 'high', direction: 'negative', confidence: 'medium', insight_en: 'Falling.', insight_el: '', window_start: '2026-07-01', window_end: '2026-08-27' }],
        feedback: { value: 'helpful', text: null }, evaluated_at: null,
      },
    });

    expect(result.recordId).toBe(504);
    expect(result.beehiveNumber).toBeNull();
    expect(result.risks[0]).toEqual({ code: 'r', nameEn: 'Risk', nameEl: 'Κίνδυνος', severity: 'high', category: 'disease' });
    expect(result.recommendedActions[0].urgency).toBe('immediate');
    expect(result.forbiddenActions[0].nameEn).toBe('Forbidden');
    expect(result.trends[0].detectorCode).toBe('population_decline');
    expect(result.feedback.value).toBe('helpful');
  });

  it('posts feedback on the record', () => {
    service.sendFeedback(504, 'not_helpful').subscribe();
    const req = http.expectOne(environment.apiUrl + 'inspections/504/feedback');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ feedback: 'not_helpful' });
    req.flush({ success: true });
  });
});

describe('diagnosis level helpers', () => {
  it('colours the two serious levels as danger, watch as warning, ok as success', () => {
    expect(diagnosisLevelBadgeClass('survival')).toBe('app-badge--banned');
    expect(diagnosisLevelBadgeClass('attention')).toBe('app-badge--banned');
    expect(diagnosisLevelBadgeClass('watch')).toBe('app-badge--pending');
    expect(diagnosisLevelBadgeClass('ok')).toBe('app-badge--active');
    expect(diagnosisLevelBadgeClass('unknown')).toBe('app-badge--neutral');
    expect(diagnosisLevelBadgeClass(null)).toBe('app-badge--neutral');
  });

  it('names a missing reading honestly', () => {
    expect(diagnosisLevelLabel(undefined)).toBe('No reading');
    expect(diagnosisLevelLabel('survival')).toBe('Survival');
  });

  it('knows which levels are serious', () => {
    expect(isSeriousLevel('attention')).toBe(true);
    expect(isSeriousLevel('watch')).toBe(false);
    expect(isSeriousLevel(null)).toBe(false);
  });
});

/**
 * The automatic reading of an inspection by the Rules Engine — no language
 * model involved. The API stores one per inspection and flags the one of the
 * hive's latest inspection as current. See the backend's `Rules` module.
 */

/** From the least to the most serious. */
export type DiagnosisLevel = 'unknown' | 'ok' | 'watch' | 'attention' | 'survival';

export const DIAGNOSIS_LEVELS: DiagnosisLevel[] = ['unknown', 'ok', 'watch', 'attention', 'survival'];

/** The levels a beekeeper is told about without asking. */
export const SERIOUS_LEVELS: DiagnosisLevel[] = ['attention', 'survival'];

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ActionUrgency = 'immediate' | 'within_week' | 'monitor' | 'optional';

export interface DiagnosisRisk {
  code: string;
  nameEn: string;
  nameEl: string;
  severity: RiskSeverity;
  category: string;
}

export interface DiagnosisAction {
  code: string;
  nameEn: string;
  nameEl: string;
  urgency: ActionUrgency;
  category: string;
}

export interface DiagnosisForbiddenAction {
  code: string;
  nameEn: string;
  nameEl: string;
}

export interface DiagnosisTrend {
  detectorCode: string;
  severity: string;
  direction: 'positive' | 'negative' | 'neutral';
  confidence: string;
  insightEn: string;
  insightEl: string;
  windowStart: string | null;
  windowEnd: string | null;
}

interface DiagnosisSubject {
  recordId: number;
  date: string | null;
  beehiveId: number;
  beehiveNumber: number | null;
  apiaryId: number | null;
  apiaryName: string | null;
  level: DiagnosisLevel;
  isCurrent: boolean;
  mode: 'survival' | 'normal' | 'unknown';
  evaluatedAt: string | null;
}

/** The one-line version, for badges, columns and the dashboard. */
export interface DiagnosisSummary extends DiagnosisSubject {
  id: number;
  topRisks: Pick<DiagnosisRisk, 'code' | 'nameEn' | 'severity'>[];
  riskCount: number;
  actionCount: number;
  firstAction: string | null;
}

/** The full diagnosis of one inspection. */
export interface Diagnosis extends DiagnosisSubject {
  id: number;
  confidence: 'low' | 'medium' | 'high';
  risks: DiagnosisRisk[];
  recommendedActions: DiagnosisAction[];
  forbiddenActions: DiagnosisForbiddenAction[];
  reasoning: { en: string; el: string };
  triggeredRuleCodes: string[];
  trends: DiagnosisTrend[];
  feedback: { value: 'helpful' | 'not_helpful' | 'incorrect'; text: string | null } | null;
}

/** A hive of an apiary with its current diagnosis, or none yet. `id` is the hive's, for the table. */
export interface HiveDiagnosis {
  id: number;
  beehiveId: number;
  beehiveNumber: number | null;
  diagnosis: DiagnosisSummary | null;
}

/** What the badge says. */
export function diagnosisLevelLabel(level: DiagnosisLevel | null | undefined): string {
  switch (level) {
    case 'survival':  return 'Survival';
    case 'attention': return 'Attention';
    case 'watch':     return 'Watch';
    case 'ok':        return 'OK';
    default:          return 'No reading';
  }
}

/**
 * The design system's badge tone for a level: danger for the two serious
 * ones, warning for watch, success for ok, an outline when nothing matched.
 */
export function diagnosisLevelBadgeClass(level: DiagnosisLevel | null | undefined): string {
  switch (level) {
    case 'survival':
    case 'attention': return 'app-badge--banned';
    case 'watch':     return 'app-badge--pending';
    case 'ok':        return 'app-badge--active';
    default:          return 'app-badge--neutral';
  }
}

export function isSeriousLevel(level: DiagnosisLevel | null | undefined): boolean {
  return !!level && SERIOUS_LEVELS.includes(level);
}

export function urgencyLabel(urgency: ActionUrgency): string {
  switch (urgency) {
    case 'immediate':   return 'Now';
    case 'within_week': return 'This week';
    case 'monitor':     return 'Monitor';
    default:            return 'Optional';
  }
}

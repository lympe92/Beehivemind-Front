import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import {
  EMPTY_PROGRESS,
  OnboardingPanel,
  OnboardingProgress,
  OnboardingSeenKey,
  OnboardingState,
  OnboardingStateChange,
  OnboardingSummary,
} from '../models/onboarding.model';
import { RequestService } from './request.service';

/** The summary as the API sends it. */
export interface OnboardingSummaryPayload {
  apiaries: number;
  beehives: number;
  inspections: number;
  feedings: number;
  harvests: number;
  treatment_types: number;
  treatment_sessions: number;
  treatment_doses_done: number;
  costs: number;
  cost_categories: number;
  team_members: number;
  pending_invitations: number;
  onboarding: OnboardingState | null;
  onboarding_progress: OnboardingProgress | null;
}

/** The two fields of the user resource the guide reads back after a write. */
export interface OnboardingUserPayload {
  onboarding: OnboardingState | null;
  onboarding_progress: OnboardingProgress | null;
}

export interface OnboardingStanding {
  onboarding: OnboardingState | null;
  progress: OnboardingProgress;
}

const STATES: readonly (OnboardingState | null)[] = ['active', 'done', 'dismissed', null];

/**
 * The "Getting started" guide's three endpoints. The summary is one query on
 * the API for every count, so the guide never loads the eight slices itself.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private request = inject(RequestService);

  getSummary(): Observable<ApiResponse<OnboardingSummary | null>> {
    return this.request.getRequest<OnboardingSummaryPayload>('user/onboarding/summary').pipe(
      map(res => ({ ...res, data: summaryFromApi(res.data) })),
    );
  }

  setState(state: OnboardingStateChange): Observable<ApiResponse<OnboardingStanding>> {
    return this.request.postRequest<OnboardingUserPayload>('user/onboarding', { state }).pipe(
      map(res => ({ ...res, data: standingFromApi(res.data) })),
    );
  }

  /** `seen` is merged into what is stored; `panel` replaces it. */
  updateProgress(change: { seen?: OnboardingSeenKey[]; panel?: OnboardingPanel }): Observable<ApiResponse<OnboardingStanding>> {
    return this.request.postRequest<OnboardingUserPayload>('user/onboarding/progress', change).pipe(
      map(res => ({ ...res, data: standingFromApi(res.data) })),
    );
  }
}

function count(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function progressFromApi(progress: Partial<OnboardingProgress> | null | undefined): OnboardingProgress {
  if (!progress || typeof progress !== 'object') return { ...EMPTY_PROGRESS, seen: [] };
  return {
    seen: Array.isArray(progress.seen) ? [...progress.seen] : [],
    panel: progress.panel === 'folded' ? 'folded' : 'open',
  };
}

export function standingFromApi(p: Partial<OnboardingUserPayload> | null | undefined): OnboardingStanding {
  const onboarding = STATES.includes(p?.onboarding ?? null) ? (p?.onboarding ?? null) : null;
  return { onboarding, progress: progressFromApi(p?.onboarding_progress) };
}

/**
 * Null when the answer is not a summary (an error page, an older API): the
 * guide then shows nothing rather than a hub that ticks on wrong numbers.
 */
export function summaryFromApi(p: OnboardingSummaryPayload | null | undefined): OnboardingSummary | null {
  if (!p || typeof p !== 'object' || Array.isArray(p) || !('apiaries' in p)) return null;
  return {
    apiaries: count(p.apiaries),
    beehives: count(p.beehives),
    inspections: count(p.inspections),
    feedings: count(p.feedings),
    harvests: count(p.harvests),
    treatmentTypes: count(p.treatment_types),
    treatmentSessions: count(p.treatment_sessions),
    treatmentDosesDone: count(p.treatment_doses_done),
    costs: count(p.costs),
    costCategories: count(p.cost_categories),
    teamMembers: count(p.team_members),
    pendingInvitations: count(p.pending_invitations),
    ...standingFromApi(p),
  };
}

import { UserTeamSummary } from '../../core/models/team.model';
import { OnboardingProgress, OnboardingState } from '../../core/models/onboarding.model';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  country: string | null;
  unit: string;
  show_hints: boolean;
  two_factor_enabled: boolean;
  has_password: boolean;
  /** Absent on a session stored before teams existed; the shell then reads it as an owner's. */
  team?: UserTeamSummary | null;
  last_exported_at?: string | null;
  /** The "Getting started" guide, as of sign-in. Absent on a session stored before it existed. */
  onboarding?: OnboardingState | null;
  onboarding_progress?: OnboardingProgress | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  twoFactorToken: string | null;
  twoFactorPending: 'verify' | 'setup' | null;
  pendingUser: User | null;
  pendingToken: string | null;
  retryAfterMinutes: number | null;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  twoFactorToken: null,
  twoFactorPending: null,
  pendingUser: null,
  pendingToken: null,
  retryAfterMinutes: null,
};

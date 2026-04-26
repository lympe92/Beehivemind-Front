import { TreatmentSession } from '../../core/models/treatment-session.model';

export interface TreatmentSessionsState {
  sessions: TreatmentSession[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialTreatmentSessionsState: TreatmentSessionsState = {
  sessions: [],
  loading:  false,
  loaded:   false,
  error:    null,
};
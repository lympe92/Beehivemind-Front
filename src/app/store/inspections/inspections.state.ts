import { Inspection } from '../../core/models/inspection.model';

export interface InspectionsState {
  inspections: Inspection[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialInspectionsState: InspectionsState = {
  inspections: [],
  loading: false,
  loaded: false,
  error: null,
};

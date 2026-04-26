import { TreatmentType } from '../../core/models/treatment-type.model';

export interface TreatmentTypesState {
  types: TreatmentType[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialTreatmentTypesState: TreatmentTypesState = {
  types:   [],
  loading: false,
  loaded:  false,
  error:   null,
};

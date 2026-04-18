import { Apiary } from '../../core/models/apiary.model';

export interface ApiariesState {
  apiaries: Apiary[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialApiariesState: ApiariesState = {
  apiaries: [],
  loading: false,
  loaded: false,
  error: null,
};

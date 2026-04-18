import { Harvest } from '../../core/models/harvest.model';

export interface HarvestState {
  harvest: Harvest[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialHarvestState: HarvestState = {
  harvest: [],
  loading: false,
  loaded: false,
  error: null,
};

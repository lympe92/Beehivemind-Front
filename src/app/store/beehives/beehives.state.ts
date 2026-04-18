import { Beehive } from '../../core/models/beehive.model';

export interface BeehivesState {
  beehives: Beehive[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialBeehivesState: BeehivesState = {
  beehives: [],
  loading: false,
  loaded: false,
  error: null,
};
import { Feeding } from '../../core/models/feeding.model';

export interface FeedingState {
  feeding: Feeding[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialFeedingState: FeedingState = {
  feeding: [],
  loading: false,
  loaded: false,
  error: null,
};

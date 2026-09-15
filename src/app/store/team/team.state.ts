import { Team } from '../../core/models/team.model';

export interface TeamState {
  data: Team | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialTeamState: TeamState = {
  data:    null,
  loading: false,
  loaded:  false,
  error:   null,
};

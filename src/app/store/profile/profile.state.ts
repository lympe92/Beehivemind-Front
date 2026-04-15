import { UserProfile } from '../../core/models/user-profile.model';

export interface ProfileState {
  data: UserProfile | null;
  loading: boolean;
  saving: boolean;
  // 2FA setup flow — received from API, needed by component to generate QR
  tfaSetupSecret: string | null;
  tfaSetupOtpauthUrl: string | null;
  tfaBackupCodes: string[];
}

export const initialProfileState: ProfileState = {
  data: null,
  loading: false,
  saving: false,
  tfaSetupSecret: null,
  tfaSetupOtpauthUrl: null,
  tfaBackupCodes: [],
};

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
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  twoFactorToken: string | null;
  twoFactorPending: 'verify' | 'setup' | null;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  twoFactorToken: null,
  twoFactorPending: null,
};

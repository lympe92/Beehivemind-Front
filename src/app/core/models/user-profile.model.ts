export interface UserProfile {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  country: string | null;
  country_latitude: number | null;
  country_longitude: number | null;
  unit: string;
  show_hints: boolean;
  two_factor_enabled: boolean;
}

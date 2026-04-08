export type EmployeeRole = 'support' | 'moderator' | 'admin' | 'superadmin';

export const EMPLOYEE_ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  support: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
};

export interface Employee {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: EmployeeRole;
}

export interface EmployeeAuthState {
  employee: Employee | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const initialEmployeeAuthState: EmployeeAuthState = {
  employee: null,
  token: null,
  loading: false,
  error: null,
};

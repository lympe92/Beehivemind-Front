import { authReducer } from './auth/auth.reducer';
import { AuthEffects } from './auth/auth.effects';
import { employeeAuthReducer } from './employee-auth/employee-auth.reducer';
import { EmployeeAuthEffects } from './employee-auth/employee-auth.effects';
import { profileReducer } from './profile/profile.reducer';
import { ProfileEffects } from './profile/profile.effects';
import { apiariesReducer } from './apiaries/apiaries.reducer';
import { ApiariesEffects } from './apiaries/apiaries.effects';
import { beehivesReducer } from './beehives/beehives.reducer';
import { BeehivesEffects } from './beehives/beehives.effects';
import { inspectionsReducer } from './inspections/inspections.reducer';
import { InspectionsEffects } from './inspections/inspections.effects';
import { feedingReducer } from './feeding/feeding.reducer';
import { FeedingEffects } from './feeding/feeding.effects';
import { harvestReducer } from './harvest/harvest.reducer';
import { HarvestEffects } from './harvest/harvest.effects';
import { treatmentTypesReducer } from './treatment-types/treatment-types.reducer';
import { TreatmentTypesEffects } from './treatment-types/treatment-types.effects';
import { treatmentSessionsReducer } from './treatment-sessions/treatment-sessions.reducer';
import { TreatmentSessionsEffects } from './treatment-sessions/treatment-sessions.effects';
import { notificationsReducer } from './notifications/notifications.reducer';
import { NotificationsEffects } from './notifications/notifications.effects';

export const appReducers = {
  auth: authReducer,
  employeeAuth: employeeAuthReducer,
  profile: profileReducer,
  apiaries: apiariesReducer,
  beehives: beehivesReducer,
  inspections: inspectionsReducer,
  feeding: feedingReducer,
  harvest: harvestReducer,
  treatmentTypes: treatmentTypesReducer,
  treatmentSessions: treatmentSessionsReducer,
  notifications:     notificationsReducer,
};

export const appEffects = [
  AuthEffects,
  EmployeeAuthEffects,
  ProfileEffects,
  ApiariesEffects,
  BeehivesEffects,
  InspectionsEffects,
  FeedingEffects,
  HarvestEffects,
  TreatmentTypesEffects,
  TreatmentSessionsEffects,
  NotificationsEffects,
];

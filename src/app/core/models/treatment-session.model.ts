import { TreatmentType } from './treatment-type.model';
import { TreatmentInstance } from './treatment-instance.model';

export interface TreatmentSession {
  id: number;
  treatmentTypeId: number;
  apiaryId: number | null;
  startDate: string;
  notes: string | null;
  treatmentType: TreatmentType | null;
  beehiveIds: number[];
  instances: TreatmentInstance[];
  createdAt: string | null;
}

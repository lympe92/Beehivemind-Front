export type TreatmentInstanceStatus = 'planned' | 'done' | 'skipped';

export interface TreatmentInstance {
  id: number;
  treatmentSessionId: number;
  scheduledDate: string;
  actualDate: string | null;
  status: TreatmentInstanceStatus;
  notes: string | null;
}

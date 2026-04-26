export interface TreatmentType {
  id: number;
  name: string;
  disease: string;
  product: string;
  dose: string | null;
  notes: string | null;
  intervalDays: number | null;
  repetitions: number | null;
  isRecurring: boolean;
  createdAt: string | null;
}

export type CostType = 'income' | 'outcome';

export interface CostCategory {
  id: number;
  name: string;
  description: string;
  type: CostType;
}

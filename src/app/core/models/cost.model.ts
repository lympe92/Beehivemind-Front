export interface Cost {
  id: number;
  date: string;
  name: string;
  category_id: number;
  category_name: string;
  amount: number;
}

export interface MonthlyCost {
  type: 'income' | 'outcome';
  month: number; // 1–12
  amount: number;
}

export interface YearCostSum {
  type: 'income' | 'outcome';
  amount: number;
}

export interface CostByCategory {
  category: string;
  amount: number;
}

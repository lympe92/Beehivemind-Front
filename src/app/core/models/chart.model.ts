export interface LineChartData {
  series: { name: string; data: number[] }[];
  categories: string[];
}

export interface BarChartData {
  series: { name: string; data: number[] }[];
  categories: string[];
  horizontal?: boolean;
}

export interface PieChartData {
  labels: string[];
  values: number[];
}

export interface RadialBarData {
  label: string;
  value: number; // 0-100
}

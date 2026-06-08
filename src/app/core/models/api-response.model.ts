export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
  meta?: Metadata;
}

export interface Metadata {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

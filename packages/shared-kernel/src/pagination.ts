export interface PageRequest {
  limit?: number;
  cursor?: string | null;
  includeTotal?: boolean;
}

export interface PaginationMeta {
  limit: number;
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  total: number | null;
}

export interface Page<T> {
  data: T[];
  pagination: PaginationMeta;
}

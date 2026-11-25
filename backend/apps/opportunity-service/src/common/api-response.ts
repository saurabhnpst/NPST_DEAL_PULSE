export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
};

export function ok<T>(data: T, meta?: PaginationMeta): ApiSuccess<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function fail(code: string, message: string, details?: string[]): ApiErrorBody {
  return {
    success: false,
    error: { code, message, ...(details?.length ? { details } : {}) },
  };
}
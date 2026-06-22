export type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function isApiError<T>(response: ApiResponse<T>): response is ApiError {
  return 'error' in response;
}

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return meta ? { data, meta } : { data };
}

export function apiError(code: string, message: string, details?: unknown): ApiError {
  return { error: { code, message, details } };
}

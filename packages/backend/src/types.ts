/**
 * Backend-specific types
 * Re-exports shared types and defines backend-only types
 */

export type * from '@afw/shared';

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  limit?: number;
  offset?: number;
  since?: string;
}

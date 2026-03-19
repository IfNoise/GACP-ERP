import { z } from 'zod';

// ─── PAGINATION ───────────────────────────────────────────────────────────────

export const PaginationOptsSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type PaginationOpts = z.infer<typeof PaginationOptsSchema>;

/**
 * Generic paginated response envelope.
 * Not a Zod schema (generic types require schema factories);
 * use this as a return type annotation only.
 */
export type PaginatedResult<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

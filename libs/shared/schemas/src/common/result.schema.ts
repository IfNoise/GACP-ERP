import { z } from 'zod';

// ─── RESULT PATTERN ──────────────────────────────────────────────────────────
/**
 * Functional Result type — avoids throwing exceptions in business logic.
 * Use `safeParse` style: check `result.success` before accessing `.data` or `.error`.
 *
 * @example
 * function createPlant(dto: CreatePlant): Result<Plant, DomainError> {
 *   if (!isValidStrain(dto.strainId)) {
 *     return err(new InvalidStrainError(dto.strainId));
 *   }
 *   return ok({ ...dto, id: randomUUID() });
 * }
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/** Create a successful Result */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/** Create a failed Result */
export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/** Type guard — narrows Result to success */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/** Type guard — narrows Result to error */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/** Unwrap the data from a successful Result, or throw if it's an error */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

// ─── DOMAIN ERROR ────────────────────────────────────────────────────────────
/**
 * Base class for all domain errors.
 * Use specific subclasses rather than throwing generic Error.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Maintain proper stack traces in V8
    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

// ─── API ERROR RESPONSE ──────────────────────────────────────────────────────
export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string().or(z.array(z.string())),
  timestamp: z.string().datetime({ offset: true }),
  path: z.string().optional(),
  requestId: z.string().uuid().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// ─── HTTP RESPONSE WRAPPER ───────────────────────────────────────────────────
export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z
      .object({
        requestId: z.string().uuid(),
        timestamp: z.string().datetime({ offset: true }),
        version: z.string(),
      })
      .optional(),
  });
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

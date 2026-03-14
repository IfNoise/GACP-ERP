import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  BatchSchema,
  CreateBatchSchema,
  CreateHarvestSchema,
  CreatePlantSchema,
  GrowthStageRecordSchema,
  HarvestRecordSchema,
  PaginationQuerySchema,
  PlantSchema,
  StageTransitionSchema,
  StrainSchema,
  UpdateBatchSchema,
  UpdatePlantSchema,
} from '@gacp-erp/shared-schemas';

const c = initContract();

/**
 * Pagination wrapper factory for list responses.
 */
function paginatedList<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });
}

// ─── PLANT CONTRACT ───────────────────────────────────────────────────────────
const plantsContract = c.router({
  list: {
    method: 'GET',
    path: '/plants',
    query: PaginationQuerySchema.extend({
      batch_id: z.string().uuid().optional(),
      zone_id: z.string().uuid().optional(),
      stage: z.string().optional(),
      is_active: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: paginatedList(PlantSchema),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'List plants with filters',
  },

  getById: {
    method: 'GET',
    path: '/plants/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: PlantSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get plant by ID',
  },

  create: {
    method: 'POST',
    path: '/plants',
    body: CreatePlantSchema,
    responses: {
      201: PlantSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      422: ApiErrorSchema,
    },
    summary: 'Create a new plant (OPERATOR+)',
  },

  update: {
    method: 'PATCH',
    path: '/plants/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: UpdatePlantSchema,
    responses: {
      200: PlantSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Update plant metadata',
  },

  transition: {
    method: 'POST',
    path: '/plants/:id/transition',
    pathParams: z.object({ id: z.string().uuid() }),
    body: StageTransitionSchema,
    responses: {
      200: PlantSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      422: ApiErrorSchema, // Invalid transition
    },
    summary: 'Transition plant to next growth stage (OPERATOR+)',
  },

  getStageHistory: {
    method: 'GET',
    path: '/plants/:id/stages',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: z.array(GrowthStageRecordSchema),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get full stage history for a plant',
  },

  getQrCode: {
    method: 'GET',
    path: '/plants/:id/qr',
    pathParams: z.object({ id: z.string().uuid() }),
    query: z.object({ format: z.enum(['png', 'svg']).default('png') }),
    responses: {
      200: z.unknown(), // Binary stream — handled separately
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get QR code image for plant',
  },
});

// ─── BATCH CONTRACT ──────────────────────────────────────────────────────────
const batchesContract = c.router({
  list: {
    method: 'GET',
    path: '/batches',
    query: PaginationQuerySchema.extend({
      strain_id: z.string().uuid().optional(),
      facility_id: z.string().uuid().optional(),
      status: z.string().optional(),
    }),
    responses: {
      200: paginatedList(BatchSchema),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'List batches',
  },

  getById: {
    method: 'GET',
    path: '/batches/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: BatchSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get batch by ID',
  },

  create: {
    method: 'POST',
    path: '/batches',
    body: CreateBatchSchema,
    responses: {
      201: BatchSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      409: ApiErrorSchema, // Duplicate batch_number
      422: ApiErrorSchema,
    },
    summary: 'Create a new batch (CULTIVATION_MANAGER+)',
  },

  update: {
    method: 'PATCH',
    path: '/batches/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: UpdateBatchSchema,
    responses: {
      200: BatchSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Update batch metadata',
  },

  harvest: {
    method: 'POST',
    path: '/batches/:id/harvest',
    pathParams: z.object({ id: z.string().uuid() }),
    body: CreateHarvestSchema,
    responses: {
      201: HarvestRecordSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      422: ApiErrorSchema,
    },
    summary: 'Record batch harvest (requires e-signature)',
  },

  getHarvests: {
    method: 'GET',
    path: '/batches/:id/harvests',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: z.array(HarvestRecordSchema),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get harvest records for batch',
  },
});

// ─── STRAINS CONTRACT ────────────────────────────────────────────────────────
const strainsContract = c.router({
  list: {
    method: 'GET',
    path: '/strains',
    query: PaginationQuerySchema,
    responses: {
      200: paginatedList(StrainSchema),
      401: ApiErrorSchema,
    },
    summary: 'List available strains',
  },

  getById: {
    method: 'GET',
    path: '/strains/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: StrainSchema,
      401: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get strain by ID',
  },
});

// ─── COMBINED CULTIVATION CONTRACT ───────────────────────────────────────────
export const cultivationContract = c.router({
  plants: plantsContract,
  batches: batchesContract,
  strains: strainsContract,
});

export type CultivationContract = typeof cultivationContract;

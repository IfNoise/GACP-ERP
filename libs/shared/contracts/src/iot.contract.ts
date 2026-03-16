import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  AlertHistorySchema,
  AlertThresholdSchema,
  ApiErrorSchema,
  CreateAlertThresholdSchema,
  PaginationQuerySchema,
} from '@gacp-erp/shared-schemas';

const c = initContract();

/**
 * Pagination response factory.
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

/**
 * IoT & Environmental Monitoring contract (EPIC 5).
 *
 * Sensor readings are served by proxying VictoriaMetrics IoT queries.
 * Alert thresholds and history are stored in PostgreSQL.
 *
 * Role access:
 *   - All authenticated users: read readings, alerts
 *   - QUALITY_MANAGER+: manage thresholds
 */
export const iotContract = c.router({
  // ─── SENSOR READINGS (proxy to VictoriaMetrics IoT) ──────────────────────

  /**
   * Instant query — latest readings for all sensors in a zone.
   * Proxied to: GET http://victoriametrics-iot:8429/api/v1/query
   */
  getZoneReadings: {
    method: 'GET',
    path: '/iot/zones/:zoneId/readings',
    pathParams: z.object({ zoneId: z.string().uuid() }),
    query: z.object({
      /** PromQL metric selector override, default: gacp_sensor_reading{zone_id=":zoneId"} */
      query: z.string().optional(),
      /** ISO 8601 evaluation timestamp, default: now */
      time: z.string().optional(),
    }),
    responses: {
      200: z.object({
        zone_id: z.string().uuid(),
        readings: z.array(
          z.object({
            sensor_type: z.string(),
            value: z.number(),
            unit: z.string().optional(),
            timestamp: z.number(),
          }),
        ),
      }),
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      502: ApiErrorSchema,
    },
    summary: 'Get latest sensor readings for a zone (proxied from VictoriaMetrics IoT)',
  },

  /**
   * Range query — historical readings for a zone over a time range.
   * Proxied to: GET http://victoriametrics-iot:8429/api/v1/query_range
   */
  getZoneHistory: {
    method: 'GET',
    path: '/iot/zones/:zoneId/history',
    pathParams: z.object({ zoneId: z.string().uuid() }),
    query: z.object({
      /** ISO 8601 start time */
      from: z.string(),
      /** ISO 8601 end time */
      to: z.string(),
      /** PromQL step (e.g. "1m", "5m", "1h"), default: "5m" */
      step: z.string().optional(),
      /** Sensor type filter */
      sensor_type: z.string().optional(),
    }),
    responses: {
      200: z.object({
        zone_id: z.string().uuid(),
        from: z.string(),
        to: z.string(),
        series: z.array(
          z.object({
            sensor_type: z.string(),
            unit: z.string().optional(),
            datapoints: z.array(z.tuple([z.number(), z.number()])),
          }),
        ),
      }),
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      502: ApiErrorSchema,
    },
    summary: 'Get historical sensor readings for a zone',
  },

  // ─── ALERT HISTORY ───────────────────────────────────────────────────────

  /**
   * Paginated alert history from PostgreSQL.
   */
  listAlerts: {
    method: 'GET',
    path: '/iot/alerts',
    query: PaginationQuerySchema.extend({
      zone_id: z.string().uuid().optional(),
      sensor_type: z.string().optional(),
      alert_level: z.enum(['WARNING', 'CRITICAL']).optional(),
      acknowledged: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }),
    responses: {
      200: paginatedList(AlertHistorySchema),
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'List alert history (paginated)',
  },

  // ─── ALERT THRESHOLDS ────────────────────────────────────────────────────

  /**
   * Create a new alert threshold.
   * Requires QUALITY_MANAGER or higher role.
   * AuditLevel: FULL — triggers electronic audit trail entry.
   */
  createThreshold: {
    method: 'POST',
    path: '/iot/thresholds',
    body: CreateAlertThresholdSchema,
    responses: {
      201: AlertThresholdSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      422: ApiErrorSchema,
    },
    summary: 'Create alert threshold (QUALITY_MANAGER+, AuditLevel: FULL)',
  },

  /**
   * List thresholds for a specific zone.
   */
  listThresholds: {
    method: 'GET',
    path: '/iot/thresholds',
    query: z.object({
      zone_id: z.string().uuid().optional(),
      sensor_type: z.string().optional(),
      is_active: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: z.array(AlertThresholdSchema),
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'List alert thresholds (optionally filtered by zone)',
  },

  /**
   * Get a threshold by ID.
   */
  getThresholdById: {
    method: 'GET',
    path: '/iot/thresholds/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: AlertThresholdSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get threshold by ID',
  },

  /**
   * Deactivate (soft-delete) a threshold.
   * Requires QUALITY_MANAGER or higher role.
   * AuditLevel: FULL
   */
  deactivateThreshold: {
    method: 'DELETE',
    path: '/iot/thresholds/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}),
    responses: {
      200: z.object({ id: z.string().uuid(), is_active: z.literal(false) }),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Deactivate threshold (QUALITY_MANAGER+, AuditLevel: FULL)',
  },
});

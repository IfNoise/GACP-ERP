import { createTestApp, type TestContext } from './helpers/create-test-app';
import { ThresholdService } from '../src/iot/threshold.service';
import { VmProxyService } from '../src/iot/vm-proxy.service';
import { AlertHistoryQueryService } from '../src/iot/alert-history-query.service';
import {
  authHeaders,
  createAdminPayload,
  createOperatorPayload,
  createQualityManagerPayload,
  createReadonlyPayload,
} from './helpers/mock-jwt';

const ZONE_UUID = 'a0000000-0000-0000-0000-000000000001';
const THRESHOLD_UUID = 'b0000000-0000-0000-0000-000000000001';

describe('IoT (E2E)', () => {
  let ctx: TestContext;
  let mockThreshold: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    deactivate: jest.Mock;
  };
  let mockVmProxy: {
    getZoneReadings: jest.Mock;
    getZoneHistory: jest.Mock;
  };
  let mockAlertHistory: {
    findAll: jest.Mock;
  };

  beforeAll(async () => {
    mockThreshold = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      deactivate: jest.fn(),
    };
    mockVmProxy = {
      getZoneReadings: jest.fn(),
      getZoneHistory: jest.fn(),
    };
    mockAlertHistory = {
      findAll: jest.fn(),
    };

    ctx = await createTestApp((builder) =>
      builder
        .overrideProvider(ThresholdService)
        .useValue(mockThreshold)
        .overrideProvider(VmProxyService)
        .useValue(mockVmProxy)
        .overrideProvider(AlertHistoryQueryService)
        .useValue(mockAlertHistory),
    );
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────── Auth requirement ─────────────────────

  describe('Auth guard', () => {
    it('GET /api/v1/iot/zones/:zoneId/readings — 401 without auth', async () => {
      const res = await ctx.app.inject({
        method: 'GET',
        url: `/api/v1/iot/zones/${ZONE_UUID}/readings`,
      });
      expect(res.statusCode).toBe(401);
    });

    it('POST /api/v1/iot/thresholds — 401 without auth', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/iot/thresholds',
        payload: {},
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ──────────────────── Zone Readings ────────────────────────

  describe('GET /api/v1/iot/zones/:zoneId/readings', () => {
    it('returns readings for valid zone', async () => {
      const data = [{ sensor_type: 'temperature', value: 25.3, timestamp: '2025-01-01T00:00:00Z' }];
      mockVmProxy.getZoneReadings.mockResolvedValue(data);

      const res = await ctx.app.inject({
        method: 'GET',
        url: `/api/v1/iot/zones/${ZONE_UUID}/readings`,
        headers: authHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual(data);
    });

    it('returns 400 for invalid zone UUID', async () => {
      const res = await ctx.app.inject({
        method: 'GET',
        url: '/api/v1/iot/zones/not-a-uuid/readings',
        headers: authHeaders(),
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ──────────────────── Zone History ─────────────────────────

  describe('GET /api/v1/iot/zones/:zoneId/history', () => {
    it('returns history with required from/to params', async () => {
      const data = { metric: 'temperature', values: [] as unknown[] };
      mockVmProxy.getZoneHistory.mockResolvedValue(data);

      const res = await ctx.app.inject({
        method: 'GET',
        url: `/api/v1/iot/zones/${ZONE_UUID}/history?from=2025-01-01T00:00:00Z&to=2025-01-02T00:00:00Z`,
        headers: authHeaders(),
      });

      expect(res.statusCode).toBe(200);
    });

    it('returns 400 when from/to are missing', async () => {
      const res = await ctx.app.inject({
        method: 'GET',
        url: `/api/v1/iot/zones/${ZONE_UUID}/history`,
        headers: authHeaders(),
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ──────────────────── Alerts ───────────────────────────────

  describe('GET /api/v1/iot/alerts', () => {
    it('returns paginated alert list', async () => {
      const data = { items: [], total: 0 };
      mockAlertHistory.findAll.mockResolvedValue(data);

      const res = await ctx.app.inject({
        method: 'GET',
        url: '/api/v1/iot/alerts?page=1&limit=10',
        headers: authHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual(data);
    });
  });

  // ──────────────────── Thresholds CRUD ──────────────────────

  describe('POST /api/v1/iot/thresholds', () => {
    it('QUALITY_MANAGER can create threshold', async () => {
      const created = { id: THRESHOLD_UUID, zone_id: ZONE_UUID, sensor_type: 'temperature' };
      mockThreshold.create.mockResolvedValue(created);

      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/iot/thresholds',
        headers: authHeaders(createQualityManagerPayload()),
        payload: {
          zone_id: ZONE_UUID,
          sensor_type: 'TEMPERATURE',
          min_value: 15,
          max_value: 32,
          alert_level: 'WARNING',
          created_by: '550e8400-e29b-41d4-a716-446655440002',
        },
      });

      expect(res.statusCode).toBe(201);
    });

    it('SUPER_ADMIN can create threshold', async () => {
      mockThreshold.create.mockResolvedValue({ id: THRESHOLD_UUID });

      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/iot/thresholds',
        headers: authHeaders(createAdminPayload()),
        payload: {
          zone_id: ZONE_UUID,
          sensor_type: 'HUMIDITY',
          min_value: 30,
          max_value: 90,
          alert_level: 'CRITICAL',
          created_by: '550e8400-e29b-41d4-a716-446655440001',
        },
      });

      expect(res.statusCode).toBe(201);
    });

    it('OPERATOR is forbidden from creating thresholds', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/iot/thresholds',
        headers: authHeaders(createOperatorPayload()),
        payload: {
          zone_id: ZONE_UUID,
          sensor_type: 'TEMPERATURE',
          min_value: 15,
          max_value: 32,
          alert_level: 'WARNING',
          created_by: '550e8400-e29b-41d4-a716-446655440000',
        },
      });

      expect(res.statusCode).toBe(403);
    });

    it('READONLY is forbidden from creating thresholds', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/iot/thresholds',
        headers: authHeaders(createReadonlyPayload()),
        payload: {
          zone_id: ZONE_UUID,
          sensor_type: 'TEMPERATURE',
          min_value: 15,
          max_value: 32,
          alert_level: 'WARNING',
          created_by: '550e8400-e29b-41d4-a716-446655440003',
        },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/iot/thresholds', () => {
    it('returns threshold list', async () => {
      mockThreshold.findAll.mockResolvedValue([]);

      const res = await ctx.app.inject({
        method: 'GET',
        url: '/api/v1/iot/thresholds',
        headers: authHeaders(),
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/iot/thresholds/:id', () => {
    it('returns single threshold', async () => {
      const threshold = { id: THRESHOLD_UUID, sensor_type: 'temperature' };
      mockThreshold.findById.mockResolvedValue(threshold);

      const res = await ctx.app.inject({
        method: 'GET',
        url: `/api/v1/iot/thresholds/${THRESHOLD_UUID}`,
        headers: authHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual(threshold);
    });
  });

  describe('DELETE /api/v1/iot/thresholds/:id', () => {
    it('QUALITY_MANAGER can deactivate threshold', async () => {
      mockThreshold.deactivate.mockResolvedValue({ id: THRESHOLD_UUID, is_active: false });

      const res = await ctx.app.inject({
        method: 'DELETE',
        url: `/api/v1/iot/thresholds/${THRESHOLD_UUID}`,
        headers: authHeaders(createQualityManagerPayload()),
      });

      expect(res.statusCode).toBe(200);
    });

    it('OPERATOR is forbidden from deactivating thresholds', async () => {
      const res = await ctx.app.inject({
        method: 'DELETE',
        url: `/api/v1/iot/thresholds/${THRESHOLD_UUID}`,
        headers: authHeaders(createOperatorPayload()),
      });

      expect(res.statusCode).toBe(403);
    });
  });
});

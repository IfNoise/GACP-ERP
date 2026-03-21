import { AlertEvaluationService } from './alert-evaluation.service';
import type { AlertThreshold } from '@gacp-erp/shared-schemas';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockDbInsert = jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) });
const mockDb = { insert: mockDbInsert };

const mockThresholdService = {
  findAllActive: jest.fn(),
};

const mockKafkaProducer = {
  publish: jest.fn(),
};

const mockConfig = {
  get: jest.fn((_key: string, fallback: string) => fallback),
};

// ─── Global Fetch Mock ──────────────────────────────────────────────────────

const originalFetch = global.fetch;

afterAll(() => {
  global.fetch = originalFetch;
});

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeThreshold(overrides: Partial<AlertThreshold> = {}): AlertThreshold {
  return {
    id: 'threshold-1',
    zone_id: 'zone-001' as AlertThreshold['zone_id'],
    sensor_type: 'temperature' as AlertThreshold['sensor_type'],
    min_value: 18.0,
    max_value: 28.0,
    alert_level: 'WARNING',
    is_active: true,
    created_by: 'user-1' as AlertThreshold['created_by'],
    updated_by: 'user-1' as AlertThreshold['updated_by'],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function mockFetchResponse(value: string): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        status: 'success',
        data: {
          resultType: 'vector',
          result: [{ metric: {}, value: [Date.now() / 1000, value] }],
        },
      }),
  }) as never;
}

function mockFetchEmpty(): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        status: 'success',
        data: { resultType: 'vector', result: [] },
      }),
  }) as never;
}

function mockFetchError(): void {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as never;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('AlertEvaluationService', () => {
  let service: AlertEvaluationService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) });

    service = new AlertEvaluationService(
      mockDb as never,
      mockConfig as never,
      mockThresholdService as never,
      mockKafkaProducer as never,
    );
  });

  describe('evaluate()', () => {
    it('does nothing when no active thresholds', async () => {
      mockThresholdService.findAllActive.mockResolvedValue([]);

      await service.evaluate();

      expect(mockKafkaProducer.publish).not.toHaveBeenCalled();
    });

    it('does not trigger alert when value is within range', async () => {
      mockThresholdService.findAllActive.mockResolvedValue([makeThreshold()]);
      mockFetchResponse('22.5'); // Within 18-28

      await service.evaluate();

      expect(mockKafkaProducer.publish).not.toHaveBeenCalled();
      expect(mockDbInsert).not.toHaveBeenCalled();
    });

    it('triggers alert when value exceeds max_value', async () => {
      mockThresholdService.findAllActive.mockResolvedValue([makeThreshold()]);
      mockFetchResponse('30.5'); // Above 28

      await service.evaluate();

      expect(mockDbInsert).toHaveBeenCalled();
      expect(mockKafkaProducer.publish).toHaveBeenCalled();
    });

    it('triggers alert when value is below min_value', async () => {
      mockThresholdService.findAllActive.mockResolvedValue([makeThreshold()]);
      mockFetchResponse('15.0'); // Below 18

      await service.evaluate();

      expect(mockDbInsert).toHaveBeenCalled();
      expect(mockKafkaProducer.publish).toHaveBeenCalled();
    });

    it('does not alert when VM IoT returns no data', async () => {
      mockThresholdService.findAllActive.mockResolvedValue([makeThreshold()]);
      mockFetchEmpty();

      await service.evaluate();

      expect(mockKafkaProducer.publish).not.toHaveBeenCalled();
    });

    it('handles VM IoT fetch error gracefully', async () => {
      mockThresholdService.findAllActive.mockResolvedValue([makeThreshold()]);
      mockFetchError();

      await expect(service.evaluate()).resolves.not.toThrow();
      expect(mockKafkaProducer.publish).not.toHaveBeenCalled();
    });

    it('publishes ThresholdBreachedEvent for CRITICAL alerts', async () => {
      mockThresholdService.findAllActive.mockResolvedValue([
        makeThreshold({ alert_level: 'CRITICAL' }),
      ]);
      mockFetchResponse('35.0'); // Above 28

      await service.evaluate();

      // One AlertTriggeredEvent + one ThresholdBreachedEvent
      expect(mockKafkaProducer.publish).toHaveBeenCalledTimes(2);
    });

    it('publishes only AlertTriggeredEvent for WARNING alerts', async () => {
      mockThresholdService.findAllActive.mockResolvedValue([
        makeThreshold({ alert_level: 'WARNING' }),
      ]);
      mockFetchResponse('35.0');

      await service.evaluate();

      expect(mockKafkaProducer.publish).toHaveBeenCalledTimes(1);
    });

    it('handles threshold loading error gracefully', async () => {
      mockThresholdService.findAllActive.mockRejectedValue(new Error('DB error'));

      await expect(service.evaluate()).resolves.not.toThrow();
    });

    it('evaluates multiple thresholds independently', async () => {
      mockThresholdService.findAllActive.mockResolvedValue([
        makeThreshold({ id: 't1' }),
        makeThreshold({ id: 't2', min_value: 20.0, max_value: 25.0 }),
      ]);
      mockFetchResponse('22.0'); // Within t1 range (18-28), within t2 range (20-25)

      await service.evaluate();

      expect(mockKafkaProducer.publish).not.toHaveBeenCalled();
    });
  });
});

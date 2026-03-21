import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ThresholdService } from './threshold.service';

// ─── Mock DB ────────────────────────────────────────────────────────────────

const mockInsert = jest.fn().mockReturnThis();
const mockValues = jest.fn().mockResolvedValue(undefined);
const mockSelect = jest.fn().mockReturnThis();
const mockFrom = jest.fn().mockReturnThis();
const mockWhere = jest.fn();
const mockUpdate = jest.fn().mockReturnThis();
const mockSet = jest.fn().mockReturnThis();

const mockDb = {
  insert: mockInsert,
  select: mockSelect,
  update: mockUpdate,
};

// Chain .values, .from, .where, .set
mockInsert.mockReturnValue({ values: mockValues });
mockSelect.mockReturnValue({ from: mockFrom });
mockFrom.mockReturnValue({ where: mockWhere });
mockUpdate.mockReturnValue({ set: mockSet });
mockSet.mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) });

// ─── Fixtures ───────────────────────────────────────────────────────────────

const NOW = new Date('2026-01-15T10:00:00Z');

const ROW_TEMPLATE = {
  id: 'threshold-1',
  zone_id: 'zone-001',
  sensor_type: 'temperature',
  min_value: '18.0',
  max_value: '28.0',
  alert_level: 'WARNING',
  is_active: true,
  created_by: 'user-1',
  updated_by: 'user-1',
  created_at: NOW,
  updated_at: NOW,
};

const USER = {
  sub: 'user-1',
  preferred_username: 'operator',
  realm_access: { roles: ['OPERATOR'] },
  iat: 1000000,
  exp: 2000000,
  iss: 'issuer',
} as never;

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ThresholdService', () => {
  let service: ThresholdService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ThresholdService(mockDb as never);
  });

  describe('create()', () => {
    it('throws BadRequestException when both min_value and max_value are null', async () => {
      const dto = {
        zone_id: 'zone-001',
        sensor_type: 'temperature',
        min_value: null,
        max_value: null,
        alert_level: 'WARNING',
      };

      await expect(service.create(dto as never, USER)).rejects.toThrow(BadRequestException);
    });

    it('creates threshold when min_value is provided', async () => {
      mockWhere.mockResolvedValueOnce([ROW_TEMPLATE]);

      const dto = {
        zone_id: 'zone-001',
        sensor_type: 'temperature',
        min_value: 18.0,
        max_value: null,
        alert_level: 'WARNING',
      };

      const result = await service.create(dto as never, USER);
      expect(result.zone_id).toBe('zone-001');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('creates threshold when max_value is provided', async () => {
      mockWhere.mockResolvedValueOnce([ROW_TEMPLATE]);

      const dto = {
        zone_id: 'zone-001',
        sensor_type: 'temperature',
        min_value: null,
        max_value: 28.0,
        alert_level: 'WARNING',
      };

      const result = await service.create(dto as never, USER);
      expect(result.sensor_type).toBe('temperature');
    });
  });

  describe('findById()', () => {
    it('returns threshold DTO when found', async () => {
      mockWhere.mockResolvedValueOnce([ROW_TEMPLATE]);

      const result = await service.findById('threshold-1');
      expect(result.id).toBe('threshold-1');
      expect(result.min_value).toBe(18.0);
      expect(result.max_value).toBe(28.0);
      expect(result.is_active).toBe(true);
    });

    it('throws NotFoundException when not found', async () => {
      mockWhere.mockResolvedValueOnce([]);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('converts string timestamps to ISO strings', async () => {
      mockWhere.mockResolvedValueOnce([ROW_TEMPLATE]);

      const result = await service.findById('threshold-1');
      expect(result.created_at).toBe(NOW.toISOString());
      expect(result.updated_at).toBe(NOW.toISOString());
    });

    it('handles null min/max values', async () => {
      mockWhere.mockResolvedValueOnce([{ ...ROW_TEMPLATE, min_value: null, max_value: null }]);

      const result = await service.findById('threshold-1');
      expect(result.min_value).toBeNull();
      expect(result.max_value).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('returns array of threshold DTOs', async () => {
      mockWhere.mockResolvedValueOnce([ROW_TEMPLATE, { ...ROW_TEMPLATE, id: 'threshold-2' }]);

      const results = await service.findAll({});
      expect(results).toHaveLength(2);
    });

    it('returns empty array when no thresholds', async () => {
      mockWhere.mockResolvedValueOnce([]);

      const results = await service.findAll({});
      expect(results).toHaveLength(0);
    });
  });

  describe('deactivate()', () => {
    it('throws BadRequestException when threshold is already inactive', async () => {
      mockWhere.mockResolvedValueOnce([{ ...ROW_TEMPLATE, is_active: false }]);

      await expect(service.deactivate('threshold-1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllActive()', () => {
    it('calls findAll with is_active: true', async () => {
      mockWhere.mockResolvedValueOnce([ROW_TEMPLATE]);

      const results = await service.findAllActive();
      expect(results).toHaveLength(1);
      expect(results[0]!.is_active).toBe(true);
    });
  });
});

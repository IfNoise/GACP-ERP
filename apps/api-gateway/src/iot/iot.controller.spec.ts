import { BadRequestException } from '@nestjs/common';
import { IotController } from './iot.controller';
import { type ThresholdService } from './threshold.service';
import { type VmProxyService } from './vm-proxy.service';
import { type AlertHistoryQueryService } from './alert-history-query.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

function makeMocks() {
  const thresholdService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    deactivate: jest.fn(),
  };
  const vmProxy = {
    getZoneReadings: jest.fn(),
    getZoneHistory: jest.fn(),
  };
  const alertHistoryQuery = {
    findAll: jest.fn(),
  };
  return { thresholdService, vmProxy, alertHistoryQuery };
}

const USER = {
  sub: 'user-1',
  preferred_username: 'operator',
  realm_access: { roles: ['QUALITY_MANAGER'] },
  iat: 1000,
  exp: 2000,
};

describe('IotController', () => {
  let controller: IotController;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    controller = new IotController(
      mocks.thresholdService as unknown as ThresholdService,
      mocks.vmProxy as unknown as VmProxyService,
      mocks.alertHistoryQuery as unknown as AlertHistoryQueryService,
    );
  });

  // ─── Sensor Readings ───────────────────────────────────────────────────

  it('getZoneReadings delegates to vmProxy', async () => {
    const data = { zone_id: 'z', readings: [] };
    mocks.vmProxy.getZoneReadings.mockResolvedValue(data);

    const result = await controller.getZoneReadings('z-uuid', 'q', 't');
    expect(result).toEqual(data);
    expect(mocks.vmProxy.getZoneReadings).toHaveBeenCalledWith('z-uuid', 'q', 't');
  });

  it('getZoneHistory delegates to vmProxy', async () => {
    const data = { zone_id: 'z', from: 'a', to: 'b', series: [] };
    mocks.vmProxy.getZoneHistory.mockResolvedValue(data);

    const result = await controller.getZoneHistory('z-uuid', 'a', 'b', '5m', 'temperature');
    expect(result).toEqual(data);
  });

  it('getZoneHistory throws when from/to missing', async () => {
    await expect(controller.getZoneHistory('z', '', 'b')).rejects.toThrow(BadRequestException);
  });

  // ─── Alert History ─────────────────────────────────────────────────────

  it('listAlerts delegates with parsed filters', async () => {
    mocks.alertHistoryQuery.findAll.mockResolvedValue({ data: [], total: 0 });

    await controller.listAlerts(
      '00000000-0000-0000-0000-000000000001',
      'temperature',
      'WARNING',
      'true',
      '2026-01-01',
      '2026-01-31',
      '2',
      '50',
    );

    expect(mocks.alertHistoryQuery.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        zone_id: '00000000-0000-0000-0000-000000000001',
        sensor_type: 'temperature',
        alert_level: 'WARNING',
        acknowledged: true,
        from: '2026-01-01',
        to: '2026-01-31',
        page: 2,
        limit: 50,
      }),
    );
  });

  it('listAlerts uses defaults for page/limit', async () => {
    mocks.alertHistoryQuery.findAll.mockResolvedValue({ data: [], total: 0 });

    await controller.listAlerts();

    expect(mocks.alertHistoryQuery.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('listAlerts rejects limit > 100 with 400', async () => {
    mocks.alertHistoryQuery.findAll.mockResolvedValue({ data: [], total: 0 });

    await expect(
      controller.listAlerts(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '1',
        '999',
      ),
    ).rejects.toThrow();
  });

  // ─── Thresholds ────────────────────────────────────────────────────────

  it('createThreshold with valid body creates threshold', async () => {
    mocks.thresholdService.create.mockResolvedValue({ id: 'th-1' });

    const body = {
      zone_id: '00000000-0000-0000-0000-000000000001',
      sensor_type: 'TEMPERATURE',
      min_value: 18,
      max_value: 28,
      alert_level: 'WARNING',
      created_by: '00000000-0000-0000-0000-000000000002',
    };

    const result = await controller.createThreshold(body, USER as never);
    expect(result).toEqual({ id: 'th-1' });
  });

  it('createThreshold with invalid body throws BadRequestException', async () => {
    await expect(controller.createThreshold({}, USER as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('listThresholds delegates to thresholdService', async () => {
    mocks.thresholdService.findAll.mockResolvedValue([]);

    const result = await controller.listThresholds('z', 'temperature', 'true');
    expect(result).toEqual([]);
    expect(mocks.thresholdService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ zone_id: 'z', sensor_type: 'temperature', is_active: true }),
    );
  });

  it('listThresholds without filters', async () => {
    mocks.thresholdService.findAll.mockResolvedValue([]);
    await controller.listThresholds();
    expect(mocks.thresholdService.findAll).toHaveBeenCalledWith({});
  });

  it('getThreshold delegates to thresholdService', async () => {
    mocks.thresholdService.findById.mockResolvedValue({ id: 'th-1' });

    const result = await controller.getThreshold('th-1');
    expect(result).toEqual({ id: 'th-1' });
  });

  it('deactivateThreshold delegates to thresholdService', async () => {
    mocks.thresholdService.deactivate.mockResolvedValue({ deactivated: true });

    const result = await controller.deactivateThreshold('th-1', USER as never);
    expect(result).toEqual({ deactivated: true });
  });
});

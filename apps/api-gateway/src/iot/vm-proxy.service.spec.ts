import { BadGatewayException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { VmProxyService } from './vm-proxy.service';

function makeConfig(vmUrl = 'http://vm-iot:8428'): ConfigService {
  return {
    get: (_key: string, fallback: string) => vmUrl ?? fallback,
  } as unknown as ConfigService;
}

describe('VmProxyService', () => {
  let service: VmProxyService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new VmProxyService(makeConfig());
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // ─── getZoneReadings ────────────────────────────────────────────────────

  describe('getZoneReadings', () => {
    it('returns readings from VictoriaMetrics', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              result: [
                {
                  metric: { sensor_type: 'temperature', unit: '°C' },
                  value: [1700000000, '22.5'],
                },
              ],
            },
          }),
      });

      const result = await service.getZoneReadings('zone-1');

      expect(result.zone_id).toBe('zone-1');
      expect(result.readings).toHaveLength(1);
      expect(result.readings[0]!.sensor_type).toBe('temperature');
      expect(result.readings[0]!.value).toBe(22.5);
      expect(result.readings[0]!.unit).toBe('°C');
    });

    it('uses queryOverride and time params', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { result: [] } }),
      });

      await service.getZoneReadings('zone-1', 'custom_query', '2026-01-01T00:00:00Z');

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('query=custom_query');
      expect(url).toContain('time=');
    });

    it('handles metric without unit', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              result: [{ metric: { full_topic: 'mqtt/temp' }, value: [100, '10'] }],
            },
          }),
      });

      const result = await service.getZoneReadings('z');
      expect(result.readings[0]!.sensor_type).toBe('mqtt/temp');
      expect(result.readings[0]!.unit).toBeUndefined();
    });

    it('falls back to "unknown" when metric has no sensor_type or full_topic', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { result: [{ metric: {}, value: [100, '1'] }] },
          }),
      });

      const result = await service.getZoneReadings('z');
      expect(result.readings[0]!.sensor_type).toBe('unknown');
    });
  });

  // ─── getZoneHistory ─────────────────────────────────────────────────────

  describe('getZoneHistory', () => {
    it('returns time series data', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              result: [
                {
                  metric: { sensor_type: 'humidity', unit: '%' },
                  values: [
                    [1700000000, '60'],
                    [1700000300, '61'],
                  ],
                },
              ],
            },
          }),
      });

      const result = await service.getZoneHistory('zone-1', '2026-01-01', '2026-01-02');

      expect(result.zone_id).toBe('zone-1');
      expect(result.series).toHaveLength(1);
      expect(result.series[0]!.sensor_type).toBe('humidity');
      expect(result.series[0]!.unit).toBe('%');
      expect(result.series[0]!.datapoints).toHaveLength(2);
      expect(result.series[0]!.datapoints[0]![1]).toBe(60);
    });

    it('includes sensorType filter in query', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { result: [] } }),
      });

      await service.getZoneHistory('z', '2026-01-01', '2026-01-02', '10m', 'temperature');

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('sensor_type%3D%22temperature%22');
    });

    it('handles result without unit', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { result: [{ metric: {}, values: [[100, '5']] }] },
          }),
      });

      const result = await service.getZoneHistory('z', 'a', 'b');
      expect(result.series[0]!.sensor_type).toBe('unknown');
      expect(result.series[0]!.unit).toBeUndefined();
    });
  });

  // ─── fetchVm error handling ─────────────────────────────────────────────

  describe('error handling', () => {
    it('throws BadGatewayException when fetch rejects (network error)', async () => {
      fetchSpy.mockRejectedValue(new Error('Connection refused'));

      await expect(service.getZoneReadings('z')).rejects.toThrow(BadGatewayException);
    });

    it('throws BadGatewayException on non-ok response', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 503 });

      await expect(service.getZoneReadings('z')).rejects.toThrow(BadGatewayException);
    });
  });
});

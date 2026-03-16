import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';

export interface ZoneReading {
  sensor_type: string;
  value: number;
  unit?: string;
  timestamp: number;
}

export interface ZoneReadingsResult {
  zone_id: string;
  readings: ZoneReading[];
}

export interface TimeSeriesDatapoint {
  timestamp: number;
  value: number;
}

export interface TimeSeriesSeries {
  sensor_type: string;
  unit?: string;
  datapoints: [number, number][];
}

export interface ZoneHistoryResult {
  zone_id: string;
  from: string;
  to: string;
  series: TimeSeriesSeries[];
}

interface VmInstantResult {
  metric: Record<string, string>;
  value: [number, string];
}

interface VmRangeResult {
  metric: Record<string, string>;
  values: [number, string][];
}

@Injectable()
export class VmProxyService {
  private readonly logger = new Logger(VmProxyService.name);
  private readonly vmIotBaseUrl: string;

  constructor(config: ConfigService) {
    this.vmIotBaseUrl = config.get<string>('VM_IOT_URL', 'http://victoriametrics-iot:8428');
  }

  /**
   * Queries VictoriaMetrics IoT for the latest readings in a zone.
   * Proxied from GET /iot/zones/:zoneId/readings
   */
  async getZoneReadings(
    zoneId: string,
    queryOverride?: string,
    time?: string,
  ): Promise<ZoneReadingsResult> {
    const query = queryOverride ?? `gacp_sensor_reading{zone_id="${zoneId}"}`;
    const params = new URLSearchParams({ query });
    if (time) params.set('time', time);

    const url = `${this.vmIotBaseUrl}/api/v1/query?${params.toString()}`;
    const response = await this.fetchVm<{ data: { result: VmInstantResult[] } }>(url);

    const readings: ZoneReading[] = response.data.result.map((r) => {
      const reading: ZoneReading = {
        sensor_type: r.metric['sensor_type'] ?? r.metric['full_topic'] ?? 'unknown',
        value: parseFloat(r.value[1]),
        timestamp: r.value[0],
      };
      const unit = r.metric['unit'];
      if (unit !== undefined) reading.unit = unit;
      return reading;
    });

    return { zone_id: zoneId, readings };
  }

  /**
   * Queries VictoriaMetrics IoT for historical range data in a zone.
   * Proxied from GET /iot/zones/:zoneId/history
   */
  async getZoneHistory(
    zoneId: string,
    from: string,
    to: string,
    step = '5m',
    sensorType?: string,
  ): Promise<ZoneHistoryResult> {
    let query = `gacp_sensor_reading{zone_id="${zoneId}"`;
    if (sensorType) query += `,sensor_type="${sensorType.toLowerCase()}"`;
    query += '}';

    const params = new URLSearchParams({ query, start: from, end: to, step });
    const url = `${this.vmIotBaseUrl}/api/v1/query_range?${params.toString()}`;
    const response = await this.fetchVm<{ data: { result: VmRangeResult[] } }>(url);

    const series: TimeSeriesSeries[] = response.data.result.map((r) => {
      const s: TimeSeriesSeries = {
        sensor_type: r.metric['sensor_type'] ?? 'unknown',
        datapoints: r.values.map(([ts, val]) => [ts, parseFloat(val)] as [number, number]),
      };
      const unit = r.metric['unit'];
      if (unit !== undefined) s.unit = unit;
      return s;
    });

    return { zone_id: zoneId, from, to, series };
  }

  private async fetchVm<T>(url: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    } catch (err) {
      this.logger.error(`VictoriaMetrics IoT unreachable: ${String(err)}`);
      throw new BadGatewayException('IoT metrics service unavailable');
    }

    if (!res.ok) {
      this.logger.error(`VictoriaMetrics IoT returned HTTP ${res.status} for ${url}`);
      throw new BadGatewayException(`IoT metrics service error: HTTP ${res.status}`);
    }

    return res.json() as Promise<T>;
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { and, eq, gte, lte, desc } from 'drizzle-orm';
import { type Database, alertHistoryTable } from '@gacp-erp/shared-database';
import { type AlertHistory } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface AlertHistoryFilters {
  zone_id?: string;
  sensor_type?: string;
  alert_level?: 'WARNING' | 'CRITICAL';
  acknowledged?: boolean;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export interface PaginatedAlerts {
  data: AlertHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AlertHistoryQueryService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findAll(filters: AlertHistoryFilters): Promise<PaginatedAlerts> {
    const conditions = [
      filters.zone_id != null ? eq(alertHistoryTable.zone_id, filters.zone_id) : undefined,
      filters.sensor_type != null
        ? eq(alertHistoryTable.sensor_type as never, filters.sensor_type)
        : undefined,
      filters.alert_level != null
        ? eq(alertHistoryTable.alert_level, filters.alert_level)
        : undefined,
      filters.acknowledged != null
        ? eq(alertHistoryTable.acknowledged, filters.acknowledged)
        : undefined,
      filters.from != null
        ? gte(alertHistoryTable.triggered_at, new Date(filters.from))
        : undefined,
      filters.to != null ? lte(alertHistoryTable.triggered_at, new Date(filters.to)) : undefined,
    ].filter(Boolean);

    const where =
      conditions.length > 0 ? and(...(conditions as NonNullable<typeof conditions>)) : undefined;

    const offset = (filters.page - 1) * filters.limit;

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(alertHistoryTable)
        .where(where)
        .orderBy(desc(alertHistoryTable.triggered_at))
        .limit(filters.limit)
        .offset(offset),
      this.db.select({ id: alertHistoryTable.id }).from(alertHistoryTable).where(where),
    ]);

    const total = countResult.length;

    return {
      data: rows.map(this.toDto),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  private toDto(row: typeof alertHistoryTable.$inferSelect): AlertHistory {
    return {
      id: row.id,
      threshold_id: row.threshold_id,
      zone_id: row.zone_id as AlertHistory['zone_id'],
      sensor_type: row.sensor_type as AlertHistory['sensor_type'],
      triggered_value: parseFloat(row.triggered_value),
      alert_level: row.alert_level,
      triggered_at: row.triggered_at.toISOString(),
      acknowledged: row.acknowledged,
      acknowledged_by: row.acknowledged_by as AlertHistory['acknowledged_by'],
      acknowledged_at: row.acknowledged_at?.toISOString() ?? null,
      source_hash: row.source_hash,
    };
  }
}

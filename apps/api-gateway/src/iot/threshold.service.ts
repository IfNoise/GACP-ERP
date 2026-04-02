import { Injectable, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { Database, alertThresholdsTable } from '@gacp-erp/shared-database';
import { type CreateAlertThreshold, type AlertThreshold } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';
import { type JwtPayload } from '@gacp-erp/shared-schemas';

@Injectable()
export class ThresholdService {
  private readonly logger = new Logger(ThresholdService.name);

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async create(dto: CreateAlertThreshold, user: JwtPayload): Promise<AlertThreshold> {
    if (dto.min_value == null && dto.max_value == null) {
      throw new BadRequestException('At least one of min_value or max_value must be provided');
    }

    const id = randomUUID();

    await this.db.insert(alertThresholdsTable).values({
      id,
      zone_id: dto.zone_id as string,
      sensor_type: dto.sensor_type,
      min_value: dto.min_value != null ? String(dto.min_value) : null,
      max_value: dto.max_value != null ? String(dto.max_value) : null,
      alert_level: dto.alert_level,
      is_active: true,
      created_by: user.sub,
      updated_by: user.sub,
    });

    this.logger.log(
      `Alert threshold created: id=${id} zone=${dto.zone_id} type=${dto.sensor_type}`,
    );

    return this.findById(id);
  }

  async findAll(filters: {
    zone_id?: string;
    sensor_type?: string;
    is_active?: boolean;
  }): Promise<AlertThreshold[]> {
    const rows = await this.db
      .select()
      .from(alertThresholdsTable)
      .where(
        and(
          filters.zone_id != null ? eq(alertThresholdsTable.zone_id, filters.zone_id) : undefined,
          filters.sensor_type != null
            ? eq(alertThresholdsTable.sensor_type as never, filters.sensor_type)
            : undefined,
          filters.is_active != null
            ? eq(alertThresholdsTable.is_active, filters.is_active)
            : undefined,
        ),
      );

    return rows.map(this.toDto);
  }

  async findById(id: string): Promise<AlertThreshold> {
    const [row] = await this.db
      .select()
      .from(alertThresholdsTable)
      .where(eq(alertThresholdsTable.id, id));

    if (!row) {
      throw new NotFoundException(`Alert threshold ${id} not found`);
    }

    return this.toDto(row);
  }

  async deactivate(id: string, user: JwtPayload): Promise<AlertThreshold> {
    const existing = await this.findById(id);
    if (!existing.is_active) {
      throw new BadRequestException(`Threshold ${id} is already inactive`);
    }

    await this.db
      .update(alertThresholdsTable)
      .set({ is_active: false, updated_by: user.sub, updated_at: new Date() })
      .where(eq(alertThresholdsTable.id, id));

    this.logger.log(`Alert threshold deactivated: id=${id} by=${user.sub}`);

    return this.findById(id);
  }

  /** Returns all active thresholds (used by AlertEvaluationService). */
  async findAllActive(): Promise<AlertThreshold[]> {
    return this.findAll({ is_active: true });
  }

  private toDto(row: typeof alertThresholdsTable.$inferSelect): AlertThreshold {
    return {
      id: row.id,
      zone_id: row.zone_id as AlertThreshold['zone_id'],
      sensor_type: row.sensor_type as AlertThreshold['sensor_type'],
      min_value: row.min_value != null ? parseFloat(row.min_value) : null,
      max_value: row.max_value != null ? parseFloat(row.max_value) : null,
      alert_level: row.alert_level,
      is_active: row.is_active,
      created_by: row.created_by as AlertThreshold['created_by'],
      updated_by: row.updated_by as AlertThreshold['updated_by'],
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}

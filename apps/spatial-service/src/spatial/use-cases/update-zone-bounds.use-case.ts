import { Injectable, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type { FacilityZone, UserId } from '@gacp-erp/shared-schemas';
import { SPATIAL_ZONE_TOPIC, type ZoneBoundsUpdatedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { SpatialRepository } from '../spatial.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class UpdateZoneBoundsUseCase {
  private readonly logger = new Logger(UpdateZoneBoundsUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: SpatialRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(
    zoneId: string,
    bounds_3d: [number, number, number, number, number, number],
    authorId: string,
  ): Promise<FacilityZone> {
    const existingZone = await this.repo.findZoneByIdOrThrow(zoneId);
    const now = new Date().toISOString();

    const zone = await this.db.transaction(async (tx) => {
      const updated = await this.repo.updateZoneBounds(tx, zoneId, bounds_3d, authorId as UserId);

      const event: ZoneBoundsUpdatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'spatial-service',
        topic: SPATIAL_ZONE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'spatial.zone.bounds_updated',
        payload: {
          zoneId: existingZone.id,
          zoneCode: existingZone.zone_code,
          zoneType: existingZone.zone_type,
          bounds3d: bounds_3d,
          updatedBy: authorId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: SPATIAL_ZONE_TOPIC,
        key: zoneId,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });

    this.logger.log(`Zone ${zone.zone_code} bounds updated: [${bounds_3d.join(', ')}]`);
    return zone;
  }
}

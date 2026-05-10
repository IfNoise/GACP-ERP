import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type { UserId } from '@gacp-erp/shared-schemas';
import { SPATIAL_RACKS_TOPIC, type RackDeletedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { SpatialRepository } from '../spatial.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class DeleteRackUseCase {
  private readonly logger = new Logger(DeleteRackUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: SpatialRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(rackId: string, authorId: string): Promise<void> {
    const rack = await this.repo.findRackByIdOrThrow(rackId);

    const traysPage = await this.repo.listTraysByRack(rackId, { page: 1, limit: 1000 });
    const occupiedTray = traysPage.data.find((t) => t.occupied_slots > 0);
    if (occupiedTray) {
      throw new ConflictException(
        `Cannot delete rack ${rack.rack_code}: tray ${occupiedTray.tray_code} has ${occupiedTray.occupied_slots} occupied slots`,
      );
    }

    const now = new Date().toISOString();

    await this.db.transaction(async (tx) => {
      await this.repo.deleteRack(tx, rackId);

      const event: RackDeletedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'spatial-service',
        topic: SPATIAL_RACKS_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'RACK_DELETED',
        payload: {
          rackId: rack.id,
          zoneId: rack.zone_id,
          rackCode: rack.rack_code,
          deletedBy: authorId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: SPATIAL_RACKS_TOPIC,
        key: rackId,
        payload: event as unknown as Record<string, unknown>,
      });
    });

    this.logger.log(`Rack deleted: ${rack.rack_code} (id: ${rackId})`);
  }
}

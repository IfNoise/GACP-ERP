import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type { UserId } from '@gacp-erp/shared-schemas';
import { SPATIAL_RACKS_TOPIC, type TrayDeletedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { SpatialRepository } from '../spatial.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class DeleteTrayUseCase {
  private readonly logger = new Logger(DeleteTrayUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: SpatialRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(trayId: string, authorId: string): Promise<void> {
    const tray = await this.repo.findTrayByIdOrThrow(trayId);

    if (tray.occupied_slots > 0) {
      throw new ConflictException(
        `Cannot delete tray ${tray.tray_code}: ${tray.occupied_slots} occupied slots`,
      );
    }

    const now = new Date().toISOString();

    await this.db.transaction(async (tx) => {
      await this.repo.deleteTray(tx, trayId);

      const event: TrayDeletedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: SPATIAL_RACKS_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'TRAY_DELETED',
        payload: {
          trayId: tray.id,
          rackId: tray.rack_id,
          trayCode: tray.tray_code,
          deletedBy: authorId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: SPATIAL_RACKS_TOPIC,
        key: trayId,
        payload: event as unknown as Record<string, unknown>,
      });
    });

    this.logger.log(`Tray deleted: ${tray.tray_code} (id: ${trayId})`);
  }
}

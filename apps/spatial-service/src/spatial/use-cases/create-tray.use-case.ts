import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type { CreateTray, Tray, UserId } from '@gacp-erp/shared-schemas';
import { SPATIAL_RACKS_TOPIC, type TrayCreatedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { SpatialRepository } from '../spatial.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class CreateTrayUseCase {
  private readonly logger = new Logger(CreateTrayUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: SpatialRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateTray, authorId: string): Promise<Tray> {
    if (!dto.rack_id) throw new Error('rack_id is required');
    const rackId: string = dto.rack_id;
    const rack = await this.repo.findRackByIdOrThrow(rackId);

    if (dto.shelf_index >= rack.shelf_count) {
      throw new ConflictException(
        `Shelf index ${dto.shelf_index} out of range for rack ${rack.rack_code} (${rack.shelf_count} shelves)`,
      );
    }

    const now = new Date().toISOString();

    const tray = await this.db.transaction(async (tx) => {
      const created = await this.repo.createTray(tx, {
        rack_id: rackId,
        shelf_index: dto.shelf_index,
        position_index: dto.position_index,
        tray_code: dto.tray_code,
        tray_size: dto.tray_size,
        plant_capacity: dto.plant_capacity ?? null,
        plant_layout: dto.plant_layout ?? null,
        occupied_slots: 0,
        qr_code: null,
      });

      const event: TrayCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'spatial-service',
        topic: SPATIAL_RACKS_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'TRAY_CREATED',
        payload: {
          trayId: created.id,
          rackId: rack.id,
          trayCode: created.tray_code,
          shelfIndex: created.shelf_index,
          positionIndex: created.position_index,
          traySize: created.tray_size,
          plantCapacity: created.plant_capacity,
          createdBy: authorId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: SPATIAL_RACKS_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(
      `Tray created: ${tray.tray_code} in rack ${rack.rack_code} shelf ${dto.shelf_index} pos ${dto.position_index}`,
    );
    return tray;
  }
}

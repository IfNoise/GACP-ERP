import { Injectable, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type { CreateRack, Rack, UserId } from '@gacp-erp/shared-schemas';
import { SPATIAL_RACKS_TOPIC, type RackCreatedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { SpatialRepository } from '../spatial.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class CreateRackUseCase {
  private readonly logger = new Logger(CreateRackUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: SpatialRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateRack, authorId: string): Promise<Rack> {
    // Verify zone exists
    const zone = await this.repo.findZoneByIdOrThrow(dto.zone_id);

    const rackCode = dto.rack_code ?? (await this.repo.nextRackCode(dto.zone_id));
    const now = new Date().toISOString();

    const rack = await this.db.transaction(async (tx) => {
      const created = await this.repo.createRack(tx, {
        zone_id: dto.zone_id,
        rack_code: rackCode,
        rack_type: dto.rack_type,
        shelf_count: dto.shelf_count,
        row_position: dto.row_position ?? null,
        column_position: dto.column_position ?? null,
        coordinates: null,
        max_tray_capacity: dto.max_tray_capacity ?? null,
        supported_tray_sizes: dto.supported_tray_sizes ?? null,
        qr_code: null,
      });

      // Auto-create shelves based on shelf_count
      for (let i = 0; i < dto.shelf_count; i++) {
        await this.repo.createShelf(tx, {
          rack_id: created.id,
          shelf_index: i,
          height_from_floor: null,
          max_trays: null,
          occupied_positions: 0,
        });
      }

      const event: RackCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: SPATIAL_RACKS_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'RACK_CREATED',
        payload: {
          rackId: created.id,
          zoneId: zone.id,
          rackCode: created.rack_code,
          rackType: created.rack_type,
          shelfCount: created.shelf_count,
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
      `Rack created: ${rack.rack_code} in zone ${zone.zone_code} (${rack.shelf_count} shelves)`,
    );
    return rack;
  }
}

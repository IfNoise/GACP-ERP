import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type {
  CreateFacilityZone,
  FacilityZone,
  AssignBatchToZone,
  ReleaseBatchFromZone,
  ZoneAssignment,
  UserId,
} from '@gacp-erp/shared-schemas';
import {
  SPATIAL_ZONE_TOPIC,
  type SpatialZoneCreatedEvent,
  type BatchAssignedToZoneEvent,
  type BatchReleasedFromZoneEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { SpatialRepository } from '../spatial.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class SpatialPlanningUseCase {
  private readonly logger = new Logger(SpatialPlanningUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: SpatialRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async createZone(dto: CreateFacilityZone, authorId: string): Promise<FacilityZone> {
    const zoneCode = await this.repo.nextZoneCode();
    const now = new Date().toISOString();

    const zone = await this.db.transaction(async (tx) => {
      const created = await this.repo.createZone(tx, {
        zone_code: zoneCode,
        zone_name: dto.zone_name,
        zone_type: dto.zone_type,
        area_sqm: dto.area_sqm,
        capacity: dto.capacity,
        parent_zone_id: dto.parent_zone_id ?? null,
        is_active: true,
        current_occupancy: 0,
        notes: dto.notes ?? null,
        created_by: authorId as UserId,
        updated_by: authorId as UserId,
      });

      const event: SpatialZoneCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: SPATIAL_ZONE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'spatial.zone.created',
        payload: {
          zoneId: created.id,
          zoneCode: created.zone_code,
          zoneType: created.zone_type,
          zoneName: created.zone_name,
          areaSqm: created.area_sqm ?? 0,
          capacity: created.capacity ?? 0,
          createdBy: authorId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: SPATIAL_ZONE_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(`Zone created: ${zone.zone_code} (id: ${zone.id})`);
    return zone;
  }

  async assignBatchToZone(dto: AssignBatchToZone, authorId: string): Promise<ZoneAssignment> {
    const zone = await this.repo.findZoneByIdOrThrow(dto.zone_id);
    const now = new Date().toISOString();

    // Capacity check
    if (zone.capacity !== null && zone.current_occupancy >= zone.capacity) {
      throw new ConflictException(
        `Zone ${zone.zone_code} is at full capacity (${zone.capacity}/${zone.capacity})`,
      );
    }

    // Check batch is not already assigned elsewhere
    const existing = await this.repo.findActiveAssignmentForBatch(dto.batch_id);
    if (existing) {
      throw new ConflictException(
        `Batch ${dto.batch_id} is already assigned to zone ${existing.zone_id}`,
      );
    }

    const assignment = await this.db.transaction(async (tx) => {
      const created = await this.repo.assignBatch(tx, {
        zone_id: dto.zone_id,
        batch_id: dto.batch_id,
        assigned_at: now,
        assigned_by: authorId as UserId,
        notes: dto.notes ?? null,
        created_by: authorId as UserId,
        updated_by: authorId as UserId,
      });

      const event: BatchAssignedToZoneEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: SPATIAL_ZONE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'spatial.zone.batch_assigned',
        payload: {
          assignmentId: created.id,
          zoneId: dto.zone_id,
          zoneCode: zone.zone_code,
          zoneType: zone.zone_type,
          batchId: dto.batch_id,
          assignedBy: authorId,
          assignedAt: created.assigned_at,
          occupancyAfterPct: zone.capacity
            ? Math.round(((zone.current_occupancy + 1) / zone.capacity) * 100)
            : 0,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: SPATIAL_ZONE_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(
      `Batch ${dto.batch_id} assigned to zone ${zone.zone_code} (assignment: ${assignment.id})`,
    );
    return assignment;
  }

  async releaseBatchFromZone(dto: ReleaseBatchFromZone, authorId: string): Promise<ZoneAssignment> {
    const now = new Date().toISOString();

    const assignment = await this.db.transaction(async (tx) => {
      const released = await this.repo.releaseBatch(
        tx,
        dto.assignment_id,
        authorId as UserId,
        dto.notes,
      );

      // Re-read the zone for event metadata
      const zoneForEvent = await this.repo.findZoneById(released.zone_id);

      const event: BatchReleasedFromZoneEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: SPATIAL_ZONE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'spatial.zone.batch_released',
        payload: {
          assignmentId: released.id,
          zoneId: released.zone_id,
          zoneCode: zoneForEvent?.zone_code ?? '',
          zoneType: (zoneForEvent?.zone_type ?? 'STORAGE') as
            | 'CULTIVATION'
            | 'PROCESSING'
            | 'STORAGE'
            | 'UTILITY'
            | 'OFFICE'
            | 'QUARANTINE',
          batchId: released.batch_id,
          releasedBy: authorId,
          releasedAt: released.released_at!,
          occupancyAfterPct: zoneForEvent?.capacity
            ? Math.round((zoneForEvent.current_occupancy / zoneForEvent.capacity) * 100)
            : 0,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: SPATIAL_ZONE_TOPIC,
        key: released.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return released;
    });

    this.logger.log(`Batch ${assignment.batch_id} released from zone ${assignment.zone_id}`);
    return assignment;
  }
}

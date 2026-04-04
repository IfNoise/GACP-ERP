import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Facility,
  type CreateFacility,
  type FacilityId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { FACILITY_TOPIC, type FacilityCreatedEvent } from '@gacp-erp/shared-events';
import { FacilityRepository } from '../facility.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

@Injectable()
export class CreateFacilityUseCase {
  private readonly logger = new Logger(CreateFacilityUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly facilityRepo: FacilityRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateFacility, createdBy: string): Promise<Facility> {
    const existing = await this.facilityRepo.findByCode(dto.facility_code);
    if (existing) {
      throw new BadRequestException(`Facility code "${dto.facility_code}" already exists`);
    }

    const facility = await this.db.transaction(async (tx) => {
      const created = await this.facilityRepo.createWithTx(tx, dto, createdBy);

      const event: FacilityCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: created.created_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: FACILITY_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: createdBy as UserId,
        eventType: 'FACILITY_CREATED',
        payload: {
          facilityId: created.id as FacilityId,
          facilityCode: created.facility_code,
          name: created.name,
          licenseNumber: created.license_number,
          createdBy: createdBy as UserId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: FACILITY_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(`Facility created: ${facility.id} (code: ${facility.facility_code})`);
    return facility;
  }
}

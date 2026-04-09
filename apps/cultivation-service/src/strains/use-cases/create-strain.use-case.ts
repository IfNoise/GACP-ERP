import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Strain, type CreateStrain, type UserId } from '@gacp-erp/shared-schemas';
import { STRAIN_TOPIC, type StrainCreatedEvent } from '@gacp-erp/shared-events';
import { StrainsRepository } from '../strains.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

@Injectable()
export class CreateStrainUseCase {
  private readonly logger = new Logger(CreateStrainUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly strainsRepo: StrainsRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateStrain, createdBy: string): Promise<Strain> {
    const existing = await this.strainsRepo.findByCode(dto.cultivar_code);
    if (existing) {
      throw new BadRequestException(`Cultivar code "${dto.cultivar_code}" already exists`);
    }

    const strain = await this.db.transaction(async (tx) => {
      const newStrain = await this.strainsRepo.createWithTx(tx, dto, createdBy);

      const event: StrainCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: newStrain.created_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: STRAIN_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: createdBy as UserId,
        eventType: 'STRAIN_CREATED',
        strainId: newStrain.id,
        cultivarCode: newStrain.cultivar_code,
        name: newStrain.name,
        species: newStrain.species,
        supplierId: newStrain.supplier_id ?? undefined,
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: STRAIN_TOPIC,
        key: newStrain.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return newStrain;
    });

    this.logger.log(`Strain created: ${strain.id} (code: ${strain.cultivar_code})`);
    return strain;
  }
}

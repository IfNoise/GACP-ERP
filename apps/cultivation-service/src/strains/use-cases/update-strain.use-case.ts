import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Strain, type UpdateStrain, type UserId } from '@gacp-erp/shared-schemas';
import { STRAIN_TOPIC, type StrainUpdatedEvent } from '@gacp-erp/shared-events';
import { StrainsRepository } from '../strains.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

@Injectable()
export class UpdateStrainUseCase {
  private readonly logger = new Logger(UpdateStrainUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly strainsRepo: StrainsRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(id: string, dto: UpdateStrain, updatedBy: string): Promise<Strain> {
    const existing = await this.strainsRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Strain ${id} not found`);
    }

    if (dto.cultivar_code && dto.cultivar_code !== existing.cultivar_code) {
      const duplicate = await this.strainsRepo.findByCode(dto.cultivar_code);
      if (duplicate) {
        throw new BadRequestException(`Cultivar code "${dto.cultivar_code}" already exists`);
      }
    }

    const strain = await this.db.transaction(async (tx) => {
      const updated = await this.strainsRepo.updateWithTx(tx, id, dto, updatedBy);

      const event: StrainUpdatedEvent = {
        eventId: randomUUID(),
        occurredAt: updated.updated_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: STRAIN_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: updatedBy as UserId,
        eventType: 'STRAIN_UPDATED',
        strainId: updated.id,
        changes: dto as Record<string, unknown>,
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: STRAIN_TOPIC,
        key: updated.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });

    this.logger.log(`Strain updated: ${strain.id}`);
    return strain;
  }
}

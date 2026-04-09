import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Strain, type DeactivateStrain, type UserId } from '@gacp-erp/shared-schemas';
import { STRAIN_TOPIC, type StrainDeactivatedEvent } from '@gacp-erp/shared-events';
import { StrainsRepository } from '../strains.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

@Injectable()
export class DeactivateStrainUseCase {
  private readonly logger = new Logger(DeactivateStrainUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly strainsRepo: StrainsRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(id: string, dto: DeactivateStrain, deactivatedBy: string): Promise<Strain> {
    const existing = await this.strainsRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Strain ${id} not found`);
    }
    if (!existing.is_active) {
      throw new BadRequestException(`Strain ${id} is already deactivated`);
    }

    const activeBatches = await this.strainsRepo.countActiveBatchesByStrain(id);
    if (activeBatches > 0) {
      throw new BadRequestException(
        `Cannot deactivate strain ${id}: ${activeBatches} active batch(es) reference it`,
      );
    }

    const strain = await this.db.transaction(async (tx) => {
      const deactivated = await this.strainsRepo.deactivateWithTx(tx, id, deactivatedBy);

      const event: StrainDeactivatedEvent = {
        eventId: randomUUID(),
        occurredAt: deactivated.updated_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: STRAIN_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: deactivatedBy as UserId,
        eventType: 'STRAIN_DEACTIVATED',
        strainId: deactivated.id,
        reason: dto.reason,
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: STRAIN_TOPIC,
        key: deactivated.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return deactivated;
    });

    this.logger.log(`Strain deactivated: ${strain.id}`);
    return strain;
  }
}

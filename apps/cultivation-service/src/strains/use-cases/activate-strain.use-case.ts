import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Strain, type UserId } from '@gacp-erp/shared-schemas';
import { STRAIN_TOPIC, type StrainActivatedEvent } from '@gacp-erp/shared-events';
import { StrainsRepository } from '../strains.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

export interface ActivateStrainCommand {
  strainId: string;
  inspectionId: string;
  inspectionNumber: string;
  activatedBy: string;
}

@Injectable()
export class ActivateStrainUseCase {
  private readonly logger = new Logger(ActivateStrainUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly strainsRepo: StrainsRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(cmd: ActivateStrainCommand): Promise<Strain> {
    const existing = await this.strainsRepo.findById(cmd.strainId);
    if (!existing) {
      throw new NotFoundException(`Strain ${cmd.strainId} not found`);
    }

    if (existing.is_active) {
      this.logger.log(`Strain ${cmd.strainId} is already active, skipping activation`);
      return existing;
    }

    const strain = await this.db.transaction(async (tx) => {
      const activated = await this.strainsRepo.activateWithTx(tx, cmd.strainId, cmd.activatedBy);

      const event: StrainActivatedEvent = {
        eventId: randomUUID(),
        occurredAt: activated.updated_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: STRAIN_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: cmd.activatedBy as UserId,
        eventType: 'STRAIN_ACTIVATED',
        strainId: activated.id,
        inspectionId: cmd.inspectionId,
        inspectionNumber: cmd.inspectionNumber,
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: STRAIN_TOPIC,
        key: activated.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return activated;
    });

    this.logger.log(`Strain activated: ${strain.id} (inspection: ${cmd.inspectionNumber})`);
    return strain;
  }
}

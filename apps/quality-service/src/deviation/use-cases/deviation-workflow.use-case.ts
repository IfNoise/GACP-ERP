import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import {
  type CreateDeviation,
  type InvestigateDeviation,
  type AssessDeviationImpact,
  type CloseDeviation,
  type Deviation,
  type UserId,
} from '@gacp-erp/shared-schemas';
import {
  QUALITY_DEVIATION_TOPIC,
  type DeviationReportedEvent,
  type DeviationInvestigatedEvent,
  type DeviationImpactAssessedEvent,
  type DeviationCapaLinkedEvent,
  type DeviationClosedEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { DeviationRepository } from '../deviation.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import {
  DeviationWorkflowEngine,
  InvalidDeviationTransitionError,
} from '../deviation-workflow.engine';

@Injectable()
export class DeviationWorkflowUseCase {
  private readonly logger = new Logger(DeviationWorkflowUseCase.name);
  private readonly engine = new DeviationWorkflowEngine();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: DeviationRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async report(dto: CreateDeviation, reportedBy: string): Promise<Deviation> {
    const devNumber = await this.repo.nextDeviationNumber();
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const deviation = await this.repo.create(tx, {
        deviation_number: devNumber,
        classification: dto.classification,
        category: dto.category,
        status: 'REPORTED',
        title: dto.title,
        description: dto.description,
        location: dto.location ?? null,
        batch_ids: dto.batch_ids ?? [],
        occurred_at: dto.occurred_at ?? null,
        reported_by: reportedBy as UserId,
        linked_capa_id: null,
        product_impact: null,
        electronic_signature: null,
        validation_status: 'unvalidated',
        validation_protocol_id: null,
        last_validated_at: null,
        next_review_date: null,
        retention_class: '7_YEAR',
        audit_tx_id: null,
        created_by: reportedBy as UserId,
        updated_by: reportedBy as UserId,
      });

      const event: DeviationReportedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_DEVIATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: reportedBy as UserId,
        eventType: 'quality.deviation.reported',
        payload: {
          deviationId: deviation.id,
          deviationNumber: deviation.deviation_number,
          classification: deviation.classification,
          category: deviation.category,
          reportedBy,
          location: deviation.location ?? null,
          batchIds: deviation.batch_ids,
          occurredAt: deviation.occurred_at ?? null,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_DEVIATION_TOPIC,
        key: deviation.id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`Deviation reported: ${deviation.deviation_number}`);
      return deviation;
    });
  }

  async investigate(id: string, dto: InvestigateDeviation, userId: string): Promise<Deviation> {
    const deviation = await this.repo.findByIdOrThrow(id);
    this.assertTransition(deviation, 'UNDER_INVESTIGATION');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      await this.repo.createInvestigation(tx, {
        deviation_id: id,
        investigator_id: userId as UserId,
        investigation_summary: dto.investigation_summary,
        immediate_containment_actions: dto.immediate_containment_actions,
        product_impact_assessment: dto.product_impact_assessment,
        batches_affected: dto.batches_affected ?? [],
        electronic_signature: dto.electronic_signature,
      });

      const updated = await this.repo.update(tx, id, {
        status: 'UNDER_INVESTIGATION',
        updated_by: userId as UserId,
      });

      const event: DeviationInvestigatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_DEVIATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.deviation.investigated',
        payload: {
          deviationId: id,
          deviationNumber: deviation.deviation_number,
          classification: deviation.classification,
          investigatorId: userId,
          investigatedAt: now,
          batchesAffected: dto.batches_affected ?? [],
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_DEVIATION_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }

  async assessImpact(id: string, dto: AssessDeviationImpact, userId: string): Promise<Deviation> {
    const deviation = await this.repo.findByIdOrThrow(id);
    this.assertTransition(deviation, 'IMPACT_ASSESSED');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'IMPACT_ASSESSED',
        product_impact: dto.product_impact,
        updated_by: userId as UserId,
      });

      const event: DeviationImpactAssessedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_DEVIATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.deviation.impact_assessed',
        payload: {
          deviationId: id,
          deviationNumber: deviation.deviation_number,
          classification: deviation.classification,
          capaRequired: dto.capa_required,
          productImpact: dto.product_impact,
          assessedBy: userId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_DEVIATION_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }

  async linkCapa(
    id: string,
    capaId: string,
    capaNumber: string,
    userId: string,
  ): Promise<Deviation> {
    const deviation = await this.repo.findByIdOrThrow(id);
    this.assertTransition(deviation, 'CAPA_INITIATED');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'CAPA_INITIATED',
        linked_capa_id: capaId,
        updated_by: userId as UserId,
      });

      const event: DeviationCapaLinkedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_DEVIATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.deviation.capa_linked',
        payload: {
          deviationId: id,
          deviationNumber: deviation.deviation_number,
          classification: deviation.classification,
          capaId,
          capaNumber,
          linkedBy: userId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_DEVIATION_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }

  async close(id: string, dto: CloseDeviation, userId: string): Promise<Deviation> {
    const deviation = await this.repo.findByIdOrThrow(id);
    this.assertTransition(deviation, 'CLOSED');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'CLOSED',
        electronic_signature: dto.electronic_signature,
        updated_by: userId as UserId,
      });

      const event: DeviationClosedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_DEVIATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.deviation.closed',
        payload: {
          deviationId: id,
          deviationNumber: deviation.deviation_number,
          classification: deviation.classification,
          closedBy: userId,
          auditTxId: null,
          closedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_DEVIATION_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`Deviation ${deviation.deviation_number} closed`);
      return updated;
    });
  }

  private assertTransition(deviation: Deviation, to: Deviation['status']): void {
    try {
      this.engine.transition(deviation, to);
    } catch (e) {
      if (e instanceof InvalidDeviationTransitionError) {
        throw new ConflictException(e.message);
      }
      throw e;
    }
  }
}

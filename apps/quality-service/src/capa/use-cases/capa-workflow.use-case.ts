import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import {
  type CreateCAPA,
  type InitiateRca,
  type CreateActionPlan,
  type RecordEffectivenessCheck,
  type CloseCapaDto,
  type CAPA,
  type UserId,
} from '@gacp-erp/shared-schemas';
import {
  QUALITY_CAPA_TOPIC,
  type CapaInitiatedEvent,
  type RcaCompletedEvent,
  type ActionPlanCreatedEvent,
  type CapaImplementedEvent,
  type EffectivenessCheckCompletedEvent,
  type CapaClosedEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { CapaRepository } from '../capa.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { CapaWorkflowEngine, InvalidCapaTransitionError } from '../capa-workflow.engine';

@Injectable()
export class CapaWorkflowUseCase {
  private readonly logger = new Logger(CapaWorkflowUseCase.name);
  private readonly engine = new CapaWorkflowEngine();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: CapaRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async create(dto: CreateCAPA, userId: string): Promise<CAPA> {
    const capaNumber = await this.repo.nextCapaNumber();
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const capa = await this.repo.create(tx, {
        capa_number: capaNumber,
        type: dto.type,
        source: dto.source,
        status: 'OPEN',
        title: dto.title,
        description: dto.description,
        root_cause_category: null,
        source_record_type: dto.source_record_type ?? null,
        source_record_id: dto.source_record_id ?? null,
        due_date: dto.due_date ?? null,
        assigned_to: (dto.assigned_to ?? null) as UserId | null,
        electronic_signature: null,
        validation_status: 'unvalidated',
        validation_protocol_id: null,
        last_validated_at: null,
        next_review_date: null,
        retention_class: '7_YEAR',
        audit_tx_id: null,
        created_by: userId as UserId,
        updated_by: userId as UserId,
      });

      const event: CapaInitiatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CAPA_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.capa.initiated',
        payload: {
          capaId: capa.id,
          capaNumber: capa.capa_number,
          capaType: capa.type,
          source: capa.source,
          initiatedBy: userId,
          sourceRecordType: dto.source_record_type ?? null,
          sourceRecordId: dto.source_record_id ?? null,
          dueDate: dto.due_date ?? null,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CAPA_TOPIC,
        key: capa.id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`CAPA created: ${capa.capa_number}`);
      return capa;
    });
  }

  async initiateRca(id: string, dto: InitiateRca, userId: string): Promise<CAPA> {
    const capa = await this.repo.findByIdOrThrow(id);
    this.assertTransition(capa, 'RCA_IN_PROGRESS');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      await this.repo.createRcaFinding(tx, {
        capa_id: id,
        root_cause_category: dto.root_cause_category,
        root_cause_description: dto.root_cause_description,
        contributing_factors: dto.contributing_factors ?? [],
        immediate_actions_taken: dto.immediate_actions_taken,
        investigated_by: userId as UserId,
      });

      const updated = await this.repo.update(tx, id, {
        status: 'RCA_IN_PROGRESS',
        root_cause_category: dto.root_cause_category,
        updated_by: userId as UserId,
      });

      const event: RcaCompletedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CAPA_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.capa.rca_completed',
        payload: {
          capaId: id,
          capaNumber: capa.capa_number,
          capaType: capa.type,
          rootCauseCategory: dto.root_cause_category,
          investigatedBy: userId,
          investigatedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CAPA_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }

  async createActionPlan(id: string, dto: CreateActionPlan, userId: string): Promise<CAPA> {
    const capa = await this.repo.findByIdOrThrow(id);
    this.assertTransition(capa, 'ACTION_PLAN');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      await this.repo.createActionPlans(tx, id, dto.actions);

      const updated = await this.repo.update(tx, id, {
        status: 'ACTION_PLAN',
        updated_by: userId as UserId,
      });

      const event: ActionPlanCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CAPA_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.capa.action_plan_created',
        payload: {
          capaId: id,
          capaNumber: capa.capa_number,
          capaType: capa.type,
          actionCount: dto.actions.length,
          createdBy: userId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CAPA_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }

  async implement(id: string, userId: string): Promise<CAPA> {
    const capa = await this.repo.findByIdOrThrow(id);
    this.assertTransition(capa, 'IMPLEMENTING');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'IMPLEMENTING',
        updated_by: userId as UserId,
      });

      const event: CapaImplementedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CAPA_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.capa.implemented',
        payload: {
          capaId: id,
          capaNumber: capa.capa_number,
          capaType: capa.type,
          implementedBy: userId,
          implementedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CAPA_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }

  async checkEffectiveness(
    id: string,
    dto: RecordEffectivenessCheck,
    userId: string,
  ): Promise<CAPA> {
    const capa = await this.repo.findByIdOrThrow(id);
    this.assertTransition(capa, 'EFFECTIVENESS_CHECK');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      await this.repo.createEffectivenessCheck(tx, {
        capa_id: id,
        result: dto.result,
        evidence_description: dto.evidence_description,
        check_date: dto.check_date,
        checked_by: userId as UserId,
        follow_up_capa_id: null,
        electronic_signature: dto.electronic_signature,
      });

      const updated = await this.repo.update(tx, id, {
        status: 'EFFECTIVENESS_CHECK',
        updated_by: userId as UserId,
      });

      const event: EffectivenessCheckCompletedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CAPA_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.capa.effectiveness_checked',
        payload: {
          capaId: id,
          capaNumber: capa.capa_number,
          capaType: capa.type,
          result: dto.result,
          checkedBy: userId,
          followUpCapaId: null,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CAPA_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }

  async close(id: string, dto: CloseCapaDto, userId: string): Promise<CAPA> {
    const capa = await this.repo.findByIdOrThrow(id);
    this.assertTransition(capa, 'CLOSED');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'CLOSED',
        electronic_signature: dto.electronic_signature,
        updated_by: userId as UserId,
      });

      const event: CapaClosedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CAPA_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.capa.closed',
        payload: {
          capaId: id,
          capaNumber: capa.capa_number,
          capaType: capa.type,
          closedBy: userId,
          auditTxId: null,
          closedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CAPA_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`CAPA ${capa.capa_number} closed`);
      return updated;
    });
  }

  private assertTransition(capa: CAPA, to: CAPA['status']): void {
    try {
      this.engine.transition(capa, to);
    } catch (e) {
      if (e instanceof InvalidCapaTransitionError) {
        throw new ConflictException(e.message);
      }
      throw e;
    }
  }
}

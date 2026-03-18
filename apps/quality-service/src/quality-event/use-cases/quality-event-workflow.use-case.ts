import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { type Database, capasTable } from '@gacp-erp/shared-database';
import {
  type CreateQualityEvent,
  type InvestigateQualityEvent,
  type LinkRecordToEvent,
  type CloseQualityEvent,
  type QualityEvent,
  type UserId,
} from '@gacp-erp/shared-schemas';
import {
  QUALITY_EVENTS_TOPIC,
  type QualityEventReportedEvent,
  type QualityEventInvestigatedEvent,
  type QualityEventCapaLinkedEvent,
  type QualityEventClosedEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type QualityEventRepository } from '../quality-event.repository';
import { type OutboxRepository } from '../../outbox/outbox.repository';
import { QualityEventWorkflowEngine } from '../quality-event-workflow.engine';

@Injectable()
export class QualityEventWorkflowUseCase {
  private readonly logger = new Logger(QualityEventWorkflowUseCase.name);
  private readonly engine = new QualityEventWorkflowEngine();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: QualityEventRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async create(dto: CreateQualityEvent, userId: string): Promise<QualityEvent> {
    const eventNumber = await this.repo.nextEventNumber();
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const created = await this.repo.create(tx, {
        event_number: eventNumber,
        type: dto.type,
        severity: dto.severity,
        status: 'OPEN',
        title: dto.title,
        description: dto.description,
        capa_id: null,
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

      const event: QualityEventReportedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_EVENTS_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.events.reported',
        payload: {
          eventId: created.id,
          eventNumber: created.event_number,
          eventType: created.type,
          severity: created.severity,
          reportedBy: userId,
          reportedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_EVENTS_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`Quality Event created: ${created.event_number}`);
      return created;
    });
  }

  async investigate(
    id: string,
    _dto: InvestigateQualityEvent,
    userId: string,
  ): Promise<QualityEvent> {
    const qe = await this.repo.findByIdOrThrow(id);
    this.engine.assertTransition(qe.status, 'INVESTIGATING');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'INVESTIGATING',
        updated_by: userId as UserId,
      });

      const event: QualityEventInvestigatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_EVENTS_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.events.investigated',
        payload: {
          eventId: qe.id,
          eventNumber: qe.event_number,
          eventType: qe.type,
          investigatedBy: userId,
          investigatedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_EVENTS_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`Quality Event ${qe.event_number} moved to INVESTIGATING`);
      return updated;
    });
  }

  async linkRecord(id: string, dto: LinkRecordToEvent, userId: string): Promise<QualityEvent> {
    const qe = await this.repo.findByIdOrThrow(id);
    const now = new Date().toISOString();

    const newStatus =
      dto.record_type === 'capa' && this.engine.isTransitionAllowed(qe.status, 'CAPA_INITIATED')
        ? ('CAPA_INITIATED' as const)
        : qe.status;

    return this.db.transaction(async (tx) => {
      await this.repo.addLinkedRecord(tx, id, dto.record_type, dto.record_id, userId as UserId);

      const updateData: Parameters<typeof this.repo.update>[2] = {
        updated_by: userId as UserId,
      };

      if (newStatus !== qe.status) {
        if (dto.record_type === 'capa') {
          updateData.capa_id = dto.record_id;
        }
        updateData.status = newStatus;
      }

      const updated = await this.repo.update(tx, id, updateData);

      if (dto.record_type === 'capa') {
        const capaRows = await tx
          .select({ capa_number: capasTable.capa_number })
          .from(capasTable)
          .where(eq(capasTable.id, dto.record_id))
          .limit(1);

        if (!capaRows[0]) {
          throw new NotFoundException(`CAPA ${dto.record_id} not found`);
        }

        const capaLinkedEvent: QualityEventCapaLinkedEvent = {
          eventId: randomUUID(),
          occurredAt: now,
          eventVersion: '1.0',
          producerService: 'quality-service',
          topic: QUALITY_EVENTS_TOPIC,
          correlationId: randomUUID(),
          triggeredBy: userId as UserId,
          eventType: 'quality.events.capa_linked',
          payload: {
            eventId: qe.id,
            eventNumber: qe.event_number,
            eventType: qe.type,
            capaId: dto.record_id,
            capaNumber: capaRows[0].capa_number,
            linkedBy: userId,
          },
        };

        await this.outboxRepo.createWithTx(tx, {
          topic: QUALITY_EVENTS_TOPIC,
          key: id,
          payload: capaLinkedEvent as unknown as Record<string, unknown>,
        });
      }

      this.logger.log(
        `Quality Event ${qe.event_number} linked to ${dto.record_type} ${dto.record_id}`,
      );
      return updated;
    });
  }

  async close(id: string, dto: CloseQualityEvent, userId: string): Promise<QualityEvent> {
    const qe = await this.repo.findByIdOrThrow(id);
    this.engine.assertTransition(qe.status, 'CLOSED');
    const now = new Date().toISOString();
    const auditTxId = randomUUID();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'CLOSED',
        electronic_signature: dto.electronic_signature,
        audit_tx_id: auditTxId,
        updated_by: userId as UserId,
      });

      const event: QualityEventClosedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_EVENTS_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.events.closed',
        payload: {
          eventId: qe.id,
          eventNumber: qe.event_number,
          eventType: qe.type,
          closureSummary: dto.closure_summary,
          auditTxId,
          closedBy: userId,
          closedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_EVENTS_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`Quality Event ${qe.event_number} closed`);
      return updated;
    });
  }
}

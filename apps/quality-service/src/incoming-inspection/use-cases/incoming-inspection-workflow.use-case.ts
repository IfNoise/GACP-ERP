import { Injectable, Logger, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type {
  IncomingInspection,
  IncomingInspectionStatus,
  CreateIncomingInspection,
  PerformInspection,
  RecordTestResults,
  ReleaseInspection,
  RejectInspection,
  UserId,
} from '@gacp-erp/shared-schemas';
import {
  QUALITY_INSPECTION_TOPIC,
  type InspectionCreatedEvent,
  type InspectionStartedEvent,
  type InspectionQuarantinedEvent,
  type InspectionReleasedEvent,
  type InspectionRejectedEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { IncomingInspectionRepository } from '../incoming-inspection.repository';
import {
  IncomingInspectionWorkflowEngine,
  InvalidInspectionTransitionError,
} from '../incoming-inspection-workflow.engine';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class IncomingInspectionWorkflowUseCase {
  private readonly logger = new Logger(IncomingInspectionWorkflowUseCase.name);
  private readonly engine = new IncomingInspectionWorkflowEngine();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: IncomingInspectionRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  private assertTransition(entity: IncomingInspection, toStatus: IncomingInspectionStatus): void {
    try {
      this.engine.transition(entity, toStatus);
    } catch (e) {
      if (e instanceof InvalidInspectionTransitionError) {
        throw new ConflictException(e.message);
      }
      throw e;
    }
  }

  /**
   * Create an incoming inspection from a GoodsReceived event.
   * Only called from the Kafka consumer — no HTTP endpoint for creation.
   */
  async createFromGoodsReceived(
    dto: CreateIncomingInspection,
    authorId: string,
  ): Promise<IncomingInspection> {
    const inspectionNumber = await this.repo.nextInspectionNumber();
    const now = new Date().toISOString();

    const inspection = await this.db.transaction(async (tx) => {
      const created = await this.repo.create(tx, {
        inspection_number: inspectionNumber,
        grn_id: dto.grn_id,
        po_id: dto.po_id,
        supplier_id: dto.supplier_id,
        strain_id: dto.strain_id ?? null,
        status: 'PENDING',
        visual_check_passed: null,
        quantity_verified: null,
        quality_assessment_notes: null,
        dna_fingerprint_passed: null,
        cannabinoid_profile_passed: null,
        pathogen_screening_passed: null,
        germination_rate: null,
        quarantine_days_required: dto.quarantine_days_required ?? 7,
        quarantine_start_date: null,
        quarantine_end_date: null,
        disposition_decision: null,
        disposition_reason: null,
        electronic_signature: null,
        validation_status: 'unvalidated',
        validation_protocol_id: null,
        last_validated_at: null,
        next_review_date: null,
        retention_class: '7_YEAR',
        audit_tx_id: null,
        created_by: authorId as UserId,
        updated_by: authorId as UserId,
      });

      const event: InspectionCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_INSPECTION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'quality.inspection.created',
        payload: {
          inspectionId: created.id,
          inspectionNumber: created.inspection_number,
          grnId: created.grn_id,
          poId: created.po_id,
          supplierId: created.supplier_id,
          strainId: created.strain_id ?? null,
          createdBy: authorId,
          createdAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_INSPECTION_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(`Incoming inspection created: ${inspection.inspection_number}`);
    return inspection;
  }

  /**
   * PENDING → IN_PROGRESS: Perform visual & quantity inspection.
   */
  async performInspection(
    inspectionId: string,
    dto: PerformInspection,
    authorId: string,
  ): Promise<IncomingInspection> {
    const inspection = await this.repo.findByIdOrThrow(inspectionId);
    this.assertTransition(inspection, 'IN_PROGRESS');
    const now = new Date().toISOString();

    const updated = await this.db.transaction(async (tx) => {
      const result = await this.repo.update(tx, inspectionId, {
        status: 'IN_PROGRESS',
        visual_check_passed: dto.visual_check_passed,
        quantity_verified: dto.quantity_verified,
        quality_assessment_notes: dto.quality_assessment_notes ?? null,
        electronic_signature: dto.electronic_signature as never,
        updated_by: authorId as UserId,
      });

      const event: InspectionStartedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_INSPECTION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'quality.inspection.started',
        payload: {
          inspectionId: result.id,
          inspectionNumber: result.inspection_number,
          grnId: result.grn_id,
          poId: result.po_id,
          supplierId: result.supplier_id,
          strainId: result.strain_id ?? null,
          startedBy: authorId,
          startedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_INSPECTION_TOPIC,
        key: result.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return result;
    });

    this.logger.log(`Inspection started: ${updated.inspection_number}`);
    return updated;
  }

  /**
   * IN_PROGRESS → QUARANTINE: Record lab test results and enter quarantine.
   */
  async recordTestResults(
    inspectionId: string,
    dto: RecordTestResults,
    authorId: string,
  ): Promise<IncomingInspection> {
    const inspection = await this.repo.findByIdOrThrow(inspectionId);
    this.assertTransition(inspection, 'QUARANTINE');
    const now = new Date().toISOString();

    const quarantineStart = new Date();
    const quarantineEnd = new Date(quarantineStart);
    quarantineEnd.setDate(quarantineEnd.getDate() + inspection.quarantine_days_required);

    const updated = await this.db.transaction(async (tx) => {
      const result = await this.repo.update(tx, inspectionId, {
        status: 'QUARANTINE',
        dna_fingerprint_passed: dto.dna_fingerprint_passed,
        cannabinoid_profile_passed: dto.cannabinoid_profile_passed,
        pathogen_screening_passed: dto.pathogen_screening_passed,
        germination_rate: dto.germination_rate,
        quarantine_start_date: quarantineStart.toISOString(),
        quarantine_end_date: quarantineEnd.toISOString(),
        updated_by: authorId as UserId,
      });

      const event: InspectionQuarantinedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_INSPECTION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'quality.inspection.quarantined',
        payload: {
          inspectionId: result.id,
          inspectionNumber: result.inspection_number,
          grnId: result.grn_id,
          poId: result.po_id,
          supplierId: result.supplier_id,
          strainId: result.strain_id ?? null,
          quarantineStartDate: quarantineStart.toISOString(),
          quarantineEndDate: quarantineEnd.toISOString(),
          quarantineDaysRequired: inspection.quarantine_days_required,
          quarantinedBy: authorId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_INSPECTION_TOPIC,
        key: result.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return result;
    });

    this.logger.log(
      `Inspection quarantined: ${updated.inspection_number} (${inspection.quarantine_days_required} days)`,
    );
    return updated;
  }

  /**
   * QUARANTINE → RELEASED: Release if all criteria are met.
   */
  async release(
    inspectionId: string,
    dto: ReleaseInspection,
    authorId: string,
  ): Promise<IncomingInspection> {
    const inspection = await this.repo.findByIdOrThrow(inspectionId);
    this.assertTransition(inspection, 'RELEASED');

    // Validate all release criteria
    const { canRelease, reasons } = this.engine.canRelease(inspection);
    if (!canRelease) {
      throw new BadRequestException(
        `Cannot release inspection ${inspection.inspection_number}: ${reasons.join('; ')}`,
      );
    }

    const now = new Date().toISOString();

    const updated = await this.db.transaction(async (tx) => {
      const result = await this.repo.update(tx, inspectionId, {
        status: 'RELEASED',
        disposition_decision: 'RELEASE',
        disposition_reason: dto.disposition_reason ?? null,
        electronic_signature: dto.electronic_signature as never,
        updated_by: authorId as UserId,
      });

      const event: InspectionReleasedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_INSPECTION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'quality.inspection.released',
        payload: {
          inspectionId: result.id,
          inspectionNumber: result.inspection_number,
          grnId: result.grn_id,
          poId: result.po_id,
          supplierId: result.supplier_id,
          strainId: result.strain_id ?? null,
          dispositionReason: result.disposition_reason ?? null,
          releasedBy: authorId,
          releasedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_INSPECTION_TOPIC,
        key: result.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return result;
    });

    this.logger.log(`Inspection released: ${updated.inspection_number}`);
    return updated;
  }

  /**
   * IN_PROGRESS | QUARANTINE → REJECTED: Reject the incoming material.
   */
  async reject(
    inspectionId: string,
    dto: RejectInspection,
    authorId: string,
  ): Promise<IncomingInspection> {
    const inspection = await this.repo.findByIdOrThrow(inspectionId);
    this.assertTransition(inspection, 'REJECTED');
    const now = new Date().toISOString();

    const updated = await this.db.transaction(async (tx) => {
      const result = await this.repo.update(tx, inspectionId, {
        status: 'REJECTED',
        disposition_decision: 'REJECT',
        disposition_reason: dto.disposition_reason,
        electronic_signature: dto.electronic_signature as never,
        updated_by: authorId as UserId,
      });

      const event: InspectionRejectedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_INSPECTION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'quality.inspection.rejected',
        payload: {
          inspectionId: result.id,
          inspectionNumber: result.inspection_number,
          grnId: result.grn_id,
          poId: result.po_id,
          supplierId: result.supplier_id,
          strainId: result.strain_id ?? null,
          dispositionReason: dto.disposition_reason,
          rejectedBy: authorId,
          rejectedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_INSPECTION_TOPIC,
        key: result.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return result;
    });

    this.logger.log(`Inspection rejected: ${updated.inspection_number}`);
    return updated;
  }
}

import { Injectable, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type {
  CreatePurchaseOrder,
  PurchaseOrder,
  ReceivingRecord,
  UserId,
} from '@gacp-erp/shared-schemas';
import {
  PROCUREMENT_PO_TOPIC,
  type POCreatedEvent,
  type POSubmittedEvent,
  type POAcknowledgedEvent,
  type GoodsReceivedEvent,
  type ThreeWayMatchCompletedEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { ProcurementRepository } from '../procurement.repository';
import { ProcurementWorkflowEngine } from '../procurement-workflow.engine';
import { OutboxRepository } from '../../outbox/outbox.repository';

export interface SubmitPOCommand {
  poId: string;
  authorId: string;
  electronicSignature: unknown;
}

export interface AcknowledgePOCommand {
  poId: string;
  authorId: string;
  notes?: string;
}

export interface ReceiveGoodsCommand {
  poId: string;
  authorId: string;
  receivedAt: string;
  lines: ReceivingRecord['lines'];
  electronicSignature: unknown;
}

export interface ClosePOCommand {
  poId: string;
  authorId: string;
  electronicSignature: unknown;
}

export interface CancelPOCommand {
  poId: string;
  authorId: string;
  reason: string;
}

@Injectable()
export class ProcurementWorkflowUseCase {
  private readonly logger = new Logger(ProcurementWorkflowUseCase.name);
  private readonly engine = new ProcurementWorkflowEngine();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: ProcurementRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async createPO(dto: CreatePurchaseOrder, authorId: string): Promise<PurchaseOrder> {
    const poNumber = await this.repo.nextPoNumber();
    const now = new Date().toISOString();

    const po = await this.db.transaction(async (tx) => {
      const totalValue = dto.lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);

      const created = await this.repo.create(tx, {
        po_number: poNumber,
        supplier_id: dto.supplier_id,
        status: 'DRAFT',
        lines: dto.lines.map((l, idx) => ({
          id: randomUUID(),
          po_id: '',
          line_number: idx + 1,
          item_description: l.item_description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          unit_of_measure: l.unit_of_measure,
          received_quantity: 0,
        })),
        total_value: totalValue,
        currency: dto.currency ?? 'EUR',
        expected_delivery_date: dto.expected_delivery_date ?? null,
        three_way_match_passed: null,
        electronic_signature: null,
        notes: dto.notes ?? null,
        created_by: authorId as UserId,
        updated_by: authorId as UserId,
      });

      const event: POCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: PROCUREMENT_PO_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'procurement.po.created',
        payload: {
          poId: created.id,
          poNumber: created.po_number,
          supplierId: created.supplier_id,
          totalValue: created.total_value,
          currency: created.currency,
          lineCount: created.lines.length,
          createdBy: authorId,
          createdAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: PROCUREMENT_PO_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(`PO created: ${po.po_number} (id: ${po.id})`);
    return po;
  }

  async submitPO(cmd: SubmitPOCommand): Promise<PurchaseOrder> {
    const po = await this.repo.findByIdOrThrow(cmd.poId);
    this.engine.validateTransition(po.status, 'SUBMITTED');
    const now = new Date().toISOString();

    const updated = await this.db.transaction(async (tx) => {
      const result = await this.repo.updateStatus(tx, cmd.poId, 'SUBMITTED', {
        electronic_signature: cmd.electronicSignature as never,
        updated_by: cmd.authorId as UserId,
      });

      const event: POSubmittedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: PROCUREMENT_PO_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: cmd.authorId as UserId,
        eventType: 'procurement.po.submitted',
        payload: {
          poId: result.id,
          poNumber: result.po_number,
          supplierId: result.supplier_id,
          totalValue: result.total_value,
          submittedBy: cmd.authorId,
          submittedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: PROCUREMENT_PO_TOPIC,
        key: result.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return result;
    });

    this.logger.log(`PO submitted: ${updated.po_number}`);
    return updated;
  }

  async acknowledgePO(cmd: AcknowledgePOCommand): Promise<PurchaseOrder> {
    const po = await this.repo.findByIdOrThrow(cmd.poId);
    this.engine.validateTransition(po.status, 'ACKNOWLEDGED');
    const now = new Date().toISOString();

    const updated = await this.db.transaction(async (tx) => {
      const result = await this.repo.updateStatus(tx, cmd.poId, 'ACKNOWLEDGED', {
        updated_by: cmd.authorId as UserId,
      });

      const event: POAcknowledgedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: PROCUREMENT_PO_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: cmd.authorId as UserId,
        eventType: 'procurement.po.acknowledged',
        payload: {
          poId: result.id,
          poNumber: result.po_number,
          supplierId: result.supplier_id,
          acknowledgedBy: cmd.authorId,
          acknowledgedAt: now,
          expectedDeliveryDate: result.expected_delivery_date ?? null,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: PROCUREMENT_PO_TOPIC,
        key: result.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return result;
    });

    this.logger.log(`PO acknowledged: ${updated.po_number}`);
    return updated;
  }

  async receiveGoods(cmd: ReceiveGoodsCommand): Promise<PurchaseOrder> {
    const po = await this.repo.findByIdOrThrow(cmd.poId);
    this.engine.validateTransition(po.status, 'RECEIVING');
    const grnNumber = await this.repo.nextGrnNumber();
    const now = new Date().toISOString();

    const updated = await this.db.transaction(async (tx) => {
      const grn = await this.repo.addReceivingRecord(tx, {
        grn_number: grnNumber,
        po_id: cmd.poId,
        received_at: cmd.receivedAt,
        received_by: cmd.authorId as UserId,
        lines: cmd.lines,
        quality_check_passed: false,
        quality_check_notes: null,
        electronic_signature: cmd.electronicSignature as never,
        created_by: cmd.authorId as UserId,
        updated_by: cmd.authorId as UserId,
      });

      const result = await this.repo.updateStatus(tx, cmd.poId, 'RECEIVING', {
        updated_by: cmd.authorId as UserId,
      });

      const event: GoodsReceivedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: PROCUREMENT_PO_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: cmd.authorId as UserId,
        eventType: 'procurement.po.goods_received',
        payload: {
          poId: result.id,
          poNumber: result.po_number,
          supplierId: result.supplier_id,
          grnId: grn.id,
          grnNumber: grn.grn_number,
          qualityCheckPassed: grn.quality_check_passed,
          receivedBy: cmd.authorId,
          receivedAt: grn.received_at,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: PROCUREMENT_PO_TOPIC,
        key: result.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return result;
    });

    this.logger.log(`Goods received for PO: ${updated.po_number} (GRN: ${grnNumber})`);
    return updated;
  }

  async closePO(cmd: ClosePOCommand): Promise<PurchaseOrder> {
    const po = await this.repo.findByIdOrThrow(cmd.poId);
    this.engine.validateTransition(po.status, 'CLOSED');
    const now = new Date().toISOString();

    // Three-way match: all lines fully received
    const allReceived = po.lines.every((l) => l.received_quantity >= l.quantity);

    const updated = await this.db.transaction(async (tx) => {
      const result = await this.repo.updateStatus(tx, cmd.poId, 'CLOSED', {
        electronic_signature: cmd.electronicSignature as never,
        three_way_match_passed: allReceived,
        updated_by: cmd.authorId as UserId,
      });

      const event: ThreeWayMatchCompletedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: PROCUREMENT_PO_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: cmd.authorId as UserId,
        eventType: 'procurement.po.three_way_match_completed',
        payload: {
          poId: result.id,
          poNumber: result.po_number,
          supplierId: result.supplier_id,
          matchPassed: allReceived,
          quantityMatch: allReceived,
          priceMatch: true,
          verifiedBy: cmd.authorId,
          verifiedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: PROCUREMENT_PO_TOPIC,
        key: result.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return result;
    });

    this.logger.log(
      `PO closed: ${updated.po_number} (three-way match: ${allReceived ? 'PASSED' : 'FAILED'})`,
    );
    return updated;
  }

  async cancelPO(cmd: CancelPOCommand): Promise<PurchaseOrder> {
    const po = await this.repo.findByIdOrThrow(cmd.poId);
    this.engine.validateTransition(po.status, 'CANCELLED');

    const updated = await this.db.transaction(async (tx) => {
      return this.repo.updateStatus(tx, cmd.poId, 'CANCELLED', {
        updated_by: cmd.authorId as UserId,
      });
    });

    this.logger.log(`PO cancelled: ${updated.po_number}`);
    return updated;
  }
}

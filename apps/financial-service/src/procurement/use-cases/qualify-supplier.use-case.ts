import { Injectable, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type { Supplier, SupplierQualificationStatus, UserId } from '@gacp-erp/shared-schemas';
import { SUPPLIER_TOPIC, type SupplierQualifiedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { SupplierRepository } from '../supplier.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

export interface QualifySupplierCommand {
  supplierId: string;
  qualificationStatus: SupplierQualificationStatus;
  qualificationExpiry?: string | undefined;
  notes?: string | undefined;
  authorId: string;
}

@Injectable()
export class QualifySupplierUseCase {
  private readonly logger = new Logger(QualifySupplierUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly supplierRepo: SupplierRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(cmd: QualifySupplierCommand): Promise<Supplier> {
    const now = new Date().toISOString();

    const updated = await this.db.transaction(async (tx) => {
      const result = await this.supplierRepo.update(tx, cmd.supplierId, {
        qualification_status: cmd.qualificationStatus,
        ...(cmd.qualificationExpiry !== undefined && {
          qualification_expiry: cmd.qualificationExpiry,
        }),
        ...(cmd.notes !== undefined && { notes: cmd.notes ?? null }),
        updated_by: cmd.authorId as UserId,
      });

      const event: SupplierQualifiedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: SUPPLIER_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: cmd.authorId as UserId,
        eventType: 'procurement.supplier.qualified',
        payload: {
          supplierId: result.id,
          supplierCode: result.supplier_code,
          qualificationStatus: result.qualification_status,
          qualifiedBy: cmd.authorId,
          qualifiedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: SUPPLIER_TOPIC,
        key: result.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return result;
    });

    this.logger.log(
      `Supplier ${updated.supplier_code} qualified as ${updated.qualification_status}`,
    );
    return updated;
  }
}

import { Injectable, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type { CreateSupplier, Supplier, UserId } from '@gacp-erp/shared-schemas';
import { SUPPLIER_TOPIC, type SupplierCreatedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { SupplierRepository } from '../supplier.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class CreateSupplierUseCase {
  private readonly logger = new Logger(CreateSupplierUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: SupplierRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateSupplier, authorId: string): Promise<Supplier> {
    const supplierCode = await this.repo.nextSupplierCode();
    const now = new Date().toISOString();

    const supplier = await this.db.transaction(async (tx) => {
      const created = await this.repo.create(tx, {
        supplier_code: supplierCode,
        name: dto.name,
        qualification_status: 'PROVISIONAL',
        qualification_expiry: null,
        contact_details: {
          email: dto.contact_details?.email ?? null,
          phone: dto.contact_details?.phone ?? null,
          address: dto.contact_details?.address ?? null,
          contact_person: dto.contact_details?.contact_person ?? null,
        },
        is_active: true,
        notes: dto.notes ?? null,
        created_by: authorId as UserId,
        updated_by: authorId as UserId,
      });

      const event: SupplierCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: SUPPLIER_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'procurement.supplier.created',
        payload: {
          supplierId: created.id,
          supplierCode: created.supplier_code,
          name: created.name,
          qualificationStatus: created.qualification_status,
          createdBy: authorId,
          createdAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: SUPPLIER_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(`Supplier created: ${supplier.supplier_code} (id: ${supplier.id})`);
    return supplier;
  }
}

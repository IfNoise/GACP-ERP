import { Injectable, Logger, Inject } from '@nestjs/common';
import { type Database } from '@gacp-erp/shared-database';
import type { CreateSupplier, Supplier, UserId } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type SupplierRepository } from '../supplier.repository';

@Injectable()
export class CreateSupplierUseCase {
  private readonly logger = new Logger(CreateSupplierUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: SupplierRepository,
  ) {}

  async execute(dto: CreateSupplier, authorId: string): Promise<Supplier> {
    const supplierCode = await this.repo.nextSupplierCode();

    const supplier = await this.db.transaction(async (tx) => {
      return this.repo.create(tx, {
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
    });

    this.logger.log(`Supplier created: ${supplier.supplier_code} (id: ${supplier.id})`);
    return supplier;
  }
}

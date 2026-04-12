import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, inArray, isNotNull } from 'drizzle-orm';
import {
  strainsTable,
  batchesTable,
  incomingInspectionsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import {
  type Strain,
  type CreateStrain,
  type UpdateStrain,
  type PaginationQuery,
  type PaginatedResponse,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class StrainsRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Strain | null> {
    const rows = await this.db
      .select()
      .from(strainsTable)
      .where(and(eq(strainsTable.id, id), eq(strainsTable.is_deleted, false)))
      .limit(1);

    if (!rows[0]) return null;

    const inspections = await this.db
      .select({ status: incomingInspectionsTable.status })
      .from(incomingInspectionsTable)
      .where(
        and(
          eq(incomingInspectionsTable.strain_id, id),
          isNotNull(incomingInspectionsTable.strain_id),
        ),
      )
      .orderBy(desc(incomingInspectionsTable.created_at))
      .limit(1);

    return this.mapRow(rows[0], inspections[0]?.status ?? null);
  }

  async findByCode(cultivarCode: string): Promise<Strain | null> {
    const rows = await this.db
      .select()
      .from(strainsTable)
      .where(and(eq(strainsTable.cultivar_code, cultivarCode), eq(strainsTable.is_deleted, false)))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findMany(
    filters: { species?: string; supplier_id?: string; is_active?: boolean },
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Strain>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(strainsTable)
      .where(
        and(
          eq(strainsTable.is_deleted, false),
          filters.species ? eq(strainsTable.species, filters.species) : undefined,
          filters.supplier_id ? eq(strainsTable.supplier_id, filters.supplier_id) : undefined,
          filters.is_active !== undefined
            ? eq(strainsTable.is_active, filters.is_active)
            : undefined,
        ),
      )
      .limit(limit)
      .offset(offset)
      .orderBy(desc(strainsTable.created_at));

    // Fetch latest inspection status for each strain in one query
    const strainIds = rows.map((r) => r.id);
    const statusMap = new Map<string, string>();

    if (strainIds.length > 0) {
      const inspections = await this.db
        .select({
          strain_id: incomingInspectionsTable.strain_id,
          status: incomingInspectionsTable.status,
        })
        .from(incomingInspectionsTable)
        .where(
          and(
            inArray(incomingInspectionsTable.strain_id, strainIds),
            isNotNull(incomingInspectionsTable.strain_id),
          ),
        )
        .orderBy(desc(incomingInspectionsTable.created_at));

      // Keep only the most recent entry per strain (result already DESC by created_at)
      for (const row of inspections) {
        if (row.strain_id && !statusMap.has(row.strain_id)) {
          statusMap.set(row.strain_id, row.status);
        }
      }
    }

    return {
      data: rows.map((r) => this.mapRow(r, statusMap.get(r.id) ?? null)),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async createWithTx(tx: DbContext, dto: CreateStrain, createdBy: string): Promise<Strain> {
    const rows = await tx
      .insert(strainsTable)
      .values({
        name: dto.name,
        cultivar_code: dto.cultivar_code,
        species: dto.species ?? 'hybrid',
        genetics: dto.genetics,
        thc_percentage_min: dto.thc_percentage_min?.toString(),
        thc_percentage_max: dto.thc_percentage_max?.toString(),
        cbd_percentage_min: dto.cbd_percentage_min?.toString(),
        cbd_percentage_max: dto.cbd_percentage_max?.toString(),
        flowering_time_days_min: dto.flowering_time_days_min,
        flowering_time_days_max: dto.flowering_time_days_max,
        expected_yield_grams_min: dto.expected_yield_grams_min?.toString(),
        expected_yield_grams_max: dto.expected_yield_grams_max?.toString(),
        supplier_id: dto.supplier_id,
        notes: dto.notes,
        certificate_url: dto.certificate_url,
        breeder: dto.breeder,
        seed_bank: dto.seed_bank,
        source_type: dto.source_type ?? 'seed',
        terpene_profile: dto.terpene_profile,
        dna_profile_url: dto.dna_profile_url,
        lineage: dto.lineage,
        acquisition_cost: dto.acquisition_cost?.toString(),
        currency: dto.currency ?? 'EUR',
        cost_per_unit: dto.cost_per_unit?.toString(),
        unit_type: dto.unit_type,
        quarantine_days: dto.quarantine_days,
        stability_verified: dto.stability_verified ?? false,
        registration_number: dto.registration_number,
        created_by: createdBy,
        updated_by: createdBy,
      })
      .returning();

    if (!rows[0]) throw new Error('Strain insert returned no rows');
    return this.mapRow(rows[0]);
  }

  async updateWithTx(
    tx: DbContext,
    id: string,
    dto: UpdateStrain,
    updatedBy: string,
  ): Promise<Strain> {
    const setFields: Record<string, unknown> = {
      updated_by: updatedBy,
      updated_at: new Date(),
    };

    if (dto.name !== undefined) setFields['name'] = dto.name;
    if (dto.cultivar_code !== undefined) setFields['cultivar_code'] = dto.cultivar_code;
    if (dto.species !== undefined) setFields['species'] = dto.species;
    if (dto.genetics !== undefined) setFields['genetics'] = dto.genetics;
    if (dto.thc_percentage_min !== undefined)
      setFields['thc_percentage_min'] = dto.thc_percentage_min?.toString();
    if (dto.thc_percentage_max !== undefined)
      setFields['thc_percentage_max'] = dto.thc_percentage_max?.toString();
    if (dto.cbd_percentage_min !== undefined)
      setFields['cbd_percentage_min'] = dto.cbd_percentage_min?.toString();
    if (dto.cbd_percentage_max !== undefined)
      setFields['cbd_percentage_max'] = dto.cbd_percentage_max?.toString();
    if (dto.flowering_time_days_min !== undefined)
      setFields['flowering_time_days_min'] = dto.flowering_time_days_min;
    if (dto.flowering_time_days_max !== undefined)
      setFields['flowering_time_days_max'] = dto.flowering_time_days_max;
    if (dto.expected_yield_grams_min !== undefined)
      setFields['expected_yield_grams_min'] = dto.expected_yield_grams_min?.toString();
    if (dto.expected_yield_grams_max !== undefined)
      setFields['expected_yield_grams_max'] = dto.expected_yield_grams_max?.toString();
    if (dto.supplier_id !== undefined) setFields['supplier_id'] = dto.supplier_id;
    if (dto.notes !== undefined) setFields['notes'] = dto.notes;
    if (dto.certificate_url !== undefined) setFields['certificate_url'] = dto.certificate_url;
    if (dto.breeder !== undefined) setFields['breeder'] = dto.breeder;
    if (dto.seed_bank !== undefined) setFields['seed_bank'] = dto.seed_bank;
    if (dto.source_type !== undefined) setFields['source_type'] = dto.source_type;
    if (dto.terpene_profile !== undefined) setFields['terpene_profile'] = dto.terpene_profile;
    if (dto.dna_profile_url !== undefined) setFields['dna_profile_url'] = dto.dna_profile_url;
    if (dto.lineage !== undefined) setFields['lineage'] = dto.lineage;
    if (dto.acquisition_cost !== undefined)
      setFields['acquisition_cost'] = dto.acquisition_cost?.toString();
    if (dto.currency !== undefined) setFields['currency'] = dto.currency;
    if (dto.cost_per_unit !== undefined) setFields['cost_per_unit'] = dto.cost_per_unit?.toString();
    if (dto.unit_type !== undefined) setFields['unit_type'] = dto.unit_type;
    if (dto.quarantine_days !== undefined) setFields['quarantine_days'] = dto.quarantine_days;
    if (dto.stability_verified !== undefined)
      setFields['stability_verified'] = dto.stability_verified;
    if (dto.registration_number !== undefined)
      setFields['registration_number'] = dto.registration_number;

    const rows = await tx
      .update(strainsTable)
      .set(setFields)
      .where(and(eq(strainsTable.id, id), eq(strainsTable.is_deleted, false)))
      .returning();

    if (!rows[0]) throw new Error('Strain update returned no rows');
    return this.mapRow(rows[0]);
  }

  async deactivateWithTx(tx: DbContext, id: string, deletedBy: string): Promise<Strain> {
    const rows = await tx
      .update(strainsTable)
      .set({
        is_active: false,
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: deletedBy,
        updated_by: deletedBy,
        updated_at: new Date(),
      })
      .where(and(eq(strainsTable.id, id), eq(strainsTable.is_deleted, false)))
      .returning();

    if (!rows[0]) throw new Error('Strain deactivate returned no rows');
    return this.mapRow(rows[0]);
  }

  async activateWithTx(tx: DbContext, id: string, activatedBy: string): Promise<Strain> {
    const rows = await tx
      .update(strainsTable)
      .set({
        is_active: true,
        updated_by: activatedBy,
        updated_at: new Date(),
      })
      .where(and(eq(strainsTable.id, id), eq(strainsTable.is_deleted, false)))
      .returning();

    if (!rows[0]) throw new Error('Strain activate returned no rows');
    return this.mapRow(rows[0]);
  }

  async countActiveBatchesByStrain(strainId: string): Promise<number> {
    const rows = await this.db
      .select()
      .from(batchesTable)
      .where(and(eq(batchesTable.strain_id, strainId), eq(batchesTable.is_deleted, false)));
    return rows.length;
  }

  private mapRow(
    row: typeof strainsTable.$inferSelect,
    inspectionStatus: string | null = null,
  ): Strain {
    return {
      id: row.id,
      name: row.name,
      cultivar_code: row.cultivar_code,
      species: row.species as Strain['species'],
      genetics: row.genetics ?? undefined,
      thc_percentage_min: row.thc_percentage_min ? parseFloat(row.thc_percentage_min) : undefined,
      thc_percentage_max: row.thc_percentage_max ? parseFloat(row.thc_percentage_max) : undefined,
      cbd_percentage_min: row.cbd_percentage_min ? parseFloat(row.cbd_percentage_min) : undefined,
      cbd_percentage_max: row.cbd_percentage_max ? parseFloat(row.cbd_percentage_max) : undefined,
      flowering_time_days_min: row.flowering_time_days_min ?? undefined,
      flowering_time_days_max: row.flowering_time_days_max ?? undefined,
      expected_yield_grams_min: row.expected_yield_grams_min
        ? parseFloat(row.expected_yield_grams_min)
        : undefined,
      expected_yield_grams_max: row.expected_yield_grams_max
        ? parseFloat(row.expected_yield_grams_max)
        : undefined,
      notes: row.notes ?? undefined,
      certificate_url: row.certificate_url ?? undefined,
      supplier_id: row.supplier_id ?? undefined,
      breeder: row.breeder ?? undefined,
      seed_bank: row.seed_bank ?? undefined,
      source_type: row.source_type as Strain['source_type'],
      terpene_profile: (row.terpene_profile as Record<string, number>) ?? undefined,
      dna_profile_url: row.dna_profile_url ?? undefined,
      lineage: (row.lineage as Strain['lineage']) ?? undefined,
      acquisition_cost: row.acquisition_cost ? parseFloat(row.acquisition_cost) : undefined,
      currency: row.currency,
      cost_per_unit: row.cost_per_unit ? parseFloat(row.cost_per_unit) : undefined,
      unit_type: row.unit_type ?? undefined,
      quarantine_days: row.quarantine_days ?? undefined,
      stability_verified: row.stability_verified,
      registration_number: row.registration_number ?? undefined,
      is_active: row.is_active,
      current_inspection_status: inspectionStatus,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
      is_deleted: row.is_deleted,
      deleted_at: row.deleted_at?.toISOString() ?? null,
      deleted_by: row.deleted_by as UserId | null,
    } as unknown as Strain;
  }
}

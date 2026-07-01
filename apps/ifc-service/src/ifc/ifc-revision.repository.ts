import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { ifcRevisionsTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import { DATABASE_TOKEN } from '../database/database.module';
import type {
  IfcRevision,
  IfcRevisionStatus,
  IfcListRevisionsQuery,
  IfcRevisionsListResponse,
  UserId,
} from '@gacp-erp/shared-schemas';

function mapRow(row: typeof ifcRevisionsTable.$inferSelect): IfcRevision {
  return {
    revision_id: row.id,
    model_id: row.model_id,
    source_file_uri: row.source_file_uri,
    source_file_hash: row.source_file_hash,
    status: row.status as IfcRevisionStatus,
    uploaded_by: row.uploaded_by,
    uploaded_at: row.created_at.toISOString(),
    approved_at: row.approved_at?.toISOString() ?? null,
    approved_by: (row.approved_by as string[]) ?? [],
    change_control_id: row.change_control_id ?? null,
  };
}

@Injectable()
export class IfcRevisionRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<IfcRevision | null> {
    const rows = await this.db
      .select()
      .from(ifcRevisionsTable)
      .where(eq(ifcRevisionsTable.id, id))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findApprovedBaseline(modelId: string): Promise<IfcRevision | null> {
    const rows = await this.db
      .select()
      .from(ifcRevisionsTable)
      .where(and(eq(ifcRevisionsTable.model_id, modelId), eq(ifcRevisionsTable.status, 'approved')))
      .orderBy(desc(ifcRevisionsTable.created_at))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findMany(query: IfcListRevisionsQuery): Promise<IfcRevisionsListResponse> {
    const { page, limit, model_id, status } = query;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (model_id) conditions.push(eq(ifcRevisionsTable.model_id, model_id));
    if (status) conditions.push(eq(ifcRevisionsTable.status, status as IfcRevisionStatus));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      this.db
        .select()
        .from(ifcRevisionsTable)
        .where(where)
        .orderBy(desc(ifcRevisionsTable.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: ifcRevisionsTable.id }).from(ifcRevisionsTable).where(where),
    ]);

    const total = countRows.length;
    return {
      data: rows.map(mapRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createWithTx(
    tx: DbContext,
    data: {
      model_id: string;
      source_file_uri: string;
      source_file_hash: string;
      manifest_uri?: string;
      change_summary?: string;
      uploaded_by: UserId;
    },
  ): Promise<IfcRevision> {
    const rows = await tx
      .insert(ifcRevisionsTable)
      .values({
        model_id: data.model_id,
        source_file_uri: data.source_file_uri,
        source_file_hash: data.source_file_hash,
        manifest_uri: data.manifest_uri,
        change_summary: data.change_summary,
        uploaded_by: data.uploaded_by,
      })
      .returning();
    return mapRow(rows[0]!);
  }

  async appendProjectionStatus(
    id: string,
    domain: 'spatial' | 'financial' | 'iot',
    status: 'success' | 'partial' | 'failed',
    runId: string,
  ): Promise<void> {
    const rows = await this.db
      .select({ statusHistory: ifcRevisionsTable.status_history })
      .from(ifcRevisionsTable)
      .where(eq(ifcRevisionsTable.id, id))
      .limit(1);

    const existing =
      (rows[0]?.statusHistory as Array<{
        domain: string;
        status: string;
        runId: string;
        at: string;
      }>) ?? [];
    const entry = { domain, status, runId, at: new Date().toISOString() };
    const updated = [...existing.filter((e) => e.domain !== domain), entry];

    // Check if all 3 domains have now reported success
    const allDomains = ['spatial', 'financial', 'iot'] as const;
    const allSucceeded = allDomains.every((d) =>
      updated.some((e) => e.domain === d && e.status === 'success'),
    );
    const anyFailed = updated.some((e) => e.status === 'failed');

    await this.db
      .update(ifcRevisionsTable)
      .set({
        status_history: updated,
        status: allSucceeded ? 'projected' : anyFailed ? 'failed' : undefined,
        updated_at: new Date(),
      })
      .where(eq(ifcRevisionsTable.id, id));
  }

  async findByHash(modelId: string, hash: string): Promise<IfcRevision | null> {
    const rows = await this.db
      .select()
      .from(ifcRevisionsTable)
      .where(
        and(eq(ifcRevisionsTable.model_id, modelId), eq(ifcRevisionsTable.source_file_hash, hash)),
      )
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async updateStatusWithTx(
    tx: DbContext,
    id: string,
    patch: {
      status: IfcRevisionStatus;
      change_control_id?: string;
      approved_by?: string[];
      approved_at?: Date;
    },
  ): Promise<IfcRevision> {
    const rows = await tx
      .update(ifcRevisionsTable)
      .set({
        status: patch.status,
        ...(patch.change_control_id !== undefined && {
          change_control_id: patch.change_control_id,
        }),
        ...(patch.approved_by !== undefined && { approved_by: patch.approved_by }),
        ...(patch.approved_at !== undefined && { approved_at: patch.approved_at }),
        updated_at: new Date(),
      })
      .where(eq(ifcRevisionsTable.id, id))
      .returning();
    return mapRow(rows[0]!);
  }
}

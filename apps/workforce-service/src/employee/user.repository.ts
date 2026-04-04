import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { usersTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import type { SystemRole } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class UserRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async createWithTx(
    tx: DbContext,
    data: {
      keycloak_id: string;
      email: string;
      username: string;
      first_name: string;
      last_name: string;
      role: SystemRole;
    },
  ): Promise<{ id: string; keycloak_id: string; username: string }> {
    const rows = await tx
      .insert(usersTable)
      .values({
        keycloak_id: data.keycloak_id,
        email: data.email,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        is_active: true,
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error('User insert returned no rows');
    return { id: row.id, keycloak_id: row.keycloak_id, username: row.username };
  }

  async findByKeycloakId(keycloakId: string): Promise<{ id: string } | null> {
    const rows = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.keycloak_id, keycloakId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<{ id: string } | null> {
    const rows = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByUsername(username: string): Promise<{ id: string } | null> {
    const rows = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    return rows[0] ?? null;
  }
}

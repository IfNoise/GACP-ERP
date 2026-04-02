import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID, randomBytes } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import {
  type CreateEmployee,
  type EmployeeProvisionedResponse,
  type UserId,
  CRITICAL_ROLES,
} from '@gacp-erp/shared-schemas';
import { KeycloakAdminClient } from '@gacp-erp/shared-keycloak';
import { WORKFORCE_EMPLOYEE_TOPIC, type EmployeeCreatedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { KEYCLOAK_CLIENT } from '../../keycloak/keycloak.module';
import { EmployeeRepository } from '../employee.repository';
import { UserRepository } from '../user.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import {
  DuplicateEmailError,
  KeycloakProvisioningError,
  KeycloakCompensationError,
  UsernameGenerationError,
} from '../errors/employee-provisioning.errors';

const MAX_USERNAME_ATTEMPTS = 99;

@Injectable()
export class CreateEmployeeUseCase {
  private readonly logger = new Logger(CreateEmployeeUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    @Inject(KEYCLOAK_CLIENT) private readonly keycloakClient: KeycloakAdminClient,
    private readonly employeeRepo: EmployeeRepository,
    private readonly userRepo: UserRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateEmployee, userId: string): Promise<EmployeeProvisionedResponse> {
    // 1. Pre-validation: duplicate email
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) throw new DuplicateEmailError(dto.email);

    const existingEmployee = await this.employeeRepo.findByEmail(dto.email);
    if (existingEmployee) throw new DuplicateEmailError(dto.email);

    // 2. Generate unique username
    const baseUsername = this.generateBaseUsername(dto.first_name, dto.last_name);
    const username = await this.resolveUniqueUsername(baseUsername);

    // 3. Generate temporary password
    const temporaryPassword = randomBytes(16).toString('base64url');

    // 4. Determine required actions
    const requiredActions = ['UPDATE_PASSWORD'];
    if (CRITICAL_ROLES.includes(dto.system_role)) {
      requiredActions.push('CONFIGURE_TOTP');
    }

    // 5. SAGA Step 1: Create Keycloak user (external side-effect)
    let keycloakId: string;
    try {
      keycloakId = await this.keycloakClient.createUser({
        username,
        email: dto.email,
        firstName: dto.first_name,
        lastName: dto.last_name,
        enabled: true,
        emailVerified: false,
        credentials: [{ type: 'password', value: temporaryPassword, temporary: true }],
        realmRoles: [dto.system_role],
        requiredActions,
      });
    } catch (error) {
      this.logger.error(`Keycloak user creation failed for ${dto.email}`, error);
      throw new KeycloakProvisioningError(error instanceof Error ? error.message : String(error));
    }

    // 6. SAGA Step 2: DB transaction (with compensation on failure)
    let employee: ReturnType<EmployeeRepository['create']> extends Promise<infer T> ? T : never;
    let userRecord: { id: string; username: string };

    try {
      const result = await this.db.transaction(async (tx) => {
        // Insert users table record
        const user = await this.userRepo.createWithTx(tx, {
          keycloak_id: keycloakId,
          email: dto.email,
          username,
          first_name: dto.first_name,
          last_name: dto.last_name,
          role: dto.system_role,
        });

        // Generate employee number
        const sequence = Math.floor(Math.random() * 900000) + 100000;
        const employeeNumber = dto.employee_number ?? `EMP-${sequence}`;

        // Insert employees table record
        const emp = await this.employeeRepo.create(
          {
            employee_number: employeeNumber,
            user_id: user.id,
            first_name: dto.first_name,
            last_name: dto.last_name,
            email: dto.email,
            position: dto.position,
            department: dto.department,
            hire_date: dto.hire_date,
            competency_profile_id: dto.competency_profile_id ?? null,
          },
          userId,
          tx,
        );

        // Insert outbox event
        const event: EmployeeCreatedEvent = {
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          eventVersion: '1.0',
          producerService: 'workforce-service',
          topic: WORKFORCE_EMPLOYEE_TOPIC,
          correlationId: randomUUID(),
          triggeredBy: userId as UserId,
          eventType: 'workforce.employee.created',
          payload: {
            employeeId: emp.id,
            employeeNumber: emp.employee_number,
            fullName: `${dto.first_name} ${dto.last_name}`,
            department: emp.department,
            position: dto.position,
            hireDate: emp.hire_date,
            createdBy: userId,
          },
        };

        await this.outboxRepo.createWithTx(tx, {
          topic: WORKFORCE_EMPLOYEE_TOPIC,
          key: emp.id,
          payload: event as unknown as Record<string, unknown>,
        });

        return { employee: emp, user };
      });

      employee = result.employee;
      userRecord = result.user;
    } catch (dbError) {
      // COMPENSATION: Delete the Keycloak user we already created
      this.logger.warn(
        `DB transaction failed, compensating by deleting Keycloak user ${keycloakId}`,
      );
      try {
        await this.keycloakClient.deleteUser(keycloakId);
        this.logger.log(`Compensation successful: Keycloak user ${keycloakId} deleted`);
      } catch (compensationError) {
        this.logger.error(
          `CRITICAL: Compensation failed! Orphaned Keycloak user: ${keycloakId}`,
          compensationError,
        );
        throw new KeycloakCompensationError(
          keycloakId,
          dbError instanceof Error ? dbError.message : String(dbError),
        );
      }
      throw dbError;
    }

    this.logger.log(
      `Employee provisioned: ${employee.id} (${userRecord.username}), Keycloak: ${keycloakId}`,
    );

    return {
      ...employee,
      username: userRecord.username,
      temporary_password: temporaryPassword,
      system_role: dto.system_role,
    } as EmployeeProvisionedResponse;
  }

  private generateBaseUsername(firstName: string, lastName: string): string {
    return `${firstName}_${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 50);
  }

  private async resolveUniqueUsername(base: string): Promise<string> {
    const existing = await this.userRepo.findByUsername(base);
    if (!existing) return base;

    for (let i = 2; i <= MAX_USERNAME_ATTEMPTS; i++) {
      const candidate = `${base}_${i}`;
      const found = await this.userRepo.findByUsername(candidate);
      if (!found) return candidate;
    }

    throw new UsernameGenerationError(base);
  }
}

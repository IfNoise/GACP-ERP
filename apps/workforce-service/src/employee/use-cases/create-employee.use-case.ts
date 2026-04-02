import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import { type CreateEmployee, type UserId } from '@gacp-erp/shared-schemas';
import { WORKFORCE_EMPLOYEE_TOPIC, type EmployeeCreatedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { EmployeeRepository } from '../employee.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly employeeRepo: EmployeeRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateEmployee, userId: string) {
    const sequence = Math.floor(Math.random() * 900000) + 100000;
    const employeeNumber = dto.employee_number ?? `EMP-${sequence}`;
    const now = new Date().toISOString();

    const employee = await this.db.transaction(async (tx) => {
      const created = await this.employeeRepo.create(
        {
          employee_number: employeeNumber,
          user_id: dto.user_id,
          position: dto.position,
          department: dto.department,
          hire_date: dto.hire_date,
          competency_profile_id: dto.competency_profile_id,
        },
        userId,
        tx,
      );

      const event: EmployeeCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'workforce-service',
        topic: WORKFORCE_EMPLOYEE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'workforce.employee.created',
        payload: {
          employeeId: created.id,
          employeeNumber: created.employee_number,
          fullName: created.user_id,
          department: created.department,
          position: created.position,
          hireDate: created.hire_date,
          createdBy: userId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: WORKFORCE_EMPLOYEE_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    return employee;
  }
}

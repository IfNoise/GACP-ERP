import { CreateEmployeeUseCase } from './create-employee.use-case';
import type { EmployeeRepository } from '../employee.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import { WORKFORCE_EMPLOYEE_TOPIC } from '@gacp-erp/shared-events';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeEmployee = {
  id: 'emp-uuid-1',
  employee_number: 'EMP-123456',
  user_id: 'user-uuid-1',
  position: 'Cultivation Technician',
  department: 'Cultivation',
  hire_date: '2024-01-15',
  is_active: true,
  competency_profile_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
  deleted_at: null,
} as const;

const createDto = {
  user_id: 'user-uuid-1',
  position: 'Cultivation Technician',
  department: 'Cultivation',
  hire_date: '2024-01-15',
} as const;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateEmployeeUseCase', () => {
  let useCase: CreateEmployeeUseCase;
  let employeeRepo: jest.Mocked<EmployeeRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    employeeRepo = {
      create: jest.fn().mockResolvedValue(fakeEmployee),
    } as unknown as jest.Mocked<EmployeeRepository>;

    outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockDb);
      }),
    };

    useCase = new CreateEmployeeUseCase(mockDb as never, employeeRepo, outboxRepo);
  });

  // ── IQ: Installation Qualification — basic execution ───────────────────────

  describe('IQ: basic execution', () => {
    it('creates an employee inside a db transaction', async () => {
      await useCase.execute(createDto as never, 'user-1');

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(employeeRepo.create).toHaveBeenCalledTimes(1);
    });

    it('returns the created employee', async () => {
      const result = await useCase.execute(createDto as never, 'user-1');

      expect(result).toEqual(fakeEmployee);
    });
  });

  // ── OQ: Operational Qualification — business logic ─────────────────────────

  describe('OQ: employee number generation', () => {
    it('uses provided employee_number if given in dto', async () => {
      const dtoWithNumber = { ...createDto, employee_number: 'EMP-999999' };
      await useCase.execute(dtoWithNumber as never, 'user-1');

      // employee_number is passed as first arg field
      expect(employeeRepo.create.mock.calls[0]![0].employee_number).toBe('EMP-999999');
    });

    it('auto-generates employee_number in EMP-NNNNNN format when not provided', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const passedField = employeeRepo.create.mock.calls[0]![0].employee_number as string;
      expect(passedField).toMatch(/^EMP-\d{6}$/);
    });
  });

  describe('OQ: outbox event publishing', () => {
    it('publishes an outbox event with WORKFORCE_EMPLOYEE_TOPIC topic', async () => {
      await useCase.execute(createDto as never, 'user-1');

      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.topic).toBe(WORKFORCE_EMPLOYEE_TOPIC);
    });

    it('uses the created employee id as the outbox key (ALCOA+ Attributable)', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.key).toBe(fakeEmployee.id);
    });

    it('event payload contains eventType workforce.employee.created', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const [, outboxEvent] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = outboxEvent.payload as Record<string, unknown>;
      expect(payload['eventType']).toBe('workforce.employee.created');
    });

    it('event payload employeeId matches created employee (ALCOA+ Original)', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const [, outboxEvent] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = outboxEvent.payload as Record<string, unknown>;
      const payloadObj = payload as { payload: { employeeId: string } };
      expect(payloadObj.payload.employeeId).toBe(fakeEmployee.id);
    });
  });

  // ── PQ: Performance Qualification — transactional integrity ────────────────

  describe('PQ: transactional integrity', () => {
    it('passes the same tx object to both employeeRepo.create and outboxRepo.createWithTx', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const txForCreate = employeeRepo.create.mock.calls[0]![2];
      const txForOutbox = outboxRepo.createWithTx.mock.calls[0]![0];
      expect(txForCreate).toBe(txForOutbox);
    });
  });
});

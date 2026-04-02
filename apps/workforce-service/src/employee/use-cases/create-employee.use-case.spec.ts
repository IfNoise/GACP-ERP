import { CreateEmployeeUseCase } from './create-employee.use-case';
import type { EmployeeRepository } from '../employee.repository';
import type { UserRepository } from '../user.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import { WORKFORCE_EMPLOYEE_TOPIC } from '@gacp-erp/shared-events';
import {
  DuplicateEmailError,
  KeycloakProvisioningError,
  KeycloakCompensationError,
  UsernameGenerationError,
} from '../errors/employee-provisioning.errors';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const KEYCLOAK_USER_ID = 'kc-uuid-001';
const DB_USER_ID = 'db-user-uuid-1';

const fakeUserRecord = {
  id: DB_USER_ID,
  keycloak_id: KEYCLOAK_USER_ID,
  username: 'john_doe',
};

const fakeEmployee = {
  id: 'emp-uuid-1',
  employee_number: 'EMP-123456',
  user_id: DB_USER_ID,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@company.com',
  position: 'Cultivation Technician',
  department: 'Cultivation',
  hire_date: '2024-01-15',
  is_active: true,
  competency_profile_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'hr-user-1',
  updated_by: 'hr-user-1',
} as const;

const createDto = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@company.com',
  system_role: 'OPERATOR' as const,
  position: 'Cultivation Technician',
  department: 'Cultivation',
  hire_date: '2024-01-15',
} as const;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateEmployeeUseCase', () => {
  let useCase: CreateEmployeeUseCase;
  let employeeRepo: jest.Mocked<EmployeeRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockKeycloakClient: { createUser: jest.Mock; deleteUser: jest.Mock };
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    employeeRepo = {
      create: jest.fn().mockResolvedValue(fakeEmployee),
      findByEmail: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<EmployeeRepository>;

    userRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findByUsername: jest.fn().mockResolvedValue(null),
      createWithTx: jest.fn().mockResolvedValue(fakeUserRecord),
    } as unknown as jest.Mocked<UserRepository>;

    outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockKeycloakClient = {
      createUser: jest.fn().mockResolvedValue(KEYCLOAK_USER_ID),
      deleteUser: jest.fn().mockResolvedValue(undefined),
    };

    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockDb);
      }),
    };

    useCase = new CreateEmployeeUseCase(
      mockDb as never,
      mockKeycloakClient as never,
      employeeRepo,
      userRepo,
      outboxRepo,
    );
  });

  // ── IQ: Installation Qualification — saga execution ─────────────────────────

  describe('IQ: happy path provisioning', () => {
    it('creates Keycloak user, then DB records in a transaction', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      expect(mockKeycloakClient.createUser).toHaveBeenCalledTimes(1);
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(userRepo.createWithTx).toHaveBeenCalledTimes(1);
      expect(employeeRepo.create).toHaveBeenCalledTimes(1);
      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
    });

    it('returns EmployeeProvisionedResponse with temporary_password, system_role, username', async () => {
      const result = await useCase.execute(createDto as never, 'hr-user-1');

      expect(result.temporary_password).toBeDefined();
      expect(typeof result.temporary_password).toBe('string');
      expect(result.temporary_password.length).toBeGreaterThan(0);
      expect(result.system_role).toBe('OPERATOR');
      expect(result.username).toBe('john_doe');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.email).toBe('john.doe@company.com');
    });

    it('calls Keycloak createUser with correct parameters', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const kcCall = mockKeycloakClient.createUser.mock.calls[0]![0];
      expect(kcCall.username).toBe('john_doe');
      expect(kcCall.email).toBe('john.doe@company.com');
      expect(kcCall.firstName).toBe('John');
      expect(kcCall.lastName).toBe('Doe');
      expect(kcCall.enabled).toBe(true);
      expect(kcCall.credentials).toEqual([
        expect.objectContaining({ type: 'password', temporary: true }),
      ]);
      expect(kcCall.realmRoles).toEqual(['OPERATOR']);
    });

    it('passes keycloak_id to userRepo.createWithTx', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const userCreateCall = userRepo.createWithTx.mock.calls[0]![1];
      expect(userCreateCall.keycloak_id).toBe(KEYCLOAK_USER_ID);
    });
  });

  // ── OQ: Operational Qualification — MFA ─────────────────────────────────────

  describe('OQ: MFA for critical roles', () => {
    it('adds CONFIGURE_TOTP to requiredActions for SUPER_ADMIN', async () => {
      const adminDto = { ...createDto, system_role: 'SUPER_ADMIN' as const };
      await useCase.execute(adminDto as never, 'hr-user-1');

      const kcCall = mockKeycloakClient.createUser.mock.calls[0]![0];
      expect(kcCall.requiredActions).toContain('UPDATE_PASSWORD');
      expect(kcCall.requiredActions).toContain('CONFIGURE_TOTP');
    });

    it('adds CONFIGURE_TOTP to requiredActions for QUALITY_MANAGER', async () => {
      const qmDto = { ...createDto, system_role: 'QUALITY_MANAGER' as const };
      await useCase.execute(qmDto as never, 'hr-user-1');

      const kcCall = mockKeycloakClient.createUser.mock.calls[0]![0];
      expect(kcCall.requiredActions).toContain('CONFIGURE_TOTP');
    });

    it('does NOT add CONFIGURE_TOTP for OPERATOR', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const kcCall = mockKeycloakClient.createUser.mock.calls[0]![0];
      expect(kcCall.requiredActions).toEqual(['UPDATE_PASSWORD']);
    });

    it('does NOT add CONFIGURE_TOTP for AUDITOR', async () => {
      const audDto = { ...createDto, system_role: 'AUDITOR' as const };
      await useCase.execute(audDto as never, 'hr-user-1');

      const kcCall = mockKeycloakClient.createUser.mock.calls[0]![0];
      expect(kcCall.requiredActions).toEqual(['UPDATE_PASSWORD']);
    });
  });

  // ── OQ: Username generation ────────────────────────────────────────────────

  describe('OQ: username generation', () => {
    it('generates username as first_last lowercase', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const kcCall = mockKeycloakClient.createUser.mock.calls[0]![0];
      expect(kcCall.username).toBe('john_doe');
    });

    it('strips non-alphanumeric characters except underscore', async () => {
      const dto = { ...createDto, first_name: "J'ean-Luc", last_name: "O'Brien" };
      await useCase.execute(dto as never, 'hr-user-1');

      const kcCall = mockKeycloakClient.createUser.mock.calls[0]![0];
      expect(kcCall.username).toBe('jeanluc_obrien');
    });

    it('resolves conflict by appending _2 suffix', async () => {
      userRepo.findByUsername
        .mockResolvedValueOnce({ id: 'existing-1' })
        .mockResolvedValueOnce(null);

      await useCase.execute(createDto as never, 'hr-user-1');

      const kcCall = mockKeycloakClient.createUser.mock.calls[0]![0];
      expect(kcCall.username).toBe('john_doe_2');
    });

    it('throws UsernameGenerationError when all attempts exhausted', async () => {
      userRepo.findByUsername.mockResolvedValue({ id: 'always-taken' });

      await expect(useCase.execute(createDto as never, 'hr-user-1')).rejects.toThrow(
        UsernameGenerationError,
      );
      expect(mockKeycloakClient.createUser).not.toHaveBeenCalled();
    });
  });

  // ── OQ: Duplicate email rejection ─────────────────────────────────────────

  describe('OQ: duplicate email rejection', () => {
    it('throws DuplicateEmailError when email exists in users table', async () => {
      userRepo.findByEmail.mockResolvedValueOnce({ id: 'existing-user' });

      await expect(useCase.execute(createDto as never, 'hr-user-1')).rejects.toThrow(
        DuplicateEmailError,
      );
      expect(mockKeycloakClient.createUser).not.toHaveBeenCalled();
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('throws DuplicateEmailError when email exists in employees table', async () => {
      employeeRepo.findByEmail.mockResolvedValueOnce(fakeEmployee as never);

      await expect(useCase.execute(createDto as never, 'hr-user-1')).rejects.toThrow(
        DuplicateEmailError,
      );
      expect(mockKeycloakClient.createUser).not.toHaveBeenCalled();
    });
  });

  // ── OQ: Employee number ────────────────────────────────────────────────────

  describe('OQ: employee number generation', () => {
    it('uses provided employee_number when given in dto', async () => {
      const dtoWithNumber = { ...createDto, employee_number: 'EMP-999999' };
      await useCase.execute(dtoWithNumber as never, 'hr-user-1');

      const createCall = employeeRepo.create.mock.calls[0]![0];
      expect(createCall.employee_number).toBe('EMP-999999');
    });

    it('auto-generates employee_number in EMP-NNNNNN format when not provided', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const createCall = employeeRepo.create.mock.calls[0]![0];
      expect(createCall.employee_number).toMatch(/^EMP-\d{6}$/);
    });
  });

  // ── OQ: Outbox event correctness ──────────────────────────────────────────

  describe('OQ: outbox event correctness', () => {
    it('publishes event with WORKFORCE_EMPLOYEE_TOPIC', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.topic).toBe(WORKFORCE_EMPLOYEE_TOPIC);
    });

    it('uses created employee ID as the outbox key (ALCOA+ Attributable)', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.key).toBe(fakeEmployee.id);
    });

    it('sets fullName correctly (regression: was user_id)', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const [, outboxEvent] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = outboxEvent.payload as Record<string, unknown>;
      const inner = payload['payload'] as Record<string, unknown>;
      expect(inner['fullName']).toBe('John Doe');
    });

    it('event payload contains eventType workforce.employee.created', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const [, outboxEvent] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = outboxEvent.payload as Record<string, unknown>;
      expect(payload['eventType']).toBe('workforce.employee.created');
    });
  });

  // ── PQ: Performance Qualification — failure & compensation ────────────────

  describe('PQ: Keycloak failure — no DB writes', () => {
    it('throws KeycloakProvisioningError and does not start DB transaction', async () => {
      mockKeycloakClient.createUser.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(useCase.execute(createDto as never, 'hr-user-1')).rejects.toThrow(
        KeycloakProvisioningError,
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('PQ: DB failure with successful compensation', () => {
    it('deletes Keycloak user and re-throws the DB error', async () => {
      const dbError = new Error('unique_violation');
      mockDb.transaction.mockRejectedValueOnce(dbError);

      await expect(useCase.execute(createDto as never, 'hr-user-1')).rejects.toThrow(
        'unique_violation',
      );
      expect(mockKeycloakClient.deleteUser).toHaveBeenCalledWith(KEYCLOAK_USER_ID);
    });
  });

  describe('PQ: DB failure with failed compensation', () => {
    it('throws KeycloakCompensationError when deleteUser also fails', async () => {
      mockDb.transaction.mockRejectedValueOnce(new Error('db_error'));
      mockKeycloakClient.deleteUser.mockRejectedValueOnce(new Error('kc_cleanup_failed'));

      await expect(useCase.execute(createDto as never, 'hr-user-1')).rejects.toThrow(
        KeycloakCompensationError,
      );
    });
  });

  describe('PQ: transactional integrity', () => {
    it('passes the same tx object to userRepo, employeeRepo, and outboxRepo', async () => {
      await useCase.execute(createDto as never, 'hr-user-1');

      const txForUser = userRepo.createWithTx.mock.calls[0]![0];
      const txForEmployee = employeeRepo.create.mock.calls[0]![2];
      const txForOutbox = outboxRepo.createWithTx.mock.calls[0]![0];
      expect(txForUser).toBe(txForEmployee);
      expect(txForUser).toBe(txForOutbox);
    });
  });
});

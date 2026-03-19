import { CreateTaskUseCase } from './create-task.use-case';
import type { TaskRepository } from '../task.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import { WORKFORCE_TASK_TOPIC } from '@gacp-erp/shared-events';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeTask = {
  id: 'task-uuid-1',
  task_number: 'TASK-202500001',
  title: 'Irrigate Zone A',
  description: 'Daily irrigation run',
  task_type: 'OPERATIONAL',
  assigned_to: 'emp-uuid-1',
  zone_id: 'zone-uuid-1',
  batch_id: null,
  priority: 'HIGH',
  status: 'PENDING',
  scheduled_date: '2025-06-01',
  scheduled_start: '08:00',
  scheduled_end: '09:00',
  sop_reference: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
  deleted_at: null,
} as const;

const createDto = {
  title: 'Irrigate Zone A',
  description: 'Daily irrigation run',
  assigned_to: 'emp-uuid-1',
  priority: 'HIGH',
  zone_id: 'zone-uuid-1',
  scheduled_start: '2025-06-01T08:00:00Z',
  scheduled_end: '2025-06-01T09:00:00Z',
} as const;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase;
  let taskRepo: jest.Mocked<TaskRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    taskRepo = {
      create: jest.fn().mockResolvedValue(fakeTask),
    } as unknown as jest.Mocked<TaskRepository>;

    outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockDb);
      }),
    };

    useCase = new CreateTaskUseCase(mockDb as never, taskRepo, outboxRepo);
  });

  // ── IQ: basic execution ────────────────────────────────────────────────────

  describe('IQ: basic execution', () => {
    it('runs inside a db transaction', async () => {
      await useCase.execute(createDto as never, 'user-1');

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('returns the created task', async () => {
      const result = await useCase.execute(createDto as never, 'user-1');

      expect(result).toEqual(fakeTask);
    });
  });

  // ── OQ: business logic ─────────────────────────────────────────────────────

  describe('OQ: task number format', () => {
    it('generates task_number in TASK-YYYYnnnnn format', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const passedNum = taskRepo.create.mock.calls[0]![0].task_number as string;
      expect(passedNum).toMatch(/^TASK-\d{4}\d{5}$/);
    });

    it('task_number year matches current year', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const passedNum = taskRepo.create.mock.calls[0]![0].task_number as string;
      const year = new Date().getFullYear().toString();
      expect(passedNum.startsWith(`TASK-${year}`)).toBe(true);
    });
  });

  describe('OQ: ISO datetime extraction', () => {
    it('extracts scheduled_date (YYYY-MM-DD) from scheduled_start ISO string', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const passedFields = taskRepo.create.mock.calls[0]![0];
      expect(passedFields.scheduled_date).toBe('2025-06-01');
    });

    it('extracts HH:MM from scheduled_start ISO string', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const passedFields = taskRepo.create.mock.calls[0]![0];
      expect(passedFields.scheduled_start).toBe('08:00');
    });

    it('extracts HH:MM from scheduled_end ISO string', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const passedFields = taskRepo.create.mock.calls[0]![0];
      expect(passedFields.scheduled_end).toBe('09:00');
    });

    it('sets null scheduled_start when not provided in dto', async () => {
      const dtoNoTime = { title: 'Task', assigned_to: 'emp-1', priority: 'LOW' };
      await useCase.execute(dtoNoTime as never, 'user-1');

      const passedFields = taskRepo.create.mock.calls[0]![0];
      expect(passedFields.scheduled_start).toBeNull();
      expect(passedFields.scheduled_end).toBeNull();
    });
  });

  describe('OQ: task_type always OPERATIONAL', () => {
    it('hardcodes task_type to OPERATIONAL', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const passedFields = taskRepo.create.mock.calls[0]![0];
      expect(passedFields.task_type).toBe('OPERATIONAL');
    });
  });

  describe('OQ: outbox event publishing', () => {
    it('publishes outbox event with WORKFORCE_TASK_TOPIC', async () => {
      await useCase.execute(createDto as never, 'user-1');

      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.topic).toBe(WORKFORCE_TASK_TOPIC);
    });

    it('uses task id as outbox key (ALCOA+ Attributable)', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.key).toBe(fakeTask.id);
    });

    it('event payload eventType is workforce.task.created', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as Record<string, unknown>;
      expect(payload['eventType']).toBe('workforce.task.created');
    });
  });

  // ── PQ: transactional integrity ────────────────────────────────────────────

  describe('PQ: transactional integrity', () => {
    it('passes the same tx to taskRepo.create and outboxRepo.createWithTx', async () => {
      await useCase.execute(createDto as never, 'user-1');

      const txForCreate = taskRepo.create.mock.calls[0]![2];
      const txForOutbox = outboxRepo.createWithTx.mock.calls[0]![0];
      expect(txForCreate).toBe(txForOutbox);
    });
  });
});

import { CompleteTaskUseCase } from './complete-task.use-case';
import type { TaskRepository } from '../task.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import { WORKFORCE_TASK_TOPIC } from '@gacp-erp/shared-events';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const completedTask = {
  id: 'task-uuid-1',
  task_number: 'TASK-202500001',
  title: 'Irrigate Zone A',
  description: null,
  task_type: 'OPERATIONAL',
  assigned_to: 'emp-uuid-1',
  zone_id: null,
  batch_id: null,
  priority: 'HIGH',
  status: 'COMPLETED',
  scheduled_date: '2025-06-01',
  scheduled_start: null,
  scheduled_end: null,
  sop_reference: 'SOP-001',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
  deleted_at: null,
} as const;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CompleteTaskUseCase', () => {
  let useCase: CompleteTaskUseCase;
  let taskRepo: jest.Mocked<TaskRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    taskRepo = {
      complete: jest.fn().mockResolvedValue(completedTask),
    } as unknown as jest.Mocked<TaskRepository>;

    outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockDb);
      }),
    };

    useCase = new CompleteTaskUseCase(mockDb as never, taskRepo, outboxRepo);
  });

  // ── IQ: basic execution ────────────────────────────────────────────────────

  describe('IQ: basic execution', () => {
    it('calls taskRepo.complete with taskId and userId inside transaction', async () => {
      await useCase.execute('task-uuid-1', 'user-1');

      expect(taskRepo.complete).toHaveBeenCalledTimes(1);
      expect(taskRepo.complete.mock.calls[0]![0]).toBe('task-uuid-1');
      expect(taskRepo.complete.mock.calls[0]![1]).toBe('user-1');
    });

    it('returns the completed task', async () => {
      const result = await useCase.execute('task-uuid-1', 'user-1');

      expect(result).toEqual(completedTask);
    });

    it('wraps execution in a single db transaction', async () => {
      await useCase.execute('task-uuid-1', 'user-1');

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });
  });

  // ── OQ: outbox event publishing ────────────────────────────────────────────

  describe('OQ: outbox event (ALCOA+ Contemporaneous)', () => {
    it('publishes TaskCompletedEvent with WORKFORCE_TASK_TOPIC', async () => {
      await useCase.execute('task-uuid-1', 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.topic).toBe(WORKFORCE_TASK_TOPIC);
    });

    it('event key is the task id', async () => {
      await useCase.execute('task-uuid-1', 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.key).toBe(completedTask.id);
    });

    it('event payload eventType is workforce.task.completed', async () => {
      await useCase.execute('task-uuid-1', 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as Record<string, unknown>;
      expect(payload['eventType']).toBe('workforce.task.completed');
    });

    it('event payload includes sopReference from task', async () => {
      await useCase.execute('task-uuid-1', 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as { payload: { sopReference: string | null } };
      expect(payload.payload.sopReference).toBe('SOP-001');
    });

    it('event payload completedBy is the userId (ALCOA+ Attributable)', async () => {
      await useCase.execute('task-uuid-1', 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as { payload: { completedBy: string } };
      expect(payload.payload.completedBy).toBe('user-1');
    });
  });

  // ── PQ: transactional integrity ────────────────────────────────────────────

  describe('PQ: transactional integrity', () => {
    it('passes the same tx to taskRepo.complete and outboxRepo.createWithTx', async () => {
      await useCase.execute('task-uuid-1', 'user-1');

      const txForComplete = taskRepo.complete.mock.calls[0]![2];
      const txForOutbox = outboxRepo.createWithTx.mock.calls[0]![0];
      expect(txForComplete).toBe(txForOutbox);
    });
  });
});

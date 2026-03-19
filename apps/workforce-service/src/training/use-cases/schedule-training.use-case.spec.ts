import { ScheduleTrainingUseCase } from './schedule-training.use-case';
import type { TrainingRepository } from '../training.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import { TRAINING_EXECUTION_TOPIC } from '@gacp-erp/shared-events';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeExecution = {
  id: 'exec-uuid-1',
  course_id: 'course-uuid-1',
  trainee_id: 'emp-uuid-1',
  trainer_id: 'trainer-uuid-1',
  status: 'SCHEDULED',
  score: null,
  electronic_signature: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
  deleted_at: null,
} as const;

const scheduleDto = {
  course_id: 'course-uuid-1',
  trainee_id: 'emp-uuid-1',
  trainer_id: 'trainer-uuid-1',
} as const;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ScheduleTrainingUseCase', () => {
  let useCase: ScheduleTrainingUseCase;
  let trainingRepo: jest.Mocked<TrainingRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    trainingRepo = {
      createExecution: jest.fn().mockResolvedValue(fakeExecution),
    } as unknown as jest.Mocked<TrainingRepository>;

    outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockDb);
      }),
    };

    useCase = new ScheduleTrainingUseCase(mockDb as never, trainingRepo, outboxRepo);
  });

  // ── IQ: basic execution ────────────────────────────────────────────────────

  describe('IQ: basic execution', () => {
    it('runs inside a db transaction', async () => {
      await useCase.execute(scheduleDto as never, 'user-1');

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('returns the created execution', async () => {
      const result = await useCase.execute(scheduleDto as never, 'user-1');

      expect(result).toEqual(fakeExecution);
    });
  });

  // ── OQ: trainer_id null handling ───────────────────────────────────────────

  describe('OQ: trainer_id handling (ALCOA+ Accurate)', () => {
    it('passes trainer_id from dto when provided', async () => {
      await useCase.execute(scheduleDto as never, 'user-1');

      const passedFields = trainingRepo.createExecution.mock.calls[0]![0];
      expect(passedFields.trainer_id).toBe('trainer-uuid-1');
    });

    it('coerces undefined trainer_id to null', async () => {
      const dtoNoTrainer = { course_id: 'course-uuid-1', trainee_id: 'emp-uuid-1' };
      await useCase.execute(dtoNoTrainer as never, 'user-1');

      const passedFields = trainingRepo.createExecution.mock.calls[0]![0];
      expect(passedFields.trainer_id).toBeNull();
    });

    it('passes null trainer_id explicitly when null given in dto', async () => {
      const dtoNullTrainer = { ...scheduleDto, trainer_id: null };
      await useCase.execute(dtoNullTrainer as never, 'user-1');

      const passedFields = trainingRepo.createExecution.mock.calls[0]![0];
      expect(passedFields.trainer_id).toBeNull();
    });
  });

  // ── OQ: outbox event publishing ────────────────────────────────────────────

  describe('OQ: outbox event publishing', () => {
    it('publishes event with TRAINING_EXECUTION_TOPIC', async () => {
      await useCase.execute(scheduleDto as never, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.topic).toBe(TRAINING_EXECUTION_TOPIC);
    });

    it('event key is the execution id (ALCOA+ Attributable)', async () => {
      await useCase.execute(scheduleDto as never, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.key).toBe(fakeExecution.id);
    });

    it('event payload eventType is training.execution.scheduled', async () => {
      await useCase.execute(scheduleDto as never, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as Record<string, unknown>;
      expect(payload['eventType']).toBe('training.execution.scheduled');
    });

    it('event payload employeeId matches trainee_id from execution', async () => {
      await useCase.execute(scheduleDto as never, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as { payload: { employeeId: string } };
      expect(payload.payload.employeeId).toBe(fakeExecution.trainee_id);
    });

    it('event payload scheduledDate is today (ALCOA+ Contemporaneous)', async () => {
      const today = new Date().toISOString().split('T')[0]!;
      await useCase.execute(scheduleDto as never, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as { payload: { scheduledDate: string } };
      expect(payload.payload.scheduledDate).toBe(today);
    });
  });

  // ── PQ: transactional integrity ────────────────────────────────────────────

  describe('PQ: transactional integrity', () => {
    it('passes the same tx to trainingRepo.createExecution and outboxRepo.createWithTx', async () => {
      await useCase.execute(scheduleDto as never, 'user-1');

      const txForCreate = trainingRepo.createExecution.mock.calls[0]![2];
      const txForOutbox = outboxRepo.createWithTx.mock.calls[0]![0];
      expect(txForCreate).toBe(txForOutbox);
    });
  });
});

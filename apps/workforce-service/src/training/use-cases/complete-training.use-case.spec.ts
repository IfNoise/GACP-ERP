import { CompleteTrainingUseCase } from './complete-training.use-case';
import type { TrainingRepository } from '../training.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import { TRAINING_EXECUTION_TOPIC, TRAINING_CERTIFICATION_TOPIC } from '@gacp-erp/shared-events';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeCourse = {
  id: 'course-uuid-1',
  course_id: 'COURSE-001',
  title: 'GMP Basics',
  type: 'GMP',
  duration_hours: 4,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
} as const;

function makeExecution(status: 'COMPLETED' | 'FAILED') {
  return {
    id: 'exec-uuid-1',
    course_id: 'course-uuid-1',
    trainee_id: 'emp-uuid-1',
    trainer_id: null,
    status,
    score: 85,
    electronic_signature: { user: 'user-1', timestamp: new Date().toISOString() },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-1',
    updated_by: 'user-1',
    deleted_at: null,
  } as const;
}

const fakeCert = {
  id: 'cert-uuid-1',
  employee_id: 'emp-uuid-1',
  course_id: 'course-uuid-1',
  execution_id: 'exec-uuid-1',
  certificate_number: 'CERT-2025-123456',
  issued_at: new Date().toISOString(),
  expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  deleted_at: null,
} as const;

const completeDto = {
  score: 85,
  electronic_signature: { user: 'user-1', timestamp: new Date().toISOString() },
} as const;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CompleteTrainingUseCase', () => {
  let useCase: CompleteTrainingUseCase;
  let trainingRepo: jest.Mocked<TrainingRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  function setup(executionStatus: 'COMPLETED' | 'FAILED' = 'COMPLETED') {
    trainingRepo = {
      completeExecution: jest.fn().mockResolvedValue(makeExecution(executionStatus)),
      findCourseByIdOrThrow: jest.fn().mockResolvedValue(fakeCourse),
      createCertification: jest.fn().mockResolvedValue(fakeCert),
    } as unknown as jest.Mocked<TrainingRepository>;

    outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockDb);
      }),
    };

    useCase = new CompleteTrainingUseCase(mockDb as never, trainingRepo, outboxRepo);
  }

  beforeEach(() => setup());

  // ── IQ: basic execution ────────────────────────────────────────────────────

  describe('IQ: basic execution', () => {
    it('runs inside a db transaction', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('returns the completed execution', async () => {
      const result = await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      expect(result.id).toBe('exec-uuid-1');
    });

    it('calls completeExecution with executionId, score, and signature', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      expect(trainingRepo.completeExecution.mock.calls[0]![0]).toBe('exec-uuid-1');
      expect(trainingRepo.completeExecution.mock.calls[0]![1]).toBe(85);
    });
  });

  // ── OQ: COMPLETED path ─────────────────────────────────────────────────────

  describe('OQ: COMPLETED path — certification issued', () => {
    it('publishes 2 outbox events when status is COMPLETED', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(2);
    });

    it('first event topic is TRAINING_EXECUTION_TOPIC', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      const [, firstEvent] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(firstEvent.topic).toBe(TRAINING_EXECUTION_TOPIC);
    });

    it('second event topic is TRAINING_CERTIFICATION_TOPIC', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      const [, secondEvent] = outboxRepo.createWithTx.mock.calls[1]!;
      expect(secondEvent.topic).toBe(TRAINING_CERTIFICATION_TOPIC);
    });

    it('creates certification with execution_id (ALCOA+ Attributable)', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      const certArgs = trainingRepo.createCertification.mock.calls[0]![0];
      expect(certArgs.execution_id).toBe('exec-uuid-1');
    });

    it('certification valid_until is approximately 1 year from today', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      const certArgs = trainingRepo.createCertification.mock.calls[0]![0];
      const validUntil = new Date(certArgs.valid_until);
      const expectedYear = new Date().getFullYear() + 1;
      expect(validUntil.getFullYear()).toBe(expectedYear);
    });

    it('certificate_number matches CERT-YYYY-NNNNNN format', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      const certArgs = trainingRepo.createCertification.mock.calls[0]![0];
      expect(certArgs.certificate_number).toMatch(/^CERT-\d{4}-\d{6}$/);
    });

    it('first event eventType is training.execution.completed', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      const [, firstEvent] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = firstEvent.payload as Record<string, unknown>;
      expect(payload['eventType']).toBe('training.execution.completed');
    });

    it('second event eventType is training.certification.issued', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      const [, secondEvent] = outboxRepo.createWithTx.mock.calls[1]!;
      const payload = secondEvent.payload as Record<string, unknown>;
      expect(payload['eventType']).toBe('training.certification.issued');
    });
  });

  // ── OQ: FAILED path ────────────────────────────────────────────────────────

  describe('OQ: FAILED path — no certification issued', () => {
    beforeEach(() => setup('FAILED'));

    it('publishes only 1 outbox event when status is FAILED', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
    });

    it('does NOT call createCertification when status is FAILED', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      expect(trainingRepo.createCertification).not.toHaveBeenCalled();
    });

    it('event payload passed is FAILED (ALCOA+ Accurate)', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as { payload: { passed: boolean } };
      expect(payload.payload.passed).toBe(false);
    });
  });

  // ── PQ: transactional integrity ────────────────────────────────────────────

  describe('PQ: transactional integrity', () => {
    it('all repo calls use the same tx', async () => {
      await useCase.execute('exec-uuid-1', completeDto as never, 'user-1');

      const txForComplete = trainingRepo.completeExecution.mock.calls[0]![4];
      const txForCert = trainingRepo.createCertification.mock.calls[0]![2];
      const txForOutbox1 = outboxRepo.createWithTx.mock.calls[0]![0];
      const txForOutbox2 = outboxRepo.createWithTx.mock.calls[1]![0];

      expect(txForComplete).toBe(txForCert);
      expect(txForOutbox1).toBe(txForOutbox2);
    });
  });
});

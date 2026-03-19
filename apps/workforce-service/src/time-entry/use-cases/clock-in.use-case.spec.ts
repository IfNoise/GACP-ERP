import { ClockInUseCase } from './clock-in.use-case';
import type { TimeEntryRepository } from '../time-entry.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { CreateTimeEntry } from '@gacp-erp/shared-schemas';
import { WORKFORCE_TIME_TOPIC } from '@gacp-erp/shared-events';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeTimeEntry(recorded_via: string) {
  return {
    id: 'te-uuid-1',
    employee_id: 'emp-uuid-1',
    task_id: 'task-uuid-1',
    clock_in_at: '2025-06-01T08:00:00Z',
    clock_out_at: null,
    duration_minutes: null,
    recorded_via,
    approved_by: null,
    approved_at: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-1',
    updated_by: 'user-1',
    deleted_at: null,
  } as const;
}

const clockInDto: CreateTimeEntry = {
  employee_id: 'emp-uuid-1',
  task_id: 'task-uuid-1',
  clock_in_at: '2025-06-01T08:00:00Z',
  clock_out_at: null,
  recorded_via: 'TERMINAL',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClockInUseCase', () => {
  let useCase: ClockInUseCase;
  let timeEntryRepo: jest.Mocked<TimeEntryRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  function setup(recorded_via = 'TERMINAL') {
    timeEntryRepo = {
      clockIn: jest.fn().mockResolvedValue(makeTimeEntry(recorded_via)),
    } as unknown as jest.Mocked<TimeEntryRepository>;

    outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockDb);
      }),
    };

    useCase = new ClockInUseCase(mockDb as never, timeEntryRepo, outboxRepo);
  }

  beforeEach(() => setup());

  // ── IQ: basic execution ────────────────────────────────────────────────────

  describe('IQ: basic execution', () => {
    it('runs inside a db transaction', async () => {
      await useCase.execute(clockInDto, 'user-1');

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('returns the created time entry', async () => {
      const result = await useCase.execute(clockInDto, 'user-1');

      expect(result.id).toBe('te-uuid-1');
    });
  });

  // ── OQ: source mapping ─────────────────────────────────────────────────────

  describe('OQ: source mapping in event payload (ALCOA+ Accurate)', () => {
    it.each([
      ['TERMINAL', 'MOBILE'],
      ['WEB', 'MANUAL'],
      ['API', 'SYSTEM'],
    ])('maps Zod source %s → DB source %s in event payload', async (zodSource, dbSource) => {
      setup(zodSource);

      await useCase.execute(
        { ...clockInDto, recorded_via: zodSource as CreateTimeEntry['recorded_via'] },
        'user-1',
      );

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as { payload: { source: string } };
      expect(payload.payload.source).toBe(dbSource);
    });

    it('falls back to MANUAL for unknown source values', async () => {
      setup('UNKNOWN_SOURCE');

      await useCase.execute(
        { ...clockInDto, recorded_via: 'UNKNOWN_SOURCE' as CreateTimeEntry['recorded_via'] },
        'user-1',
      );

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as { payload: { source: string } };
      expect(payload.payload.source).toBe('MANUAL');
    });
  });

  describe('OQ: outbox event publishing', () => {
    it('publishes event with WORKFORCE_TIME_TOPIC', async () => {
      await useCase.execute(clockInDto, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.topic).toBe(WORKFORCE_TIME_TOPIC);
    });

    it('event key is the time entry id (ALCOA+ Original)', async () => {
      await useCase.execute(clockInDto, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(event.key).toBe('te-uuid-1');
    });

    it('event payload eventType is workforce.time_entry.created', async () => {
      await useCase.execute(clockInDto, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as Record<string, unknown>;
      expect(payload['eventType']).toBe('workforce.time_entry.created');
    });

    it('event payload employeeId matches dto employee_id', async () => {
      await useCase.execute(clockInDto, 'user-1');

      const [, event] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = event.payload as { payload: { employeeId: string } };
      expect(payload.payload.employeeId).toBe('emp-uuid-1');
    });
  });

  // ── PQ: transactional integrity ────────────────────────────────────────────

  describe('PQ: transactional integrity', () => {
    it('passes the same tx to timeEntryRepo.clockIn and outboxRepo.createWithTx', async () => {
      await useCase.execute(clockInDto, 'user-1');

      const txForClockIn = timeEntryRepo.clockIn.mock.calls[0]![2];
      const txForOutbox = outboxRepo.createWithTx.mock.calls[0]![0];
      expect(txForClockIn).toBe(txForOutbox);
    });
  });
});

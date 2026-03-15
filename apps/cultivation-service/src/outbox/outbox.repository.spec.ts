import { OutboxRepository, type OutboxEventCreate } from './outbox.repository';
import type { Database } from '@gacp-erp/shared-database';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDbWithRows(rows: Record<string, unknown>[] = []) {
  const whereFn = jest.fn().mockReturnThis();
  const orderByFn = jest.fn().mockReturnThis();
  const limitFn = jest.fn().mockResolvedValue(rows);
  const valuesFn = jest.fn().mockResolvedValue(undefined);
  const setFn = jest.fn().mockReturnThis();

  const selectChain = { from: jest.fn().mockReturnValue({ where: whereFn, orderBy: orderByFn }) };

  // where → orderBy → limit
  whereFn.mockReturnValue({ orderBy: orderByFn });
  orderByFn.mockReturnValue({ limit: limitFn });

  const insertChain = { values: valuesFn };
  const updateChain = { set: setFn };
  setFn.mockReturnValue({ where: whereFn });

  const db = {
    select: jest.fn().mockReturnValue(selectChain),
    insert: jest.fn().mockReturnValue(insertChain),
    update: jest.fn().mockReturnValue(updateChain),
    transaction: jest.fn(),
  };

  return { db, valuesFn, setFn, whereFn, limitFn };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OutboxRepository', () => {
  describe('createWithTx', () => {
    it('inserts the event via the provided transaction context', async () => {
      const valuesFn = jest.fn().mockResolvedValue(undefined);
      const tx = {
        insert: jest.fn().mockReturnValue({ values: valuesFn }),
      };

      const { db } = makeDbWithRows();
      const repo = new OutboxRepository(db as unknown as Database);

      const event: OutboxEventCreate = {
        topic: 'cultivation.plants.v1',
        key: 'plant-uuid-1',
        payload: { eventType: 'PLANT_CREATED' },
      };

      await repo.createWithTx(tx as never, event);

      expect(tx.insert).toHaveBeenCalledTimes(1);
      expect(valuesFn).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: event.topic,
          key: event.key,
          payload: event.payload,
        }),
      );
    });

    it('does NOT use db directly (only the tx)', async () => {
      const valuesFn = jest.fn().mockResolvedValue(undefined);
      const tx = { insert: jest.fn().mockReturnValue({ values: valuesFn }) };
      const { db } = makeDbWithRows();
      const repo = new OutboxRepository(db as unknown as Database);

      await repo.createWithTx(tx as never, {
        topic: 't',
        key: 'k',
        payload: {},
      });

      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('findPending', () => {
    it('returns mapped OutboxEvent objects', async () => {
      const rows = [
        {
          id: 'evt-1',
          topic: 'cultivation.plants.v1',
          key: 'plant-1',
          payload: { eventType: 'PLANT_CREATED' },
          status: 'PENDING',
          retry_count: 0,
        },
        {
          id: 'evt-2',
          topic: 'cultivation.plants.v1',
          key: 'plant-2',
          payload: { eventType: 'PLANT_STAGE_CHANGED' },
          status: 'PENDING',
          retry_count: 2,
        },
      ];

      // Mock the full drizzle chain: select().from().where().orderBy().limit()
      const limitFn = jest.fn().mockResolvedValue(rows);
      const orderByFn = jest.fn().mockReturnValue({ limit: limitFn });
      const whereFn = jest.fn().mockReturnValue({ orderBy: orderByFn });
      const fromFn = jest.fn().mockReturnValue({ where: whereFn });
      const db = { select: jest.fn().mockReturnValue({ from: fromFn }) } as unknown as Database;

      const repo = new OutboxRepository(db);
      const result = await repo.findPending(10);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'evt-1', retryCount: 0 });
      expect(result[1]).toMatchObject({ id: 'evt-2', retryCount: 2 });
    });

    it('uses default limit of 50', async () => {
      const limitFn = jest.fn().mockResolvedValue([]);
      const orderByFn = jest.fn().mockReturnValue({ limit: limitFn });
      const whereFn = jest.fn().mockReturnValue({ orderBy: orderByFn });
      const fromFn = jest.fn().mockReturnValue({ where: whereFn });
      const db = { select: jest.fn().mockReturnValue({ from: fromFn }) } as unknown as Database;

      const repo = new OutboxRepository(db);
      await repo.findPending();

      expect(limitFn).toHaveBeenCalledWith(50);
    });
  });

  describe('markPublished', () => {
    it('updates status to PUBLISHED and sets published_at', async () => {
      const whereFn = jest.fn().mockResolvedValue(undefined);
      const setFn = jest.fn().mockReturnValue({ where: whereFn });
      const db = {
        update: jest.fn().mockReturnValue({ set: setFn }),
      } as unknown as Database;

      const repo = new OutboxRepository(db);
      await repo.markPublished('evt-1');

      expect(setFn).toHaveBeenCalledWith(expect.objectContaining({ status: 'PUBLISHED' }));
    });
  });

  describe('markFailed', () => {
    it('sets status to FAILED when retryCount < 5', async () => {
      const whereFn = jest.fn().mockResolvedValue(undefined);
      const setFn = jest.fn().mockReturnValue({ where: whereFn });
      const db = {
        update: jest.fn().mockReturnValue({ set: setFn }),
      } as unknown as Database;

      const repo = new OutboxRepository(db);
      await repo.markFailed('evt-1', 'timeout', 2);

      expect(setFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FAILED', retry_count: 3 }),
      );
    });

    it('sets status to DEAD when retryCount >= 5', async () => {
      const whereFn = jest.fn().mockResolvedValue(undefined);
      const setFn = jest.fn().mockReturnValue({ where: whereFn });
      const db = {
        update: jest.fn().mockReturnValue({ set: setFn }),
      } as unknown as Database;

      const repo = new OutboxRepository(db);
      await repo.markFailed('evt-1', 'timeout', 5);

      expect(setFn).toHaveBeenCalledWith(expect.objectContaining({ status: 'DEAD' }));
    });
  });
});

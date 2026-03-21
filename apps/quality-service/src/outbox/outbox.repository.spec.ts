import { type OutboxRepository as OutboxRepositoryType } from './outbox.repository';

const { OutboxRepository } = require('./outbox.repository') as {
  OutboxRepository: new (...args: unknown[]) => OutboxRepositoryType;
};

function makeDbChains(rows: unknown[] = []) {
  const selectWhereFn = jest.fn();
  const orderByFn = jest.fn();
  const limitFn = jest.fn();
  const setFn = jest.fn();
  const updateWhereFn = jest.fn();

  const selectChain = { from: jest.fn() };
  selectChain.from.mockReturnValue({
    where: selectWhereFn.mockReturnValue({
      orderBy: orderByFn.mockReturnValue({
        limit: limitFn.mockResolvedValue(rows),
      }),
    }),
  });

  const updateChain = {
    set: setFn.mockReturnValue({
      where: updateWhereFn.mockResolvedValue(undefined),
    }),
  };

  const insertChain = {
    values: jest.fn().mockResolvedValue(undefined),
  };

  const db = {
    select: jest.fn().mockReturnValue(selectChain),
    update: jest.fn().mockReturnValue(updateChain),
    insert: jest.fn().mockReturnValue(insertChain),
    execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '42' }] }),
  };

  return { db, selectChain, selectWhereFn, setFn, insertChain };
}

const fakeRow = {
  id: 'ev-1',
  topic: 'topic-1',
  key: 'key-1',
  payload: { data: 1 },
  retry_count: 0,
  status: 'PENDING',
  created_at: new Date(),
  published_at: null,
  last_error: null,
};

describe('OutboxRepository', () => {
  describe('createWithTx', () => {
    it('should insert into outbox table', async () => {
      const tx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue(undefined),
        }),
      };
      const { db } = makeDbChains();
      const repo = new OutboxRepository(db as never);

      await repo.createWithTx(tx as never, {
        topic: 'topic-1',
        key: 'key-1',
        payload: { data: 1 },
      });

      expect(tx.insert).toHaveBeenCalled();
    });
  });

  describe('findPending', () => {
    it('should return mapped outbox events', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new OutboxRepository(db as never);

      const result = await repo.findPending(10);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'ev-1',
        topic: 'topic-1',
        key: 'key-1',
        payload: { data: 1 },
        retryCount: 0,
      });
    });
  });

  describe('markPublished', () => {
    it('should update event status to PUBLISHED', async () => {
      const { db, setFn } = makeDbChains();
      const repo = new OutboxRepository(db as never);

      await repo.markPublished('ev-1');

      expect(db.update).toHaveBeenCalled();
      expect(setFn).toHaveBeenCalledWith(expect.objectContaining({ status: 'PUBLISHED' }));
    });
  });

  describe('markFailed', () => {
    it('should set status to FAILED when retries not exceeded', async () => {
      const { db, setFn } = makeDbChains();
      const repo = new OutboxRepository(db as never);

      await repo.markFailed('ev-1', 'some error', 2);

      expect(setFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FAILED', retry_count: 3 }),
      );
    });

    it('should set status to DEAD when retries exceeded', async () => {
      const { db, setFn } = makeDbChains();
      const repo = new OutboxRepository(db as never);

      await repo.markFailed('ev-1', 'fail', 4);

      expect(setFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DEAD', retry_count: 5 }),
      );
    });

    it('should truncate long error messages', async () => {
      const { db, setFn } = makeDbChains();
      const repo = new OutboxRepository(db as never);

      const longError = 'x'.repeat(3000);
      await repo.markFailed('ev-1', longError, 0);

      const call = setFn.mock.calls[0][0] as { last_error: string };
      expect(call.last_error.length).toBe(2000);
    });
  });

  describe('requeueFailed', () => {
    it('should update FAILED events to PENDING', async () => {
      const { db, setFn } = makeDbChains();
      const repo = new OutboxRepository(db as never);

      await repo.requeueFailed();

      expect(db.update).toHaveBeenCalled();
      expect(setFn).toHaveBeenCalledWith({ status: 'PENDING' });
    });
  });
});

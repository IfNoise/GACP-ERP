import { type OutboxRepository as OutboxRepositoryType } from './outbox.repository';

const { OutboxRepository } = require('./outbox.repository') as {
  OutboxRepository: new (...args: unknown[]) => OutboxRepositoryType;
};

function makeSelectChain(rows: unknown[]) {
  const limitFn = jest.fn().mockResolvedValue(rows);
  const orderByFn = jest.fn().mockReturnValue({ limit: limitFn });
  const whereFn = jest.fn().mockReturnValue({ orderBy: orderByFn });
  const fromFn = jest.fn().mockReturnValue({ where: whereFn });
  return { from: fromFn };
}

function makeUpdateChain() {
  const updateWhereFn = jest.fn().mockResolvedValue(undefined);
  const setFn = jest.fn().mockReturnValue({ where: updateWhereFn });
  return { set: setFn, updateWhereFn };
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
      const db = {};
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
    it('should return mapped events', async () => {
      const sel = makeSelectChain([fakeRow]);
      const db = { select: jest.fn().mockReturnValue(sel) };
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

    it('should use default limit', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new OutboxRepository(db as never);
      const result = await repo.findPending();
      expect(result).toHaveLength(0);
    });
  });

  describe('markPublished', () => {
    it('should update status to PUBLISHED', async () => {
      const upd = makeUpdateChain();
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new OutboxRepository(db as never);
      await repo.markPublished('ev-1');
      expect(upd.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'PUBLISHED' }));
    });
  });

  describe('markFailed', () => {
    it('should set status to FAILED when retries not exceeded', async () => {
      const upd = makeUpdateChain();
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new OutboxRepository(db as never);
      await repo.markFailed('ev-1', 'error', 2);
      expect(upd.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FAILED', retry_count: 3 }),
      );
    });

    it('should set status to DEAD when retries exceeded', async () => {
      const upd = makeUpdateChain();
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new OutboxRepository(db as never);
      await repo.markFailed('ev-1', 'error', 4);
      expect(upd.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'DEAD' }));
    });

    it('should truncate long error messages', async () => {
      const upd = makeUpdateChain();
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new OutboxRepository(db as never);
      const longError = 'x'.repeat(3000);
      await repo.markFailed('ev-1', longError, 0);
      const call = upd.set.mock.calls[0]![0] as { last_error: string };
      expect(call.last_error.length).toBe(2000);
    });
  });

  describe('requeueFailed', () => {
    it('should update FAILED to PENDING', async () => {
      const upd = makeUpdateChain();
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new OutboxRepository(db as never);
      await repo.requeueFailed();
      expect(upd.set).toHaveBeenCalledWith({ status: 'PENDING' });
    });
  });
});

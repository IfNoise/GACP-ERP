import { type OutboxRelayService as OutboxRelayServiceType } from './outbox-relay.service';

jest.mock('@nestjs/schedule', () => ({
  Interval: () => () => {
    /* noop */
  },
}));

const { OutboxRelayService } = require('./outbox-relay.service') as {
  OutboxRelayService: new (...args: unknown[]) => OutboxRelayServiceType;
};

const mockOutboxRepo = {
  requeueFailed: jest.fn().mockResolvedValue(undefined),
  findPending: jest.fn().mockResolvedValue([]),
  markPublished: jest.fn().mockResolvedValue(undefined),
  markFailed: jest.fn().mockResolvedValue(undefined),
};

const mockKafka = {
  publish: jest.fn(),
};

describe('OutboxRelayService', () => {
  let service: OutboxRelayServiceType;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OutboxRelayService(mockOutboxRepo as never, mockKafka as never);
  });

  describe('onModuleInit', () => {
    it('should requeue failed events', async () => {
      await service.onModuleInit();
      expect(mockOutboxRepo.requeueFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('relay', () => {
    it('should do nothing when no pending events', async () => {
      mockOutboxRepo.findPending.mockResolvedValue([]);
      await service.relay();
      expect(mockKafka.publish).not.toHaveBeenCalled();
    });

    it('should publish events and mark as published', async () => {
      const events = [{ id: 'ev-1', topic: 'topic', key: 'k', payload: { d: 1 }, retryCount: 0 }];
      mockOutboxRepo.findPending.mockResolvedValue(events);
      await service.relay();
      expect(mockKafka.publish).toHaveBeenCalledWith('topic', 'k', { d: 1 });
      expect(mockOutboxRepo.markPublished).toHaveBeenCalledWith('ev-1');
    });

    it('should mark failed when publish throws', async () => {
      const events = [{ id: 'ev-2', topic: 'topic', key: 'k', payload: {}, retryCount: 1 }];
      mockOutboxRepo.findPending.mockResolvedValue(events);
      mockKafka.publish.mockRejectedValueOnce(new Error('Kafka down'));
      await service.relay();
      expect(mockOutboxRepo.markFailed).toHaveBeenCalledWith('ev-2', 'Kafka down', 1);
    });

    it('should mark failed with String(err) for non-Error', async () => {
      const events = [{ id: 'ev-3', topic: 'topic', key: 'k', payload: {}, retryCount: 0 }];
      mockOutboxRepo.findPending.mockResolvedValue(events);
      mockKafka.publish.mockRejectedValueOnce('timeout');
      await service.relay();
      expect(mockOutboxRepo.markFailed).toHaveBeenCalledWith('ev-3', 'timeout', 0);
    });

    it('should not run concurrently', async () => {
      // Make findPending slow so we can test concurrency guard
      let resolveFirst: () => void;
      const firstCall = new Promise<void>((r) => {
        resolveFirst = r;
      });
      mockOutboxRepo.findPending.mockImplementationOnce(async () => {
        await firstCall;
        return [];
      });

      const p1 = service.relay();
      const p2 = service.relay(); // should skip due to isProcessing guard

      resolveFirst!();
      await p1;
      await p2;

      // findPending called only once because second relay should return immediately
      expect(mockOutboxRepo.findPending).toHaveBeenCalledTimes(1);
    });

    it('should handle cycle error gracefully', async () => {
      mockOutboxRepo.findPending.mockRejectedValueOnce(new Error('DB down'));
      // Should not throw
      await expect(service.relay()).resolves.toBeUndefined();
    });
  });
});

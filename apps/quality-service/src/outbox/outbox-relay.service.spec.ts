import { type OutboxRelayService as OutboxRelayServiceType } from './outbox-relay.service';

const { OutboxRelayService } = require('./outbox-relay.service') as {
  OutboxRelayService: new (...args: unknown[]) => OutboxRelayServiceType;
};

describe('OutboxRelayService (quality)', () => {
  let service: OutboxRelayServiceType;
  let outboxRepo: {
    requeueFailed: jest.Mock;
    findPending: jest.Mock;
    markPublished: jest.Mock;
    markFailed: jest.Mock;
  };
  let kafkaProducer: { publish: jest.Mock };

  beforeEach(() => {
    outboxRepo = {
      requeueFailed: jest.fn().mockResolvedValue(undefined),
      findPending: jest.fn().mockResolvedValue([]),
      markPublished: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };
    kafkaProducer = { publish: jest.fn().mockResolvedValue(undefined) };

    service = new OutboxRelayService(outboxRepo as never, kafkaProducer as never);
  });

  describe('onModuleInit', () => {
    it('should requeue failed events', async () => {
      await service.onModuleInit();
      expect(outboxRepo.requeueFailed).toHaveBeenCalled();
    });
  });

  describe('relay', () => {
    it('should return early when no pending events', async () => {
      await service.relay();
      expect(outboxRepo.findPending).toHaveBeenCalled();
      expect(kafkaProducer.publish).not.toHaveBeenCalled();
    });

    it('should publish events and mark them published', async () => {
      const events = [{ id: 'ev-1', topic: 't', key: 'k', payload: { x: 1 }, retryCount: 0 }];
      outboxRepo.findPending.mockResolvedValue(events as never);

      await service.relay();

      expect(kafkaProducer.publish).toHaveBeenCalledWith('t', 'k', { x: 1 });
      expect(outboxRepo.markPublished).toHaveBeenCalledWith('ev-1');
    });

    it('should mark event as failed when publish throws', async () => {
      const events = [{ id: 'ev-1', topic: 't', key: 'k', payload: {}, retryCount: 2 }];
      outboxRepo.findPending.mockResolvedValue(events as never);
      kafkaProducer.publish.mockRejectedValue(new Error('Kafka down') as never);

      await service.relay();

      expect(outboxRepo.markFailed).toHaveBeenCalledWith('ev-1', 'Kafka down', 2);
    });

    it('should handle non-Error thrown values', async () => {
      const events = [{ id: 'ev-1', topic: 't', key: 'k', payload: {}, retryCount: 0 }];
      outboxRepo.findPending.mockResolvedValue(events as never);
      kafkaProducer.publish.mockRejectedValue('string error' as never);

      await service.relay();

      expect(outboxRepo.markFailed).toHaveBeenCalledWith('ev-1', 'string error', 0);
    });

    it('should not run concurrently', async () => {
      const events = [{ id: 'ev-1', topic: 't', key: 'k', payload: {}, retryCount: 0 }];
      outboxRepo.findPending.mockResolvedValue(events as never);
      kafkaProducer.publish.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50)),
      );

      const p1 = service.relay();
      const p2 = service.relay();
      await Promise.all([p1, p2]);

      expect(outboxRepo.findPending).toHaveBeenCalledTimes(1);
    });

    it('should handle unexpected error in relay cycle', async () => {
      outboxRepo.findPending.mockRejectedValue(new Error('DB down') as never);
      await expect(service.relay()).resolves.not.toThrow();
    });
  });
});

import { type OutboxRelayService as OutboxRelayServiceType } from './outbox-relay.service';

const { OutboxRelayService } = require('./outbox-relay.service') as {
  OutboxRelayService: new (...args: unknown[]) => OutboxRelayServiceType;
};

function makeDeps() {
  const outboxRepo = {
    requeueFailed: jest.fn().mockResolvedValue(undefined),
    findPending: jest.fn().mockResolvedValue([]),
    markPublished: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
  };

  const kafkaProducer = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  return { outboxRepo, kafkaProducer };
}

describe('OutboxRelayService', () => {
  let service: OutboxRelayServiceType;
  let deps: ReturnType<typeof makeDeps>;

  beforeEach(() => {
    deps = makeDeps();
    service = new OutboxRelayService(deps.outboxRepo as never, deps.kafkaProducer as never);
  });

  describe('onModuleInit', () => {
    it('should requeue failed events', async () => {
      await service.onModuleInit();
      expect(deps.outboxRepo.requeueFailed).toHaveBeenCalled();
    });
  });

  describe('relay', () => {
    it('should do nothing when no pending events', async () => {
      deps.outboxRepo.findPending.mockResolvedValue([]);
      await service.relay();
      expect(deps.kafkaProducer.publish).not.toHaveBeenCalled();
    });

    it('should publish and mark events', async () => {
      const event = { id: 'e1', topic: 't', key: 'k', payload: {}, retryCount: 0 };
      deps.outboxRepo.findPending.mockResolvedValue([event]);

      await service.relay();

      expect(deps.kafkaProducer.publish).toHaveBeenCalledWith('t', 'k', {});
      expect(deps.outboxRepo.markPublished).toHaveBeenCalledWith('e1');
    });

    it('should mark failed when publish throws', async () => {
      const event = { id: 'e1', topic: 't', key: 'k', payload: {}, retryCount: 1 };
      deps.outboxRepo.findPending.mockResolvedValue([event]);
      deps.kafkaProducer.publish.mockRejectedValue(new Error('boom'));

      await service.relay();

      expect(deps.outboxRepo.markFailed).toHaveBeenCalledWith('e1', 'boom', 1);
    });

    it('should handle non-Error thrown values', async () => {
      const event = { id: 'e1', topic: 't', key: 'k', payload: {}, retryCount: 0 };
      deps.outboxRepo.findPending.mockResolvedValue([event]);
      deps.kafkaProducer.publish.mockRejectedValue('string-error');

      await service.relay();

      expect(deps.outboxRepo.markFailed).toHaveBeenCalledWith('e1', 'string-error', 0);
    });

    it('should not run concurrently', async () => {
      const event = { id: 'e1', topic: 't', key: 'k', payload: {}, retryCount: 0 };
      deps.outboxRepo.findPending.mockResolvedValue([event]);

      // Start relay, then call again while it's processing
      const p1 = service.relay();
      const p2 = service.relay(); // should return immediately
      await p1;
      await p2;

      // findPending only called once because second relay sees isProcessing=true
      expect(deps.outboxRepo.findPending).toHaveBeenCalledTimes(1);
    });

    it('should handle cycle errors', async () => {
      deps.outboxRepo.findPending.mockRejectedValue(new Error('db error'));
      await expect(service.relay()).resolves.toBeUndefined();
    });
  });
});

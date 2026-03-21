import { type OutboxRelayService as OutboxRelayServiceType } from './outbox-relay.service';
import { type OutboxRepository } from './outbox.repository';
import { type KafkaProducerService } from '../kafka/kafka-producer.service';

const { OutboxRelayService } = require('./outbox-relay.service') as {
  OutboxRelayService: new (...args: unknown[]) => OutboxRelayServiceType;
};

describe('OutboxRelayService', () => {
  let service: OutboxRelayServiceType;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let kafkaProducer: jest.Mocked<KafkaProducerService>;

  beforeEach(() => {
    outboxRepo = {
      findPending: jest.fn(),
      markPublished: jest.fn(),
      markFailed: jest.fn(),
      requeueFailed: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    kafkaProducer = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<KafkaProducerService>;

    service = new OutboxRelayService(outboxRepo, kafkaProducer);
  });

  describe('onModuleInit', () => {
    it('should requeue failed events on init', async () => {
      outboxRepo.requeueFailed.mockResolvedValue(undefined);
      await service.onModuleInit();
      expect(outboxRepo.requeueFailed).toHaveBeenCalled();
    });
  });

  describe('relay', () => {
    it('should do nothing when no pending events', async () => {
      outboxRepo.findPending.mockResolvedValue([]);
      await service.relay();
      expect(kafkaProducer.publish).not.toHaveBeenCalled();
    });

    it('should publish pending events and mark published', async () => {
      const events = [
        { id: 'ev-1', topic: 'topic-1', key: 'key-1', payload: { data: 1 }, retryCount: 0 },
        { id: 'ev-2', topic: 'topic-2', key: 'key-2', payload: { data: 2 }, retryCount: 0 },
      ];
      outboxRepo.findPending.mockResolvedValue(events as never);
      kafkaProducer.publish.mockResolvedValue(undefined as never);
      outboxRepo.markPublished.mockResolvedValue(undefined);

      await service.relay();

      expect(kafkaProducer.publish).toHaveBeenCalledTimes(2);
      expect(kafkaProducer.publish).toHaveBeenCalledWith('topic-1', 'key-1', { data: 1 });
      expect(kafkaProducer.publish).toHaveBeenCalledWith('topic-2', 'key-2', { data: 2 });
      expect(outboxRepo.markPublished).toHaveBeenCalledWith('ev-1');
      expect(outboxRepo.markPublished).toHaveBeenCalledWith('ev-2');
    });

    it('should mark event as failed when publish throws', async () => {
      const events = [
        { id: 'ev-1', topic: 'topic-1', key: 'key-1', payload: { data: 1 }, retryCount: 2 },
      ];
      outboxRepo.findPending.mockResolvedValue(events as never);
      kafkaProducer.publish.mockRejectedValue(new Error('Kafka down') as never);
      outboxRepo.markFailed.mockResolvedValue(undefined);

      await service.relay();

      expect(outboxRepo.markFailed).toHaveBeenCalledWith('ev-1', 'Kafka down', 2);
      expect(outboxRepo.markPublished).not.toHaveBeenCalled();
    });

    it('should handle non-Error thrown values', async () => {
      const events = [{ id: 'ev-1', topic: 'topic-1', key: 'key-1', payload: {}, retryCount: 0 }];
      outboxRepo.findPending.mockResolvedValue(events as never);
      kafkaProducer.publish.mockRejectedValue('string error' as never);
      outboxRepo.markFailed.mockResolvedValue(undefined);

      await service.relay();

      expect(outboxRepo.markFailed).toHaveBeenCalledWith('ev-1', 'string error', 0);
    });

    it('should not run concurrently (isProcessing guard)', async () => {
      const events = [{ id: 'ev-1', topic: 'topic-1', key: 'key-1', payload: {}, retryCount: 0 }];

      let resolvePublish: () => void;
      const publishPromise = new Promise<void>((resolve) => {
        resolvePublish = resolve;
      });

      outboxRepo.findPending.mockResolvedValue(events as never);
      kafkaProducer.publish.mockReturnValue(publishPromise as never);
      outboxRepo.markPublished.mockResolvedValue(undefined);

      // Start first relay
      const first = service.relay();
      // Start second relay while first is still running (should be skipped)
      const second = service.relay();

      resolvePublish!();
      await first;
      await second;

      // findPending should only be called once (second relay was skipped)
      expect(outboxRepo.findPending).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in relay cycle gracefully', async () => {
      outboxRepo.findPending.mockRejectedValue(new Error('DB error'));

      // Should not throw
      await service.relay();

      expect(kafkaProducer.publish).not.toHaveBeenCalled();
    });
  });
});

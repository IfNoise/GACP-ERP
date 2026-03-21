import { type KafkaProducerService as KafkaProducerServiceType } from './kafka-producer.service';

const { KafkaProducerService } = require('./kafka-producer.service') as {
  KafkaProducerService: new (...args: unknown[]) => KafkaProducerServiceType;
};

const mockClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
};

describe('KafkaProducerService', () => {
  let service: KafkaProducerServiceType;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KafkaProducerService(mockClient as never);
  });

  describe('onModuleInit', () => {
    it('should connect to Kafka', async () => {
      await service.onModuleInit();
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection failure gracefully', async () => {
      mockClient.connect.mockRejectedValueOnce(new Error('Connection refused'));
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close connection', async () => {
      await service.onModuleDestroy();
      expect(mockClient.close).toHaveBeenCalledTimes(1);
    });

    it('should handle close failure gracefully', async () => {
      mockClient.close.mockRejectedValueOnce(new Error('Already closed'));
      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
  });

  describe('publish', () => {
    it('should emit event to topic', () => {
      service.publish('my-topic', 'my-key', { data: 1 });
      expect(mockClient.emit).toHaveBeenCalledWith('my-topic', {
        key: 'my-key',
        value: JSON.stringify({ data: 1 }),
      });
    });

    it('should handle error callback', () => {
      let subscribeFn: (opts: { error: (e: unknown) => void }) => void;
      mockClient.emit.mockReturnValueOnce({
        subscribe: jest.fn().mockImplementation((opts: { error: (e: unknown) => void }) => {
          subscribeFn = () => opts.error(new Error('Publish failed'));
        }),
      });
      service.publish('topic', 'key', {});
      // Trigger error callback - should not throw
      subscribeFn!({
        error: () => {
          /* noop */
        },
      });
    });
  });
});

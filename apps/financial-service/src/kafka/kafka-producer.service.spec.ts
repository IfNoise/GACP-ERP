import { of, throwError } from 'rxjs';
import { type KafkaProducerService as KafkaProducerServiceType } from './kafka-producer.service';

const { KafkaProducerService } = require('./kafka-producer.service') as {
  KafkaProducerService: new (...args: unknown[]) => KafkaProducerServiceType;
};

function makeMockClient() {
  return {
    connect: jest.fn(),
    close: jest.fn(),
    emit: jest.fn(),
  };
}

describe('KafkaProducerService', () => {
  let service: KafkaProducerServiceType;
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
    service = new KafkaProducerService(client as never);
  });

  describe('onModuleInit', () => {
    it('should connect the kafka client', async () => {
      client.connect.mockResolvedValue(undefined);
      await service.onModuleInit();
      expect(client.connect).toHaveBeenCalled();
    });

    it('should log error if connect fails', async () => {
      client.connect.mockRejectedValue(new Error('fail'));
      await service.onModuleInit();
      expect(client.connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close the kafka client', async () => {
      client.close.mockResolvedValue(undefined);
      await service.onModuleDestroy();
      expect(client.close).toHaveBeenCalled();
    });

    it('should not throw if close fails', async () => {
      client.close.mockRejectedValue(new Error('fail'));
      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
  });

  describe('publish', () => {
    it('should emit serialized value to topic', () => {
      client.emit.mockReturnValue(of(undefined));
      service.publish('test-topic', 'key-1', { data: 42 });
      expect(client.emit).toHaveBeenCalledWith('test-topic', {
        key: 'key-1',
        value: JSON.stringify({ data: 42 }),
      });
    });

    it('should log error on publish failure', () => {
      client.emit.mockReturnValue(throwError(() => new Error('emit fail')));
      service.publish('topic', 'key', {});
      expect(client.emit).toHaveBeenCalled();
    });
  });
});

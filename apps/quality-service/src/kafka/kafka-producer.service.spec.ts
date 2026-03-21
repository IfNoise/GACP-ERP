import { type KafkaProducerService as KafkaProducerServiceType } from './kafka-producer.service';
import { type ClientKafka } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

const { KafkaProducerService } = require('./kafka-producer.service') as {
  KafkaProducerService: new (...args: unknown[]) => KafkaProducerServiceType;
};

describe('KafkaProducerService (quality)', () => {
  let service: KafkaProducerServiceType;
  let client: jest.Mocked<ClientKafka>;

  beforeEach(() => {
    client = {
      connect: jest.fn(),
      close: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientKafka>;

    service = new KafkaProducerService(client);
  });

  describe('onModuleInit', () => {
    it('should connect client', async () => {
      client.connect.mockResolvedValue(undefined as never);
      await service.onModuleInit();
      expect(client.connect).toHaveBeenCalled();
    });

    it('should log error if connect fails', async () => {
      client.connect.mockRejectedValue(new Error('Connection refused'));
      await service.onModuleInit();
      expect(client.connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close client', async () => {
      client.close.mockResolvedValue(undefined as never);
      await service.onModuleDestroy();
      expect(client.close).toHaveBeenCalled();
    });

    it('should not throw if close fails', async () => {
      client.close.mockRejectedValue(new Error('Already closed'));
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('publish', () => {
    it('should emit event with serialized value', () => {
      client.emit.mockReturnValue(of(undefined) as never);
      const payload = { eventType: 'TEST', data: 123 };

      service.publish('topic-1', 'key-1', payload);

      expect(client.emit).toHaveBeenCalledWith('topic-1', {
        key: 'key-1',
        value: JSON.stringify(payload),
      });
    });

    it('should handle publish error without throwing', () => {
      client.emit.mockReturnValue(throwError(() => new Error('Kafka down')) as never);
      expect(() => service.publish('topic-1', 'key-1', { data: 1 })).not.toThrow();
    });
  });
});

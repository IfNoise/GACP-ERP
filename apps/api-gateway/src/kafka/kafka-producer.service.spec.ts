import { KafkaProducerService } from './kafka-producer.service';
import { type ClientKafka } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

describe('KafkaProducerService', () => {
  let service: KafkaProducerService;
  let mockClient: {
    connect: jest.Mock;
    close: jest.Mock;
    emit: jest.Mock;
  };

  beforeEach(() => {
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn().mockReturnValue(of(undefined)),
    };
    service = new KafkaProducerService(mockClient as unknown as ClientKafka);
  });

  describe('onModuleInit()', () => {
    it('connects the Kafka client', async () => {
      await service.onModuleInit();
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it('does not throw when connection fails', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection refused'));
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('onModuleDestroy()', () => {
    it('closes the Kafka client', async () => {
      await service.onModuleDestroy();
      expect(mockClient.close).toHaveBeenCalledTimes(1);
    });

    it('does not throw when close fails', async () => {
      mockClient.close.mockRejectedValue(new Error('Already closed'));
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('publish()', () => {
    it('emits a message to the specified topic', () => {
      service.publish('audit.trail.v1', 'key-1', { eventType: 'TEST' });

      expect(mockClient.emit).toHaveBeenCalledTimes(1);
      expect(mockClient.emit).toHaveBeenCalledWith('audit.trail.v1', {
        key: 'key-1',
        value: JSON.stringify({ eventType: 'TEST' }),
      });
    });

    it('serializes value to JSON', () => {
      const payload = { nested: { data: [1, 2, 3] } };
      service.publish('topic', 'key', payload);

      const [, emitted] = mockClient.emit.mock.calls[0] as [string, { value: string }];
      expect(JSON.parse(emitted.value)).toEqual(payload);
    });

    it('does not throw when emit observable errors', () => {
      mockClient.emit.mockReturnValue(throwError(() => new Error('Kafka down')));

      expect(() => service.publish('topic', 'key', {})).not.toThrow();
    });
  });
});

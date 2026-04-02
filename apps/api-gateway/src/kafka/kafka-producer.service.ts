import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_CLIENT } from './kafka-tokens';

/**
 * Fire-and-forget Kafka producer.
 * Failures are logged but never propagate to callers.
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(@Inject(KAFKA_CLIENT) private readonly client: ClientKafka) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.error(`Kafka producer failed to connect: ${String(err)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.close();
    } catch {
      // ignore disconnect errors on shutdown
    }
  }

  publish(topic: string, key: string, value: unknown): void {
    this.client.emit(topic, { key, value: JSON.stringify(value) }).subscribe({
      error: (err: unknown) => {
        this.logger.error(`Failed to publish to ${topic} (key=${key}): ${String(err)}`);
      },
    });
  }
}

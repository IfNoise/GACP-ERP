import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { type OutboxRepository } from './outbox.repository';
import { type KafkaProducerService } from '../kafka/kafka-producer.service';

const RELAY_INTERVAL_MS = 5_000;
const RELAY_BATCH_SIZE = 50;

@Injectable()
export class OutboxRelayService implements OnModuleInit {
  private readonly logger = new Logger(OutboxRelayService.name);
  private isProcessing = false;

  constructor(
    private readonly outboxRepo: OutboxRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.outboxRepo.requeueFailed();
    this.logger.log('OutboxRelayService initialized — FAILED events re-queued to PENDING');
  }

  @Interval(RELAY_INTERVAL_MS)
  async relay(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      const events = await this.outboxRepo.findPending(RELAY_BATCH_SIZE);
      if (events.length === 0) return;

      this.logger.debug(`Relaying ${events.length} outbox event(s)`);

      await Promise.allSettled(
        events.map(async (event) => {
          try {
            await this.kafkaProducer.publish(event.topic, event.key, event.payload);
            await this.outboxRepo.markPublished(event.id);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Outbox relay failed for event ${event.id}: ${message}`);
            await this.outboxRepo.markFailed(event.id, message, event.retryCount);
          }
        }),
      );
    } catch (err) {
      this.logger.error('Outbox relay cycle error', err);
    } finally {
      this.isProcessing = false;
    }
  }
}

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OutboxRepository } from './outbox.repository';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

/** How often the relay polls for PENDING outbox events (ms) */
const RELAY_INTERVAL_MS = 5_000;

/** Batch size per poll cycle */
const RELAY_BATCH_SIZE = 50;

/**
 * OutboxRelayService — Step 3.2 Outbox Pattern
 *
 * Polls the `outbox_events` table for PENDING events and publishes them
 * to Kafka. Marks each event PUBLISHED on success, or FAILED/DEAD on error.
 *
 * Guarantees AT-LEAST-ONCE delivery: if a publish succeeds but the DB update
 * fails, the event will be re-published on the next cycle (idempotent
 * consumers should handle duplicates via `eventId` deduplication).
 *
 * On startup, FAILED events are re-queued to PENDING so they're retried.
 */
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

  /**
   * Main relay loop — runs every RELAY_INTERVAL_MS.
   * Guards against concurrent execution with `isProcessing` flag.
   */
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

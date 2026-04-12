import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CULTIVATION_TOPIC, BatchCreatedEventSchema } from '@gacp-erp/shared-events';
import { BiologicalAssetValuationUseCase } from './journal/use-cases/biological-asset-valuation.use-case';

/** System user UUID for Kafka-triggered records (seed in migration 026). */
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Consumes BATCH_CREATED events from the cultivation topic and creates an
 * initial IAS 41 biological-asset valuation record at cost = 0.
 * The cost is updated later when PO three-way match is complete.
 */
@Controller()
export class BatchIntakeConsumer {
  private readonly logger = new Logger(BatchIntakeConsumer.name);

  constructor(private readonly baValuationUseCase: BiologicalAssetValuationUseCase) {}

  @EventPattern(CULTIVATION_TOPIC)
  async handle(@Payload() raw: unknown): Promise<void> {
    const parsed = BatchCreatedEventSchema.safeParse(raw);
    if (!parsed.success) return; // not a BATCH_CREATED event — skip

    const { payload } = parsed.data;
    this.logger.log(
      `Recognizing biological asset for batch ${payload.batchId} (${payload.batchNumber})`,
    );

    await this.baValuationUseCase.execute(
      {
        batch_id: payload.batchId,
        valuation_method: 'COST',
        cost_value: 0,
        quantity_grams: 0,
        // electronic_signature intentionally omitted — system-triggered initial recognition
      },
      SYSTEM_USER_ID,
    );
  }
}

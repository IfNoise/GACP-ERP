import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PROCUREMENT_PO_TOPIC, type GoodsReceivedEvent } from '@gacp-erp/shared-events';
import { IncomingInspectionWorkflowUseCase } from './use-cases/incoming-inspection-workflow.use-case';

@Controller()
export class GoodsReceivedConsumer {
  private readonly logger = new Logger(GoodsReceivedConsumer.name);

  constructor(private readonly workflowUseCase: IncomingInspectionWorkflowUseCase) {}

  @EventPattern(PROCUREMENT_PO_TOPIC)
  async handleProcurementEvent(@Payload() data: Record<string, unknown>): Promise<void> {
    const eventType = data['eventType'] as string | undefined;

    // Only handle goods_received events from this topic
    if (eventType !== 'procurement.po.goods_received') {
      return;
    }

    const event = data as unknown as GoodsReceivedEvent;
    const payload = event.payload;

    this.logger.log(
      `Received GoodsReceived event: GRN ${payload.grnNumber} (PO: ${payload.poNumber})`,
    );

    try {
      // Create one inspection per GRN (covering all lines)
      // If there are strain lines, pick the first strain_id for the whole inspection
      const strainId = payload.lines?.find((l) => l.strainId != null)?.strainId ?? null;

      await this.workflowUseCase.createFromGoodsReceived(
        {
          grn_id: payload.grnId,
          po_id: payload.poId,
          supplier_id: payload.supplierId,
          ...(strainId != null ? { strain_id: strainId } : {}),
          quarantine_days_required: 7,
        },
        event.triggeredBy,
      );

      this.logger.log(`Inspection created for GRN ${payload.grnNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to create inspection for GRN ${payload.grnNumber}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

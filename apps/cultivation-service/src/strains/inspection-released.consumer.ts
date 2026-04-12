import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { QUALITY_INSPECTION_TOPIC, type InspectionReleasedEvent } from '@gacp-erp/shared-events';
import { ActivateStrainUseCase } from './use-cases/activate-strain.use-case';

@Controller()
export class InspectionReleasedConsumer {
  private readonly logger = new Logger(InspectionReleasedConsumer.name);

  constructor(private readonly activateStrainUseCase: ActivateStrainUseCase) {}

  @EventPattern(QUALITY_INSPECTION_TOPIC)
  async handleInspectionEvent(@Payload() data: Record<string, unknown>): Promise<void> {
    const eventType = data['eventType'] as string | undefined;

    // Only handle released events
    if (eventType !== 'quality.inspection.released') {
      return;
    }

    const event = data as unknown as InspectionReleasedEvent;
    const payload = event.payload;

    // Only activate if this inspection has a strain reference
    if (!payload.strainId) {
      this.logger.log(
        `Inspection ${payload.inspectionNumber} released without strain reference, skipping`,
      );
      return;
    }

    this.logger.log(
      `Received InspectionReleased for strain ${payload.strainId} (inspection: ${payload.inspectionNumber})`,
    );

    try {
      await this.activateStrainUseCase.execute({
        strainId: payload.strainId,
        inspectionId: payload.inspectionId,
        inspectionNumber: payload.inspectionNumber,
        activatedBy: event.triggeredBy,
      });

      this.logger.log(`Strain ${payload.strainId} activated via inspection release`);
    } catch (error) {
      this.logger.error(
        `Failed to activate strain ${payload.strainId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

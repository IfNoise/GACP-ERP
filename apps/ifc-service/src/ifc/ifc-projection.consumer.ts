import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { IFC_PROJECTION_TOPIC, IfcProjectionEventSchema } from '@gacp-erp/shared-events';
import { IfcRevisionRepository } from './ifc-revision.repository';

@Controller()
export class IfcProjectionConsumer {
  private readonly logger = new Logger(IfcProjectionConsumer.name);

  constructor(private readonly revisionRepo: IfcRevisionRepository) {}

  @EventPattern(IFC_PROJECTION_TOPIC)
  async handle(@Payload() raw: unknown): Promise<void> {
    const parsed = IfcProjectionEventSchema.safeParse(raw);
    if (!parsed.success) return;

    const event = parsed.data;
    const { revisionId, projectionRunId, status } = event.payload;

    let domain: 'spatial' | 'financial' | 'iot';
    if (event.eventType === 'ifc.projection.spatial.updated') {
      domain = 'spatial';
    } else if (event.eventType === 'ifc.projection.financial.updated') {
      domain = 'financial';
    } else {
      domain = 'iot';
    }

    try {
      await this.revisionRepo.appendProjectionStatus(revisionId, domain, status, projectionRunId);
      this.logger.log(
        `Projection ${domain}=${status} recorded for revision ${revisionId} (run=${projectionRunId})`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to record ${domain} projection for revision ${revisionId}: ${String(err)}`,
      );
    }
  }
}

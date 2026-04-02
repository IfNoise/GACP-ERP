import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import { type AssessImpact, type ChangeControl, type UserId } from '@gacp-erp/shared-schemas';
import { QUALITY_CHANGE_TOPIC, type ChangeImpactAssessedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { ChangeControlRepository } from '../change-control.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import {
  ChangeControlWorkflowEngine,
  InvalidChangeControlTransitionError,
} from '../change-control-workflow.engine';

const RISK_ORDER: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

@Injectable()
export class AssessImpactUseCase {
  private readonly logger = new Logger(AssessImpactUseCase.name);
  private readonly engine = new ChangeControlWorkflowEngine();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: ChangeControlRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(id: string, dto: AssessImpact, assessorId: string): Promise<ChangeControl> {
    const cc = await this.repo.findByIdOrThrow(id);

    try {
      this.engine.transition(cc, 'IMPACT_ASSESSED');
    } catch (e) {
      if (e instanceof InvalidChangeControlTransitionError) {
        throw new ConflictException(e.message);
      }
      throw e;
    }

    const now = new Date().toISOString();

    let maxRisk = 'LOW';
    for (const impact of dto.impacts) {
      if ((RISK_ORDER[impact.risk_level] ?? 0) > (RISK_ORDER[maxRisk] ?? 0)) {
        maxRisk = impact.risk_level;
      }
    }

    return this.db.transaction(async (tx) => {
      await Promise.all(
        dto.impacts.map((impact) =>
          this.repo.createImpact(tx, {
            change_control_id: id,
            area: impact.area,
            impact_description: impact.impact_description,
            risk_level: impact.risk_level,
            assessed_by: assessorId as UserId,
          }),
        ),
      );

      const updated = await this.repo.update(tx, id, {
        status: 'IMPACT_ASSESSED',
        updated_by: assessorId as UserId,
      });

      const event: ChangeImpactAssessedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CHANGE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: assessorId as UserId,
        eventType: 'quality.change.impact_assessed',
        payload: {
          changeControlId: id,
          ccnNumber: cc.ccn_number,
          changeType: cc.change_type,
          impactCount: dto.impacts.length,
          maxRiskLevel: maxRisk as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          assessedBy: assessorId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CHANGE_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(
        `CC ${cc.ccn_number} impact assessed (count=${dto.impacts.length}, max risk=${maxRisk})`,
      );
      return updated;
    });
  }
}

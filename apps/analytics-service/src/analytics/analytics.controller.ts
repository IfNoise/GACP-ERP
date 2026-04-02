import { Controller } from '@nestjs/common';
import { TsRest, TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { analyticsContract } from '@gacp-erp/shared-contracts';
import { AnalyticsService } from './analytics.service';

@TsRest({ validateResponses: false })
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @TsRestHandler(analyticsContract.getKpis)
  getKpis() {
    return tsRestHandler(analyticsContract.getKpis, async () => {
      const result = await this.analyticsService.getKpis();
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(analyticsContract.getTrainingCompliance)
  getTrainingCompliance() {
    return tsRestHandler(analyticsContract.getTrainingCompliance, async () => {
      const result = await this.analyticsService.getTrainingCompliance();
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(analyticsContract.getWorkforceSummary)
  getWorkforceSummary() {
    return tsRestHandler(analyticsContract.getWorkforceSummary, async () => {
      const result = await this.analyticsService.getWorkforceSummary();
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(analyticsContract.getAuditReadiness)
  getAuditReadiness() {
    return tsRestHandler(analyticsContract.getAuditReadiness, async () => {
      const result = await this.analyticsService.getAuditReadiness();
      return { status: 200 as const, body: result };
    });
  }
}

jest.mock('@ts-rest/nest', () => ({
  TsRest: () => (target: unknown) => target,
  TsRestHandler: () => (_t: unknown, _k: unknown, d: unknown) => d,
  tsRestHandler: (_: unknown, handler: unknown) => handler,
}));
jest.mock('@gacp-erp/shared-contracts', () => ({
  analyticsContract: new Proxy({}, { get: () => ({}) }),
}));

import { AnalyticsController } from './analytics.controller';
import type { AnalyticsService } from './analytics.service';

function makeService(overrides: Partial<AnalyticsService> = {}): AnalyticsService {
  return {
    getKpis: jest.fn().mockResolvedValue([{ name: 'active_employees', value: 10 }]),
    getTrainingCompliance: jest.fn().mockResolvedValue({ overallRate: 90, items: [] }),
    getWorkforceSummary: jest.fn().mockResolvedValue({ totalEmployees: 50 }),
    getAuditReadiness: jest.fn().mockResolvedValue({ overallScore: 89 }),
    ...overrides,
  } as unknown as AnalyticsService;
}

describe('AnalyticsController', () => {
  it('getKpis delegates to service', async () => {
    const svc = makeService();
    const ctrl = new AnalyticsController(svc);
    const handler = ctrl.getKpis() as unknown as () => Promise<{ status: number; body: unknown }>;
    const res = await handler();
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ name: 'active_employees', value: 10 }]);
    expect(svc.getKpis).toHaveBeenCalled();
  });

  it('getTrainingCompliance delegates to service', async () => {
    const svc = makeService();
    const ctrl = new AnalyticsController(svc);
    const handler = ctrl.getTrainingCompliance() as unknown as () => Promise<{
      status: number;
      body: unknown;
    }>;
    const res = await handler();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ overallRate: 90, items: [] });
  });

  it('getWorkforceSummary delegates to service', async () => {
    const svc = makeService();
    const ctrl = new AnalyticsController(svc);
    const handler = ctrl.getWorkforceSummary() as unknown as () => Promise<{
      status: number;
      body: unknown;
    }>;
    const res = await handler();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalEmployees: 50 });
  });

  it('getAuditReadiness delegates to service', async () => {
    const svc = makeService();
    const ctrl = new AnalyticsController(svc);
    const handler = ctrl.getAuditReadiness() as unknown as () => Promise<{
      status: number;
      body: unknown;
    }>;
    const res = await handler();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ overallScore: 89 });
  });
});

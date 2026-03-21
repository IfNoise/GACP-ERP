import { createTestApp, type TestContext } from './helpers/create-test-app';

describe('Health (E2E)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /api/v1/health — returns ok without auth', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as Record<string, unknown>;
    expect(body).toMatchObject({
      status: 'ok',
      service: 'api-gateway',
    });
    expect(body).toHaveProperty('timestamp');
  });
});

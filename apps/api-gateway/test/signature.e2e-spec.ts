import { createTestApp, type TestContext } from './helpers/create-test-app';
import { SignatureService } from '../src/signature/signature.service';
import { authHeaders } from './helpers/mock-jwt';

describe('Signatures (E2E)', () => {
  let ctx: TestContext;
  let mockSignatureService: {
    sign: jest.Mock;
    verify: jest.Mock;
  };

  beforeAll(async () => {
    mockSignatureService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    ctx = await createTestApp((builder) =>
      builder.overrideProvider(SignatureService).useValue(mockSignatureService),
    );
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────── Auth requirement ─────────────────────

  describe('Auth guard', () => {
    it('POST /api/v1/signatures/sign — 401 without auth', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/signatures/sign',
        payload: {},
      });
      expect(res.statusCode).toBe(401);
    });

    it('POST /api/v1/signatures/verify — 401 without auth', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/signatures/verify',
        payload: {},
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ──────────────────── POST /signatures/sign ────────────────

  describe('POST /api/v1/signatures/sign', () => {
    const validPayload = {
      content: '{"record":"test-data"}',
      content_hash: 'a'.repeat(64),
      signer_role: 'QUALITY_MANAGER',
      signature_type: 'approval',
      authentication_method: 'password',
      signature_meaning: 'I approve this batch record',
      workstation_id: 'WS-001',
      reauth_token: 'reauth-valid-token-12345',
    };

    it('creates a signature with valid payload', async () => {
      mockSignatureService.sign.mockResolvedValue({
        signature: {
          signed_by: '550e8400-e29b-41d4-a716-446655440000',
          signer_name: 'Test Operator',
          signer_role: 'QUALITY_MANAGER',
          signature_type: 'approval',
          authentication_method: 'password',
          digital_signature: 'abcdef1234',
          content_hash: 'a'.repeat(64),
          ip_address: '127.0.0.1',
          workstation_id: 'WS-001',
          signature_meaning: 'I approve this batch record',
          signed_at: '2025-01-01T00:00:00.000Z',
        },
        valid: true,
      });

      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/signatures/sign',
        headers: authHeaders(),
        payload: validPayload,
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload) as Record<string, unknown>;
      expect(body).toHaveProperty('signed_by');
      expect(body).toHaveProperty('digital_signature');
    });

    it('returns 400 when content is missing', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/signatures/sign',
        headers: authHeaders(),
        payload: { ...validPayload, content: undefined },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when content_hash is invalid', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/signatures/sign',
        headers: authHeaders(),
        payload: { ...validPayload, content_hash: 'short' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 401 when reauth_token is too short', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/signatures/sign',
        headers: authHeaders(),
        payload: { ...validPayload, reauth_token: 'x' },
      });

      // The controller validates reauth_token length < 10 → 401
      expect(res.statusCode).toBe(401);
    });
  });

  // ──────────────────── POST /signatures/verify ──────────────

  describe('POST /api/v1/signatures/verify', () => {
    it('verifies a valid signature', async () => {
      mockSignatureService.verify.mockReturnValue(true);

      const digitalSig = 'a'.repeat(256);

      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/signatures/verify',
        headers: authHeaders(),
        payload: {
          content: '{"record":"test-data"}',
          signature: {
            signed_by: '550e8400-e29b-41d4-a716-446655440000',
            signer_name: 'Test Operator',
            signer_role: 'QUALITY_MANAGER',
            signature_type: 'approval',
            authentication_method: 'password',
            digital_signature: digitalSig,
            content_hash: 'a'.repeat(64),
            ip_address: '127.0.0.1',
            workstation_id: 'WS-001',
            signature_meaning: 'I approve this batch record',
            signed_at: '2025-01-01T00:00:00.000Z',
          },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload) as { valid: boolean };
      expect(body.valid).toBe(true);
    });

    it('returns 400 when signature object is missing', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/signatures/verify',
        headers: authHeaders(),
        payload: { content: 'some data' },
      });

      expect(res.statusCode).toBe(400);
    });
  });
});

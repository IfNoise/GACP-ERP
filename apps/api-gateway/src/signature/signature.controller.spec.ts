import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SignatureController } from './signature.controller';
import { type SignatureService } from './signature.service';

// ─── Mock SignatureService ────────────────────────────────────────────────────

function makeSignatureService(): jest.Mocked<SignatureService> {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
  } as unknown as jest.Mocked<SignatureService>;
}

const USER = {
  sub: 'user-1',
  preferred_username: 'jane.doe',
  given_name: 'Jane',
  family_name: 'Doe',
  realm_access: { roles: ['QUALITY_MANAGER'] },
  iat: 1000,
  exp: 2000,
};

function makeReq(ip = '10.0.0.1') {
  return {
    headers: { 'x-forwarded-for': ip },
    socket: { remoteAddress: '127.0.0.1' },
  };
}

function validSignBody() {
  return {
    content: '{"batchId":"b1"}',
    content_hash: 'a'.repeat(64),
    signer_role: 'QUALITY_MANAGER',
    signature_type: 'approval',
    authentication_method: 'two_factor',
    signature_meaning: 'I approve this',
    workstation_id: 'WS-001',
    reauth_token: 'valid-reauth-token-here',
  };
}

describe('SignatureController', () => {
  let controller: SignatureController;
  let signatureService: jest.Mocked<SignatureService>;

  beforeEach(() => {
    signatureService = makeSignatureService();
    controller = new SignatureController(signatureService as never);
  });

  // ─── sign ───────────────────────────────────────────────────────────────

  describe('sign', () => {
    it('creates signature on valid input', async () => {
      const sig = { id: 'sig-1', signed_by: 'Jane Doe' };
      signatureService.sign.mockResolvedValue({ signature: sig } as never);

      const result = await controller.sign(validSignBody(), USER as never, makeReq() as never);
      expect(result).toEqual(sig);
      expect(signatureService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '{"batchId":"b1"}',
          signingUserId: 'user-1',
          ipAddress: '10.0.0.1',
        }),
      );
    });

    it('throws BadRequestException on invalid body', async () => {
      await expect(controller.sign({}, USER as never, makeReq() as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws UnauthorizedException when reauth_token is too short', async () => {
      const body = { ...validSignBody(), reauth_token: 'short' };
      await expect(controller.sign(body, USER as never, makeReq() as never)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('uses socket remoteAddress when no x-forwarded-for', async () => {
      signatureService.sign.mockResolvedValue({ signature: {} } as never);
      const req = { headers: {}, socket: { remoteAddress: '192.168.1.1' } };

      await controller.sign(validSignBody(), USER as never, req as never);

      expect(signatureService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ ipAddress: '192.168.1.1' }),
      );
    });

    it('falls back to 0.0.0.0 when no IP available', async () => {
      signatureService.sign.mockResolvedValue({ signature: {} } as never);
      const req = { headers: {}, socket: {} };

      await controller.sign(validSignBody(), USER as never, req as never);

      expect(signatureService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ ipAddress: '0.0.0.0' }),
      );
    });

    it('constructs signerName from given_name + family_name', async () => {
      signatureService.sign.mockResolvedValue({ signature: {} } as never);

      await controller.sign(validSignBody(), USER as never, makeReq() as never);

      expect(signatureService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ signerName: 'Jane Doe' }),
      );
    });

    it('uses preferred_username as signerName when names are missing', async () => {
      signatureService.sign.mockResolvedValue({ signature: {} } as never);
      const user = { ...USER, given_name: undefined, family_name: undefined };

      await controller.sign(validSignBody(), user as never, makeReq() as never);

      expect(signatureService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ signerName: 'jane.doe' }),
      );
    });
  });

  // ─── verify ─────────────────────────────────────────────────────────────

  describe('verify', () => {
    it('returns verification result on valid body', () => {
      signatureService.verify.mockReturnValue(true);

      const body = {
        content: '{"batchId":"b1"}',
        signature: {
          signed_by: '00000000-0000-0000-0000-000000000001',
          signer_name: 'Jane Doe',
          signer_role: 'QUALITY_MANAGER',
          signature_type: 'approval',
          authentication_method: 'two_factor',
          digital_signature: 'a'.repeat(512),
          content_hash: 'a'.repeat(64),
          ip_address: '10.0.0.1',
          workstation_id: 'WS-001',
          signature_meaning: 'I approve',
          signed_at: '2026-01-15T12:00:00Z',
        },
      };

      const result = controller.verify(body);
      expect(result.valid).toBe(true);
      expect(result.signed_by).toBe('00000000-0000-0000-0000-000000000001');
    });

    it('throws BadRequestException on invalid body', () => {
      expect(() => controller.verify({})).toThrow(BadRequestException);
    });
  });
});

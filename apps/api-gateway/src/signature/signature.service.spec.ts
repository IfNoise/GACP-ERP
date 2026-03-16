import { type ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'crypto';
import { SignatureService, type SignatureRequest } from './signature.service';
import { type KafkaProducerService } from '../kafka/kafka-producer.service';

// ─── TEST RSA KEY PAIR ────────────────────────────────────────────────────────

const { privateKey: TEST_PRIVATE_KEY, publicKey: TEST_PUBLIC_KEY } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// ─── FIXTURES ─────────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<SignatureRequest> = {}): SignatureRequest {
  return {
    content: JSON.stringify({ batchId: 'batch-001', status: 'COMPLETED' }),
    contentHash: 'a'.repeat(64),
    signingUserId: '00000000-0000-0000-0000-000000000001',
    signingUsername: 'jane.doe',
    signerName: 'Jane Doe',
    signerRole: 'QUALITY_MANAGER',
    signatureMeaning: 'I approve this batch release',
    signatureType: 'approval',
    authenticationMethod: 'two_factor',
    ipAddress: '10.0.0.1',
    workstationId: 'WS-001',
    reauthToken: 'test-reauth-token',
    ...overrides,
  };
}

// ─── MODULE SETUP ─────────────────────────────────────────────────────────────

describe('SignatureService', () => {
  let service: SignatureService;
  let kafkaMock: { publish: jest.Mock };
  let kafkaPublishSpy: jest.SpyInstance;

  function makeConfigMock(privKey: string, pubKey: string): ConfigService {
    return {
      getOrThrow: (key: string) => {
        if (key === 'RSA_SIGNING_PRIVATE_KEY') return privKey;
        if (key === 'RSA_SIGNING_PUBLIC_KEY') return pubKey;
        throw new Error(`Unexpected config key: ${key}`);
      },
    } as unknown as ConfigService;
  }

  beforeEach(() => {
    kafkaMock = { publish: jest.fn() };
    kafkaPublishSpy = jest.spyOn(kafkaMock, 'publish');
    service = new SignatureService(
      makeConfigMock(TEST_PRIVATE_KEY, TEST_PUBLIC_KEY),
      kafkaMock as unknown as KafkaProducerService,
    );
  });

  // ─── sign — happy path ────────────────────────────────────────────────────

  describe('sign()', () => {
    it('returns a SignatureResult with valid: true', async () => {
      const result = await service.sign(makeRequest());
      expect(result.valid).toBe(true);
    });

    it('returns an ElectronicSignature with all required fields', async () => {
      const req = makeRequest();
      const { signature } = await service.sign(req);

      expect(signature.signed_by).toBe(req.signingUserId);
      expect(signature.signer_name).toBe(req.signerName);
      expect(signature.signer_role).toBe(req.signerRole);
      expect(signature.signature_type).toBe(req.signatureType);
      expect(signature.authentication_method).toBe(req.authenticationMethod);
      expect(signature.content_hash).toBe(req.contentHash);
      expect(signature.ip_address).toBe(req.ipAddress);
      expect(signature.workstation_id).toBe(req.workstationId);
      expect(signature.signature_meaning).toBe(req.signatureMeaning);
    });

    it('produces a non-empty digital_signature hex string', async () => {
      const { signature } = await service.sign(makeRequest());
      expect(signature.digital_signature).toMatch(/^[0-9a-f]+$/);
      expect(signature.digital_signature.length).toBeGreaterThan(0);
    });

    it('sets signed_at to a valid ISO-8601 datetime', async () => {
      const { signature } = await service.sign(makeRequest());
      expect(new Date(signature.signed_at).toISOString()).toBe(signature.signed_at);
    });

    it('publishes a SignatureRecordedEvent to the audit Kafka topic', async () => {
      await service.sign(makeRequest());
      expect(kafkaPublishSpy).toHaveBeenCalledTimes(1);
      const [topic, _key, event] = kafkaPublishSpy.mock.calls[0] as [
        string,
        string,
        Record<string, unknown>,
      ];
      expect(topic).toBe('audit.trail.v1');
      expect(event).toMatchObject({
        eventType: 'SIGNATURE_RECORDED',
        producerService: 'api-gateway',
      });
    });

    it('includes signerName and signerRole in the published event payload', async () => {
      const req = makeRequest();
      await service.sign(req);
      const [, , event] = kafkaPublishSpy.mock.calls[0] as [
        string,
        string,
        { payload: Record<string, unknown> },
      ];
      expect(event.payload).toMatchObject({
        signerName: req.signerName,
        signerRole: req.signerRole,
      });
    });
  });

  // ─── sign — missing private key ───────────────────────────────────────────

  describe('sign() — missing RSA key', () => {
    it('throws when RSA_SIGNING_PRIVATE_KEY is not configured', async () => {
      const svc = new SignatureService(
        {
          getOrThrow: (key: string) => {
            throw new Error(`Config key not found: ${key}`);
          },
        } as unknown as ConfigService,
        { publish: jest.fn() } as unknown as KafkaProducerService,
      );
      await expect(svc.sign(makeRequest())).rejects.toThrow();
    });
  });

  // ─── verify ──────────────────────────────────────────────────────────────

  describe('verify()', () => {
    it('returns true for a freshly created signature with matching content', async () => {
      const content = JSON.stringify({ action: 'BATCH_APPROVED', batchId: '123' });
      const req = makeRequest({ content });
      const { signature } = await service.sign(req);

      const ok = service.verify(signature, content);
      expect(ok).toBe(true);
    });

    it('returns false when content is tampered after signing', async () => {
      const content = JSON.stringify({ action: 'BATCH_APPROVED', batchId: '123' });
      const req = makeRequest({ content });
      const { signature } = await service.sign(req);

      const tampered = content + ' tampered';
      const ok = service.verify(signature, tampered);
      expect(ok).toBe(false);
    });

    it('returns false when the digital_signature hex is tampered', async () => {
      const content = JSON.stringify({ action: 'BATCH_APPROVED' });
      const req = makeRequest({ content });
      const { signature } = await service.sign(req);

      const tamperedSignature = { ...signature, digital_signature: 'deadbeef'.repeat(64) };
      const ok = service.verify(tamperedSignature, content);
      expect(ok).toBe(false);
    });

    it('returns false when an invalid (wrong key) signature is used', async () => {
      // Sign with this service (key-pair A)
      const content = JSON.stringify({ action: 'PLANT_DESTROYED' });
      const req = makeRequest({ content });
      const { signature } = await service.sign(req);

      // Verify against a DIFFERENT key pair configured on another service instance
      const { privateKey: otherPrivate, publicKey: otherPublic } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      void otherPrivate;

      const otherService = new SignatureService(makeConfigMock(otherPrivate, otherPublic), {
        publish: jest.fn(),
      } as unknown as KafkaProducerService);
      // signature was created with TEST_PRIVATE_KEY, but otherService has otherPublic
      const ok = otherService.verify(signature, content);
      expect(ok).toBe(false);
    });
  });
});

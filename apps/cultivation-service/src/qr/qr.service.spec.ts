import { type ConfigService } from '@nestjs/config';
import { QrService } from './qr.service';

// ─── TEST CONSTANTS ────────────────────────────────────────────────────────────

const HMAC_SECRET = 'test-secret-32-chars-long-xxxxxx';
const WEB_PORTAL_URL = 'https://erp.example.com';
const PLANT_ID = '00000000-0000-0000-0000-000000000001';
const PLANT_TAG = 'PLT-001';
const BATCH_ID = '00000000-0000-0000-0000-000000000002';
const BATCH_NUMBER = 'BATCH-2025-001';
const FACILITY_ID = 'FAC-001';

// ─── MODULE SETUP ─────────────────────────────────────────────────────────────

function makeConfig(values: Record<string, string>): ConfigService {
  return {
    getOrThrow: (key: string) => {
      if (key in values) return values[key];
      throw new Error(`Config key not found: ${key}`);
    },
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  } as unknown as ConfigService;
}

describe('QrService', () => {
  let service: QrService;

  beforeEach(() => {
    service = new QrService(
      makeConfig({
        QR_HMAC_SECRET: HMAC_SECRET,
        WEB_PORTAL_URL: WEB_PORTAL_URL,
      }),
    );
  });

  // ─── generatePlantQr ──────────────────────────────────────────────────────

  describe('generatePlantQr', () => {
    it('returns a QrResult with dataUrl, url, hmac, and issuedAt', async () => {
      const result = await service.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID);

      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.url).toBeDefined();
      expect(result.hmac).toMatch(/^[0-9a-f]{64}$/);
      expect(result.issuedAt).toBeDefined();
      expect(new Date(result.issuedAt).toISOString()).toBe(result.issuedAt);
    });

    it('embeds the plant id and type in the URL', async () => {
      const result = await service.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID);

      expect(result.url).toContain('/scan/plant/');
      expect(result.url).toContain(PLANT_ID);
    });

    it('uses the configured WEB_PORTAL_URL as base', async () => {
      const result = await service.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID);

      expect(result.url.startsWith(WEB_PORTAL_URL)).toBe(true);
    });

    it('includes the HMAC as "sig" query param in the URL', async () => {
      const result = await service.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID);

      expect(result.url).toContain(`sig=${result.hmac}`);
    });
  });

  // ─── generateBatchQr ──────────────────────────────────────────────────────

  describe('generateBatchQr', () => {
    it('returns a QrResult for a batch', async () => {
      const result = await service.generateBatchQr(BATCH_ID, BATCH_NUMBER, FACILITY_ID);

      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.url).toContain('/scan/batch/');
      expect(result.url).toContain(BATCH_ID);
    });

    it('includes batch type in the URL (not plant)', async () => {
      const result = await service.generateBatchQr(BATCH_ID, BATCH_NUMBER, FACILITY_ID);

      expect(result.url).not.toContain('/scan/plant/');
    });
  });

  // ─── verify ───────────────────────────────────────────────────────────────

  describe('verify', () => {
    it('returns true for a freshly generated plant QR code', async () => {
      const result = await service.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID);

      const ok = service.verify({
        type: 'plant',
        id: PLANT_ID,
        tag: PLANT_TAG,
        issuedAt: result.issuedAt,
        sig: result.hmac,
      });
      expect(ok).toBe(true);
    });

    it('returns true for a freshly generated batch QR code', async () => {
      const result = await service.generateBatchQr(BATCH_ID, BATCH_NUMBER, FACILITY_ID);

      const ok = service.verify({
        type: 'batch',
        id: BATCH_ID,
        tag: BATCH_NUMBER,
        issuedAt: result.issuedAt,
        sig: result.hmac,
      });
      expect(ok).toBe(true);
    });

    it('returns false when the signature is tampered', async () => {
      const result = await service.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID);

      const tampered = result.hmac.replace(/[0-9a-f]/, (c) => (c === 'f' ? '0' : 'f'));
      const ok = service.verify({
        type: 'plant',
        id: PLANT_ID,
        tag: PLANT_TAG,
        issuedAt: result.issuedAt,
        sig: tampered,
      });
      expect(ok).toBe(false);
    });

    it('returns false when the tag is changed after QR generation', async () => {
      const result = await service.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID);

      const ok = service.verify({
        type: 'plant',
        id: PLANT_ID,
        tag: 'PLT-TAMPERED',
        issuedAt: result.issuedAt,
        sig: result.hmac,
      });
      expect(ok).toBe(false);
    });

    it('returns false when the timestamp is changed after QR generation', async () => {
      const result = await service.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID);

      const ok = service.verify({
        type: 'plant',
        id: PLANT_ID,
        tag: PLANT_TAG,
        issuedAt: new Date(Date.now() + 1000).toISOString(),
        sig: result.hmac,
      });
      expect(ok).toBe(false);
    });

    it('returns false when the entity id is changed', async () => {
      const result = await service.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID);

      const ok = service.verify({
        type: 'plant',
        id: '00000000-0000-0000-0000-000000000099',
        tag: PLANT_TAG,
        issuedAt: result.issuedAt,
        sig: result.hmac,
      });
      expect(ok).toBe(false);
    });
  });

  // ─── config errors ────────────────────────────────────────────────────────

  describe('missing config', () => {
    it('throws when QR_HMAC_SECRET is not configured', async () => {
      const svc = new QrService(makeConfig({ WEB_PORTAL_URL: WEB_PORTAL_URL }));
      await expect(svc.generatePlantQr(PLANT_ID, PLANT_TAG, FACILITY_ID)).rejects.toThrow();
    });
  });
});

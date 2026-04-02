import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import QRCode from 'qrcode';

export interface QrPayload {
  id: string;
  type: 'plant' | 'batch';
  tag: string;
  facilityId: string;
}

export interface QrResult {
  dataUrl: string;
  url: string;
  hmac: string;
  issuedAt: string;
}

/**
 * Generates tamper-evident QR codes for plant and batch tracking.
 *
 * Each QR code contains:
 * - A verification URL pointing back to the ERP
 * - An HMAC-SHA256 signature of the payload (using QR_HMAC_SECRET)
 * - Issued timestamp for audit
 *
 * Scanning workflow: Scanner → URL → API verifies HMAC → displays record.
 */
@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);

  constructor(private readonly config: ConfigService) {}

  async generatePlantQr(plantId: string, plantTag: string, facilityId: string): Promise<QrResult> {
    return this.generate({ id: plantId, type: 'plant', tag: plantTag, facilityId });
  }

  async generateBatchQr(
    batchId: string,
    batchNumber: string,
    facilityId: string,
  ): Promise<QrResult> {
    return this.generate({ id: batchId, type: 'batch', tag: batchNumber, facilityId });
  }

  private async generate(payload: QrPayload): Promise<QrResult> {
    const secret = this.config.getOrThrow<string>('QR_HMAC_SECRET');
    const baseUrl = this.config.get<string>('WEB_PORTAL_URL', 'http://localhost:3000');
    const issuedAt = new Date().toISOString();

    const signableString = `${payload.type}:${payload.id}:${payload.tag}:${issuedAt}`;
    const hmac = createHmac('sha256', secret).update(signableString).digest('hex');

    const url = `${baseUrl}/scan/${payload.type}/${payload.id}?tag=${encodeURIComponent(payload.tag)}&ts=${encodeURIComponent(issuedAt)}&sig=${hmac}`;

    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    this.logger.debug(`QR generated for ${payload.type} ${payload.id}`);

    return { dataUrl, url, hmac, issuedAt };
  }

  /**
   * Verifies a QR code HMAC to prevent tampering.
   */
  verify(params: {
    type: string;
    id: string;
    tag: string;
    issuedAt: string;
    sig: string;
  }): boolean {
    const secret = this.config.getOrThrow<string>('QR_HMAC_SECRET');
    const signableString = `${params.type}:${params.id}:${params.tag}:${params.issuedAt}`;
    const expected = createHmac('sha256', secret).update(signableString).digest('hex');
    return expected === params.sig;
  }
}

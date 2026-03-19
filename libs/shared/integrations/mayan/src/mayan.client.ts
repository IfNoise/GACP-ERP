import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import {
  type MayanDocument,
  type MayanDocumentMetadata,
  type MayanDocumentVersion,
  type MayanUploadResult,
  MayanDocumentSchema,
  MayanDocumentVersionSchema,
  MayanVersionListResponseSchema,
} from '@gacp-erp/shared-schemas';

/**
 * HTTP client for the Mayan-EDMS REST API.
 *
 * Provides document upload, retrieval, and metadata management.
 * All requests are authenticated via Token auth (API key).
 * All responses are validated via Zod at the external boundary.
 *
 * @see https://www.mayan-edms.com/docs/api/
 */
@Injectable()
export class MayanClient {
  private readonly logger = new Logger(MayanClient.name);
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('MAYAN_EDMS_URL').replace(/\/$/, '');
    this.apiToken = config.getOrThrow<string>('MAYAN_EDMS_API_TOKEN');
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Token ${this.apiToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private get uploadHeaders(): Record<string, string> {
    return {
      Authorization: `Token ${this.apiToken}`,
      Accept: 'application/json',
    };
  }

  async uploadDocument(
    fileBuffer: Buffer,
    filename: string,
    metadata: MayanDocumentMetadata,
  ): Promise<MayanUploadResult> {
    const formData = new FormData();
    formData.append('label', metadata.label);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.language) formData.append('language', metadata.language);
    if (metadata.document_type_id)
      formData.append('document_type_id', String(metadata.document_type_id));

    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, filename);

    const url = `${this.baseUrl}/api/v4/documents/`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.uploadHeaders,
      body: formData as unknown as BodyInit,
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Mayan upload failed [${response.status}]: ${body}`);
      throw new Error(`Mayan EDMS upload failed: ${response.statusText}`);
    }

    const raw = await response.json();
    const document = MayanDocumentSchema.parse(raw);
    const version = MayanDocumentVersionSchema.parse(
      document.latest_version ?? {
        id: 0,
        document: { id: document.id, uuid: document.uuid },
        timestamp: '',
        comment: '',
        mimetype: '',
        size: 0,
      },
    );
    return { document, version };
  }

  async getDocument(mayanDocumentId: number): Promise<MayanDocument> {
    const url = `${this.baseUrl}/api/v4/documents/${mayanDocumentId}/`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Mayan document ${mayanDocumentId} not found`);
      }
      throw new Error(`Mayan EDMS GET failed: ${response.statusText}`);
    }

    return MayanDocumentSchema.parse(await response.json());
  }

  getDocumentDownloadUrl(mayanDocumentId: number): string {
    return `${this.baseUrl}/api/v4/documents/${mayanDocumentId}/download/`;
  }

  async downloadDocument(mayanDocumentId: number): Promise<Buffer> {
    const url = `${this.baseUrl}/api/v4/documents/${mayanDocumentId}/download/`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.uploadHeaders,
    });

    if (!response.ok) {
      throw new Error(`Mayan EDMS download failed: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async updateDocumentLabel(
    mayanDocumentId: number,
    label: string,
    description?: string,
  ): Promise<MayanDocument> {
    const url = `${this.baseUrl}/api/v4/documents/${mayanDocumentId}/`;
    const body: Record<string, string> = { label };
    if (description !== undefined) body['description'] = description;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Mayan EDMS PATCH failed: ${response.statusText}`);
    }

    return MayanDocumentSchema.parse(await response.json());
  }

  async listDocumentVersions(mayanDocumentId: number): Promise<MayanDocumentVersion[]> {
    const url = `${this.baseUrl}/api/v4/documents/${mayanDocumentId}/versions/`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Mayan EDMS list versions failed: ${response.statusText}`);
    }

    const { results } = MayanVersionListResponseSchema.parse(await response.json());
    return results;
  }
}

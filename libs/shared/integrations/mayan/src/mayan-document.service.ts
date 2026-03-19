import { Injectable, Logger } from '@nestjs/common';
import {
  type MayanDocument,
  type MayanDocumentMetadata,
  type MayanUploadResult,
  type DocumentUploadOptions,
} from '@gacp-erp/shared-schemas';
import { type MayanClient } from './mayan.client';

/**
 * High-level service for Mayan-EDMS document management.
 *
 * Wraps MayanClient with business-domain semantics for GACP-ERP.
 * Handles GMP-relevant metadata and provides a clear interface
 * for uploading batch records, SOPs, reports, and audit documents.
 */
@Injectable()
export class MayanDocumentService {
  private readonly logger = new Logger(MayanDocumentService.name);

  constructor(private readonly mayanClient: MayanClient) {}

  async uploadDocumentVersion(
    fileBuffer: Buffer,
    options: DocumentUploadOptions,
  ): Promise<MayanUploadResult> {
    const metadata: MayanDocumentMetadata = {
      label: options.label,
      description: options.description,
      language: options.language ?? 'eng',
      document_type_id: options.documentTypeId,
    };

    this.logger.log(`Uploading document to Mayan-EDMS: ${options.label}`);
    const result = await this.mayanClient.uploadDocument(fileBuffer, options.filename, metadata);

    this.logger.log(`Document uploaded successfully: Mayan ID ${result.document.id}`);
    return result;
  }

  async retrieveDocument(mayanDocumentId: number): Promise<MayanDocument> {
    return this.mayanClient.getDocument(mayanDocumentId);
  }

  async downloadDocument(mayanDocumentId: number): Promise<Buffer> {
    return this.mayanClient.downloadDocument(mayanDocumentId);
  }

  getDocumentViewUrl(mayanDocumentId: number): string {
    return this.mayanClient.getDocumentDownloadUrl(mayanDocumentId);
  }

  async updateLabel(
    mayanDocumentId: number,
    label: string,
    description?: string,
  ): Promise<MayanDocument> {
    return this.mayanClient.updateDocumentLabel(mayanDocumentId, label, description);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { createSign, createVerify } from 'crypto';
import {
  type ElectronicSignature,
  type SignatureType,
  type AuthenticationMethod,
  type UserId,
  type SystemRole,
} from '@gacp-erp/shared-schemas';
import { AUDIT_TOPIC, type SignatureRecordedEvent } from '@gacp-erp/shared-events';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

export interface SignatureRequest {
  /** The content (typically JSON.stringify of the record being signed) */
  content: string;
  /** Pre-computed SHA-256 hex hash of content (for verification) */
  contentHash: string;
  signingUserId: string;
  signingUsername: string;
  signerName: string;
  signerRole: string;
  /** Functional purpose of this signature (must be one of SignatureType values) */
  signatureMeaning: string;
  signatureType: SignatureType;
  authenticationMethod: AuthenticationMethod;
  ipAddress: string;
  workstationId: string;
  /** short-lived reauth_token proving re-authentication occurred */
  reauthToken: string;
}

export interface SignatureResult {
  signature: ElectronicSignature;
  valid: boolean;
}

/**
 * Handles RSA-SHA256 electronic signature creation and verification.
 * Complies with 21 CFR Part 11 §11.50 (Signature manifestations) and
 * §11.200 (Electronic signature components).
 */
@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  /**
   * Creates an RSA-SHA256 electronic signature for the supplied content.
   * The RSA private key is loaded from RSA_SIGNING_KEY_PATH env var.
   */
  async sign(req: SignatureRequest): Promise<SignatureResult> {
    const privateKey = this.config.getOrThrow<string>('RSA_SIGNING_PRIVATE_KEY');

    const signer = createSign('SHA256');
    signer.update(req.content);
    signer.end();

    const digitalSignature = signer.sign(privateKey, 'hex');

    const signature: ElectronicSignature = {
      signed_by: req.signingUserId as UserId,
      signer_name: req.signerName,
      signer_role: req.signerRole,
      signature_type: req.signatureType,
      authentication_method: req.authenticationMethod,
      digital_signature: digitalSignature,
      content_hash: req.contentHash,
      ip_address: req.ipAddress,
      workstation_id: req.workstationId,
      signature_meaning: req.signatureMeaning,
      signed_at: new Date().toISOString(),
    };

    this.logger.log(
      `Electronic signature created by ${req.signingUsername} for meaning: "${req.signatureMeaning}"`,
    );

    // Publish to audit.trail.v1 — consumed by Go audit-consumer → ImmuDB
    const signatureId = randomUUID();
    const signatureEvent: SignatureRecordedEvent = {
      eventId: randomUUID(),
      occurredAt: signature.signed_at,
      eventVersion: '1.0',
      producerService: 'api-gateway',
      topic: AUDIT_TOPIC,
      correlationId: randomUUID(),
      triggeredBy: req.signingUserId as UserId,
      eventType: 'SIGNATURE_RECORDED',
      payload: {
        signatureId,
        signedBy: req.signingUserId as UserId,
        signerName: req.signerName,
        signerRole: req.signerRole as SystemRole,
        signatureType: req.signatureType,
        authenticationMethod: req.authenticationMethod,
        contentHash: req.contentHash,
        digitalSignature,
        ipAddress: req.ipAddress,
        workstationId: req.workstationId,
        signedAt: signature.signed_at,
        entityType: 'signature',
        entityId: signatureId,
        signatureMeaning: req.signatureMeaning,
      },
    };
    this.kafkaProducer.publish(AUDIT_TOPIC, signatureId, signatureEvent);

    return { signature, valid: true };
  }

  /**
   * Verifies an existing signature against the original content.
   */
  verify(signature: ElectronicSignature, content: string): boolean {
    const publicKey = this.config.getOrThrow<string>('RSA_SIGNING_PUBLIC_KEY');

    try {
      const verifier = createVerify('SHA256');
      verifier.update(content);
      verifier.end();
      return verifier.verify(publicKey, signature.digital_signature, 'hex');
    } catch (error) {
      this.logger.warn(`Signature verification failed: ${String(error)}`);
      return false;
    }
  }
}

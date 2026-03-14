import { Module } from '@nestjs/common';
import { SignatureService } from './signature.service';

/**
 * SignatureModule — 21 CFR Part 11 §11.50 / §11.200.
 * Provides RSA-SHA256 signing and verification for critical operations:
 * - Stage transitions (VEGETATIVE → FLOWERING etc.)
 * - Harvest records
 * - Batch status changes
 * - CAPA closures
 * - Document approvals
 */
@Module({
  providers: [SignatureService],
  exports: [SignatureService],
})
export class SignatureModule {}

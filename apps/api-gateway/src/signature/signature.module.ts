import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SignatureService } from './signature.service';
import { SignatureController } from './signature.controller';
import { KafkaProducerModule } from '../kafka/kafka-producer.module';

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
  imports: [ConfigModule, KafkaProducerModule],
  controllers: [SignatureController],
  providers: [SignatureService],
  exports: [SignatureService],
})
export class SignatureModule {}

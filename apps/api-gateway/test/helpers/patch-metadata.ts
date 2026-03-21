/**
 * E2E test setup — patches `design:paramtypes` metadata that is lost due to
 * `import { type X }` in the production source (ESLint consistent-type-imports).
 *
 * Must run BEFORE any NestJS TestingModule is compiled.
 */
import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { JwtStrategy } from '../../src/auth/jwt.strategy';
import { AuthService } from '../../src/auth/auth.service';
import { AuthController } from '../../src/auth/auth.controller';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { PermissionsGuard } from '../../src/auth/guards/permissions.guard';
import { AuditInterceptor } from '../../src/common/interceptors/audit.interceptor';
import { KafkaProducerService } from '../../src/kafka/kafka-producer.service';
import { IotController } from '../../src/iot/iot.controller';
import { ThresholdService } from '../../src/iot/threshold.service';
import { VmProxyService } from '../../src/iot/vm-proxy.service';
import { AlertEvaluationService } from '../../src/iot/alert-evaluation.service';
import { AlertHistoryQueryService } from '../../src/iot/alert-history-query.service';
import { SignatureController } from '../../src/signature/signature.controller';
import { SignatureService } from '../../src/signature/signature.service';
import { DATABASE_TOKEN } from '../../src/database/database.module';

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
function patchParams(target: Function, types: unknown[]): void {
  Reflect.defineMetadata('design:paramtypes', types, target);
}
/* eslint-enable @typescript-eslint/no-unsafe-function-type */

// Auth
patchParams(JwtStrategy, [ConfigService]);
patchParams(AuthService, [ConfigService]);
patchParams(AuthController, [AuthService]);
patchParams(RolesGuard, [Reflector]);
patchParams(PermissionsGuard, [Reflector]);

// Kafka / Audit
patchParams(AuditInterceptor, [KafkaProducerService]);

// IoT
patchParams(IotController, [ThresholdService, VmProxyService, AlertHistoryQueryService]);
patchParams(AlertEvaluationService, [
  DATABASE_TOKEN,
  ConfigService,
  ThresholdService,
  KafkaProducerService,
]);
patchParams(VmProxyService, [ConfigService]);

// Signature
patchParams(SignatureController, [SignatureService]);
patchParams(SignatureService, [ConfigService, KafkaProducerService]);

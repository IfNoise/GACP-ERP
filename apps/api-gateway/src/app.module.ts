import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { MetricsModule, createLoggerOptions } from '@gacp-erp/shared-config';
import { AuthModule } from './auth/auth.module';
import { SignatureModule } from './signature/signature.module';
import { HealthModule } from './health/health.module';
import { KafkaProducerModule } from './kafka/kafka-producer.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { DatabaseModule } from './database/database.module';
import { IotModule } from './iot/iot.module';
import { DocsModule } from './docs/docs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    LoggerModule.forRoot(createLoggerOptions('api-gateway')),

    // Global rate limiting — 300 req / 60 s per IP
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60_000),
          limit: config.get<number>('THROTTLE_LIMIT', 300),
        },
      ],
    }),

    DatabaseModule,
    KafkaProducerModule,
    AuthModule,
    SignatureModule,
    HealthModule,
    IotModule,
    DocsModule,
    MetricsModule,
  ],
  providers: [
    // Global rate-limiting guard (ThrottlerModule config above)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Register AuditInterceptor globally so it intercepts all controllers
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}

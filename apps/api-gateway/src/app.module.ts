import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MetricsModule } from '@gacp-erp/shared-config';
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
    // Global config — reads from process.env / .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),

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
    // Register AuditInterceptor globally so it intercepts all controllers
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { SignatureModule } from './signature/signature.module';
import { HealthModule } from './health/health.module';

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

    AuthModule,
    SignatureModule,
    HealthModule,
  ],
})
export class AppModule {}

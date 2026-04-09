import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZitadelAdminClient } from '@gacp-erp/shared-zitadel';

export const ZITADEL_CLIENT = 'ZITADEL_CLIENT' as const;

@Global()
@Module({
  providers: [
    {
      provide: ZITADEL_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ZitadelAdminClient => {
        return new ZitadelAdminClient({
          url: config.getOrThrow<string>('ZITADEL_URL'),
          clientId: config.getOrThrow<string>('ZITADEL_ADMIN_CLIENT_ID'),
          clientSecret: config.getOrThrow<string>('ZITADEL_ADMIN_CLIENT_SECRET'),
          projectId: config.getOrThrow<string>('ZITADEL_PROJECT_ID'),
        });
      },
    },
  ],
  exports: [ZITADEL_CLIENT],
})
export class ZitadelModule {}

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeycloakAdminClient } from '@gacp-erp/shared-keycloak';

export const KEYCLOAK_CLIENT = 'KEYCLOAK_CLIENT' as const;

@Global()
@Module({
  providers: [
    {
      provide: KEYCLOAK_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): KeycloakAdminClient => {
        return new KeycloakAdminClient({
          url: config.getOrThrow<string>('KEYCLOAK_URL'),
          realm: config.getOrThrow<string>('KEYCLOAK_REALM'),
          clientId: config.getOrThrow<string>('KEYCLOAK_CLIENT_ID'),
          clientSecret: config.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET'),
        });
      },
    },
  ],
  exports: [KEYCLOAK_CLIENT],
})
export class KeycloakModule {}

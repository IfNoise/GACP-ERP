import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@gacp-erp/shared-schemas';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'keycloak-jwt') {
  constructor(config: ConfigService) {
    const jwksUri = config.getOrThrow<string>('KEYCLOAK_JWKS_URI');
    const issuer = config.getOrThrow<string>('KEYCLOAK_ISSUER');

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: config.get<string>('KEYCLOAK_CLIENT_ID', 'api-gateway'),
      issuer,
      algorithms: ['RS256'],
    });
  }

  /**
   * Called after signature verification.
   * Returns the validated payload — attached to request.user by Passport.
   */
  validate(payload: Record<string, unknown>): JwtPayload {
    // Keycloak stores roles in realm_access.roles
    const realmAccess = payload['realm_access'] as { roles: string[] } | undefined;

    if (!realmAccess?.roles || realmAccess.roles.length === 0) {
      throw new UnauthorizedException('Token contains no realm roles');
    }

    return {
      sub: payload['sub'] as string,
      email: payload['email'] as string | undefined,
      preferred_username: payload['preferred_username'] as string,
      given_name: payload['given_name'] as string | undefined,
      family_name: payload['family_name'] as string | undefined,
      realm_access: realmAccess,
      iat: payload['iat'] as number,
      exp: payload['exp'] as number,
      jti: payload['jti'] as string | undefined,
      iss: payload['iss'] as string,
      aud: payload['aud'] as string | string[] | undefined,
    };
  }
}

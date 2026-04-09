import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@gacp-erp/shared-schemas';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'zitadel-jwt') {
  constructor(config: ConfigService) {
    const jwksUri = config.getOrThrow<string>('ZITADEL_JWKS_URI');
    const issuer = config.getOrThrow<string>('ZITADEL_ISSUER');

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: config.get<string>('ZITADEL_CLIENT_ID', 'api-gateway'),
      issuer,
      algorithms: ['RS256'],
    });
  }

  /**
   * Called after signature verification.
   * Returns the validated payload — attached to request.user by Passport.
   *
   * Zitadel stores roles in `urn:zitadel:iam:org:project:roles` as an object
   * where keys are role IDs and values are role names.
   */
  validate(payload: Record<string, unknown>): JwtPayload {
    // Zitadel stores roles in a custom claim with role IDs mapping
    const zitadelRolesClaim = payload['urn:zitadel:iam:org:project:roles'] as
      | Record<string, unknown>
      | undefined;

    if (!zitadelRolesClaim || Object.keys(zitadelRolesClaim).length === 0) {
      throw new UnauthorizedException('Token contains no project roles');
    }

    // Convert Zitadel roles object to flat array of role names
    const roles = Object.values(zitadelRolesClaim).flat() as string[];

    return {
      sub: payload['sub'] as string,
      email: payload['email'] as string | undefined,
      preferred_username: payload['preferred_username'] as string,
      given_name: payload['given_name'] as string | undefined,
      family_name: payload['family_name'] as string | undefined,
      realm_access: { roles },
      iat: payload['iat'] as number,
      exp: payload['exp'] as number,
      jti: payload['jti'] as string | undefined,
      iss: payload['iss'] as string,
      aud: payload['aud'] as string | string[] | undefined,
    };
  }
}

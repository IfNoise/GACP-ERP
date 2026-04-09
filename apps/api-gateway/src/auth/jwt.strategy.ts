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
    // When tokens include `urn:zitadel:iam:org:project:id:{id}:aud` scope, the
    // aud claim becomes the projectId. Validate against it when configured; otherwise
    // omit audience check and rely on issuer + RS256 signature verification.
    const projectId = config.get<string>('ZITADEL_PROJECT_ID');

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ...(projectId ? { audience: projectId } : {}),
      issuer,
      algorithms: ['RS256'],
    });
  }

  /**
   * Called after signature verification.
   * Returns the validated payload — attached to request.user by Passport.
   *
   * Zitadel `urn:zitadel:iam:org:project:roles` structure:
   *   { "ROLE_KEY": { "<orgId>": "<projectId>" }, ... }
   * The role NAMES are the top-level keys of this object.
   */
  validate(payload: Record<string, unknown>): JwtPayload {
    const zitadelRolesClaim = payload['urn:zitadel:iam:org:project:roles'] as
      | Record<string, unknown>
      | undefined;

    if (!zitadelRolesClaim || Object.keys(zitadelRolesClaim).length === 0) {
      throw new UnauthorizedException('Token contains no project roles');
    }

    // Role names are the top-level keys: { "SUPER_ADMIN": { orgId: projectId } }
    const roles = Object.keys(zitadelRolesClaim);

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

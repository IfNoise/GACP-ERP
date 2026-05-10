import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtPayload, SystemRole } from '@gacp-erp/shared-schemas';

const DEV_ROLE_PRESETS: Record<string, SystemRole[]> = {
  SUPER_ADMIN: ['SUPER_ADMIN'],
  QUALITY_MANAGER: ['QUALITY_MANAGER'],
  CULTIVATION_MANAGER: ['CULTIVATION_MANAGER'],
  OPERATOR: ['OPERATOR'],
  AUDITOR: ['AUDITOR'],
  READONLY: ['READONLY'],
};

const DEV_USER_IDS: Record<string, string> = {
  SUPER_ADMIN: '00000000-0000-0000-0000-000000000001',
  QUALITY_MANAGER: '00000000-0000-0000-0000-000000000002',
  CULTIVATION_MANAGER: '00000000-0000-0000-0000-000000000003',
  OPERATOR: '00000000-0000-0000-0000-000000000004',
  AUDITOR: '00000000-0000-0000-0000-000000000005',
  READONLY: '00000000-0000-0000-0000-000000000006',
};

function buildDevUser(headerValue: string): JwtPayload {
  const preset = headerValue.trim().toUpperCase();
  const roles: SystemRole[] = DEV_ROLE_PRESETS[preset] ?? ['SUPER_ADMIN'];
  const roleName = roles[0] ?? 'SUPER_ADMIN';
  const sub = DEV_USER_IDS[preset] ?? '00000000-0000-0000-0000-000000000001';
  const now = Math.floor(Date.now() / 1000);

  return {
    sub,
    exp: now + 86400,
    iat: now,
    iss: 'http://localhost:8080',
    realm_access: { roles },
    preferred_username: `dev-${roleName.toLowerCase().replace('_', '-')}`,
    email: `${roleName.toLowerCase().replace('_', '-')}@dev.local`,
  };
}

/**
 * Validates Bearer JWT via Zitadel JWKS (production).
 *
 * When AUTH_MODE=dev: bypasses JWT validation entirely and constructs a
 * JwtPayload from the x-dev-user header (role preset name, e.g. "SUPER_ADMIN").
 * Fails fast at startup if AUTH_MODE=dev is set with NODE_ENV=production.
 */
@Injectable()
export class JwtAuthGuard extends (AuthGuard('zitadel-jwt') as new () => CanActivate) {
  private readonly isDev: boolean;

  constructor() {
    super();

    if (process.env['AUTH_MODE'] === 'dev' && process.env['NODE_ENV'] === 'production') {
      throw new InternalServerErrorException('AUTH_MODE=dev is forbidden in production');
    }

    this.isDev = process.env['AUTH_MODE'] === 'dev';
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    if (!this.isDev) {
      return super.canActivate(context) as Promise<boolean>;
    }

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const header = (request['headers'] as Record<string, string | undefined>)['x-dev-user'];
    (request as Record<string, unknown>)['user'] = buildDevUser(header ?? 'SUPER_ADMIN');
    return true;
  }
}

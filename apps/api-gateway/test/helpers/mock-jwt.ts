import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

export interface TestJwtPayload {
  sub: string;
  preferred_username: string;
  realm_access: { roles: string[] };
  iat: number;
  exp: number;
  iss: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  jti?: string;
  aud?: string | string[];
  gacp_user_id?: string;
}

const TEST_USER_HEADER = 'x-test-user';

export function createOperatorPayload(overrides?: Partial<TestJwtPayload>): TestJwtPayload {
  return {
    sub: '550e8400-e29b-41d4-a716-446655440000',
    preferred_username: 'test-operator',
    realm_access: { roles: ['OPERATOR'] },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'http://localhost:8080/realms/gacp',
    ...overrides,
  };
}

export function createAdminPayload(overrides?: Partial<TestJwtPayload>): TestJwtPayload {
  return createOperatorPayload({
    sub: '550e8400-e29b-41d4-a716-446655440001',
    preferred_username: 'test-admin',
    realm_access: { roles: ['SUPER_ADMIN'] },
    ...overrides,
  });
}

export function createQualityManagerPayload(overrides?: Partial<TestJwtPayload>): TestJwtPayload {
  return createOperatorPayload({
    sub: '550e8400-e29b-41d4-a716-446655440002',
    preferred_username: 'test-qm',
    realm_access: { roles: ['QUALITY_MANAGER'] },
    ...overrides,
  });
}

export function createReadonlyPayload(overrides?: Partial<TestJwtPayload>): TestJwtPayload {
  return createOperatorPayload({
    sub: '550e8400-e29b-41d4-a716-446655440003',
    preferred_username: 'test-readonly',
    realm_access: { roles: ['READONLY'] },
    ...overrides,
  });
}

@Injectable()
export class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: TestJwtPayload;
    }>();
    const userHeader = request.headers[TEST_USER_HEADER];
    if (userHeader) {
      request.user = JSON.parse(userHeader) as TestJwtPayload;
      return true;
    }
    throw new UnauthorizedException();
  }
}

/** Returns headers that authenticate the request with the given (or default operator) payload. */
export function authHeaders(payload?: TestJwtPayload): Record<string, string> {
  const user = payload ?? createOperatorPayload();
  return {
    [TEST_USER_HEADER]: JSON.stringify(user),
    authorization: 'Bearer mock-token',
  };
}

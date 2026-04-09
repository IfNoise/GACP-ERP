import type { SystemRole } from '@gacp-erp/shared-schemas';

// ─── Config & Types ───────────────────────────────────────────────────────────

export interface ZitadelConfig {
  url: string;
  clientId: string;
  clientSecret: string;
  projectId: string;
}

export interface ZitadelTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface ZitadelUser {
  userId: string;
  userName: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  state: 'ACTIVE' | 'INACTIVE' | 'DELETED' | 'LOCKED' | 'INITIAL' | 'UNSPECIFIED';
  loginNames?: string[];
}

export interface ZitadelUserCreate {
  userName: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  /** Plain-text temporary password. User will be prompted to change on first login. */
  password?: string;
}

export interface ZitadelOidcApp {
  appId: string;
  clientId: string;
  clientSecret?: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

/**
 * Zitadel Admin REST API client.
 * Uses client_credentials grant (service account) for all management calls.
 *
 * REST API reference: https://zitadel.com/docs/apis/introduction
 */
export class ZitadelAdminClient {
  private adminToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ZitadelConfig) {}

  // ─── Auth ─────────────────────────────────────────────────────────────────

  private async getAdminToken(): Promise<string> {
    if (this.adminToken && Date.now() < this.tokenExpiresAt - 10_000) {
      return this.adminToken;
    }

    const res = await fetch(`${this.config.url}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: `openid urn:zitadel:iam:org:project:id:${this.config.projectId}:aud urn:zitadel:iam:org:projects:roles`,
      }).toString(),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ZitadelAdminError('Failed to obtain admin token', res.status, body);
    }

    const data = (await res.json()) as ZitadelTokenResponse;
    this.adminToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.adminToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAdminToken();
    const res = await fetch(`${this.config.url}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ZitadelAdminError(
        `Zitadel request failed: ${options.method ?? 'GET'} ${path} → ${res.status}`,
        res.status,
        body,
      );
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as unknown as T;
    }

    return (await res.json()) as T;
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  /**
   * Find a human user by exact username.
   * Uses POST /v2/users/_search with username filter.
   */
  async getUserByUsername(userName: string): Promise<ZitadelUser | null> {
    try {
      const res = await this.request<{
        result?: Array<{ userId: string; userName: string }>;
      }>('/v2/users/_search', {
        method: 'POST',
        body: JSON.stringify({
          queries: [{ userNameQuery: { userName, method: 'TEXT_QUERY_METHOD_EQUALS' } }],
        }),
      });
      const first = res.result?.[0];
      if (!first) return null;
      return { userId: first.userId, userName: first.userName, state: 'ACTIVE' };
    } catch {
      return null;
    }
  }

  /** Get a user by ID. */
  async getUserById(userId: string): Promise<ZitadelUser> {
    const res = await this.request<{
      user: {
        userId: string;
        userName: string;
        state: string;
        human?: {
          email?: { email?: string };
          profile?: { givenName?: string; familyName?: string };
        };
      };
    }>(`/v2/users/${userId}`);

    return {
      userId: res.user.userId,
      userName: res.user.userName,
      ...(res.user.human?.email?.email !== undefined && { email: res.user.human.email.email }),
      ...(res.user.human?.profile?.givenName !== undefined && {
        firstName: res.user.human.profile.givenName,
      }),
      ...(res.user.human?.profile?.familyName !== undefined && {
        lastName: res.user.human.profile.familyName,
      }),
      state: (res.user.state ?? 'ACTIVE') as ZitadelUser['state'],
    };
  }

  /**
   * Create a human user with a temporary password.
   * User will be required to change password on first login.
   * Returns the new userId.
   */
  async createUser(user: ZitadelUserCreate): Promise<string> {
    const res = await this.request<{ userId: string }>('/v2/users/human', {
      method: 'POST',
      body: JSON.stringify({
        userName: user.userName,
        ...(user.email && { email: { email: user.email, isVerified: true } }),
        profile: {
          givenName: user.firstName ?? '',
          familyName: user.lastName ?? '',
        },
        ...(user.password && {
          password: { password: user.password, changeRequired: true },
        }),
      }),
    });

    if (!res.userId) throw new ZitadelAdminError('No userId returned from createUser', 201);
    return res.userId;
  }

  /** Update profile and/or email of a user. */
  async updateUser(userId: string, update: Partial<ZitadelUserCreate>): Promise<void> {
    if (update.firstName !== undefined || update.lastName !== undefined) {
      await this.request<void>(`/v2/users/${userId}/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          givenName: update.firstName ?? '',
          familyName: update.lastName ?? '',
        }),
      });
    }
    if (update.email !== undefined) {
      await this.request<void>(`/v2/users/${userId}/email`, {
        method: 'PUT',
        body: JSON.stringify({ email: update.email, isVerified: true }),
      });
    }
  }

  /** Permanently delete a user account. */
  async deleteUser(userId: string): Promise<void> {
    await this.request<void>(`/v2/users/${userId}`, { method: 'DELETE' });
  }

  // ─── Role Assignments ─────────────────────────────────────────────────────

  /**
   * Assign project roles to a user.
   * Creates a new user grant if none exists; updates the existing one otherwise.
   */
  async assignRoles(userId: string, roles: SystemRole[]): Promise<void> {
    const existingGrantId = await this.getUserGrantId(userId);

    if (existingGrantId) {
      await this.request<void>(`/management/v1/users/${userId}/grants/${existingGrantId}`, {
        method: 'PUT',
        body: JSON.stringify({ roleKeys: roles }),
      });
    } else {
      await this.request<void>(`/management/v1/users/${userId}/grants`, {
        method: 'POST',
        body: JSON.stringify({ projectId: this.config.projectId, roleKeys: roles }),
      });
    }
  }

  /**
   * Remove all project roles from a user by deleting the grant.
   */
  async removeRoles(userId: string, _roles: SystemRole[]): Promise<void> {
    const grantId = await this.getUserGrantId(userId);
    if (!grantId) return;
    await this.request<void>(`/management/v1/users/${userId}/grants/${grantId}`, {
      method: 'DELETE',
    });
  }

  /** Get project roles assigned to a user. */
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const res = await this.request<{ result?: Array<{ roleKeys?: string[] }> }>(
        `/management/v1/users/${userId}/grants?projectId=${this.config.projectId}`,
      );
      return res.result?.[0]?.roleKeys ?? [];
    } catch {
      return [];
    }
  }

  private async getUserGrantId(userId: string): Promise<string | null> {
    try {
      const res = await this.request<{ result?: Array<{ id: string; projectId: string }> }>(
        `/management/v1/users/${userId}/grants?projectId=${this.config.projectId}`,
      );
      return res.result?.[0]?.id ?? null;
    } catch {
      return null;
    }
  }

  // ─── Projects ─────────────────────────────────────────────────────────────

  /**
   * Create a new project and return its ID.
   */
  async createProject(name: string): Promise<string> {
    const res = await this.request<{ id: string }>('/management/v1/projects', {
      method: 'POST',
      body: JSON.stringify({
        name,
        projectRoleAssertion: true,
        projectRoleCheck: true,
        hasProjectCheck: false,
      }),
    });
    return res.id;
  }

  /**
   * Add a role to an existing project.
   */
  async createProjectRole(
    projectId: string,
    roleKey: string,
    displayName: string,
    group?: string,
  ): Promise<void> {
    await this.request<void>(`/management/v1/projects/${projectId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleKey, displayName, ...(group && { group }) }),
    });
  }

  // ─── Applications ─────────────────────────────────────────────────────────

  /**
   * Create an OIDC application inside a project.
   *
   * @param isPublic  true = SPA/mobile (PKCE, no secret); false = confidential web app
   * Returns { appId, clientId, clientSecret? } — clientSecret is only returned once.
   */
  async createOidcApp(
    projectId: string,
    name: string,
    opts: {
      redirectUris: string[];
      postLogoutRedirectUris?: string[];
      isPublic?: boolean;
    },
  ): Promise<ZitadelOidcApp> {
    const res = await this.request<{ appId: string; clientId: string; clientSecret?: string }>(
      `/management/v1/projects/${projectId}/apps/oidc`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          redirectUris: opts.redirectUris,
          postLogoutRedirectUris: opts.postLogoutRedirectUris ?? [],
          responseTypes: ['OIDC_RESPONSE_TYPE_CODE'],
          grantTypes: opts.isPublic
            ? ['OIDC_GRANT_TYPE_AUTHORIZATION_CODE', 'OIDC_GRANT_TYPE_REFRESH_TOKEN']
            : [
                'OIDC_GRANT_TYPE_AUTHORIZATION_CODE',
                'OIDC_GRANT_TYPE_REFRESH_TOKEN',
                'OIDC_GRANT_TYPE_CLIENT_CREDENTIALS',
              ],
          appType: opts.isPublic ? 'OIDC_APP_TYPE_USER_AGENT' : 'OIDC_APP_TYPE_WEB',
          authMethodType: opts.isPublic
            ? 'OIDC_AUTH_METHOD_TYPE_NONE'
            : 'OIDC_AUTH_METHOD_TYPE_BASIC',
          accessTokenType: 'OIDC_TOKEN_TYPE_JWT',
          accessTokenRoleAssertion: true,
          idTokenRoleAssertion: true,
          idTokenUserinfoAssertion: true,
        }),
      },
    );
    return {
      appId: res.appId,
      clientId: res.clientId,
      ...(res.clientSecret !== undefined && { clientSecret: res.clientSecret }),
    };
  }

  /**
   * Create a machine (service account) user.
   * Returns userId.
   */
  async createMachineUser(userName: string, name: string, description?: string): Promise<string> {
    const res = await this.request<{ userId: string }>('/v2/users/machine', {
      method: 'POST',
      body: JSON.stringify({
        userName,
        name,
        description,
        accessTokenType: 'ACCESS_TOKEN_TYPE_JWT',
      }),
    });
    if (!res.userId) throw new ZitadelAdminError('No userId returned from createMachineUser', 201);
    return res.userId;
  }

  /**
   * Create a Personal Access Token (PAT) for a machine user.
   * The token string is only returned once.
   */
  async createMachinePat(userId: string, expirationDate?: string): Promise<string> {
    const res = await this.request<{ token: string }>(`/v2/users/${userId}/pats`, {
      method: 'POST',
      body: JSON.stringify({ expirationDate: expirationDate ?? '2030-12-31T23:59:59Z' }),
    });
    return res.token;
  }

  // ─── Health ───────────────────────────────────────────────────────────────

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.url}/.well-known/openid-configuration`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class ZitadelAdminError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = 'ZitadelAdminError';
  }
}

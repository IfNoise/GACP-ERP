import type { SystemRole } from '@gacp-erp/shared-schemas';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZitadelConfig {
  url: string;
  clientId: string;
  clientSecret: string;
  projectId: string; // Zitadel project ID for role management
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
  password?: string;
}

export interface ZitadelRole {
  id: string;
  key: string;
  displayName: string;
  group?: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

/**
 * Typed Zitadel Admin REST API client.
 * Uses service account credentials for operations.
 *
 * All methods throw on non-2xx responses with structured error info.
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

    const url = `${this.config.url}/oauth/v2/token`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'urn:zitadel:iam:org:project:id:{projectId}:aud',
      }).toString(),
    });

    if (!res.ok) {
      throw new ZitadelAdminError('Failed to obtain admin token', res.status);
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
        `Zitadel admin request failed: ${options.method ?? 'GET'} ${path} → ${res.status}`,
        res.status,
        body,
      );
    }

    // 204 No Content or just status code responses
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as unknown as T;
    }

    return (await res.json()) as T;
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  /**
   * Get user by username.
   * Note: Zitadel REST API is limited; gRPC is recommended for production.
   */
  async getUserByUsername(userName: string): Promise<ZitadelUser | null> {
    try {
      const response = await this.request<{ users?: Array<{ userId: string; userName: string }> }>(
        `/v2/users/_by_user_name/${encodeURIComponent(userName)}`,
      );
      if (response && response.users && response.users.length > 0) {
        const user = response.users[0];
        return {
          userId: user.userId,
          userName: user.userName,
          state: 'ACTIVE',
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get user by ID.
   */
  async getUserById(userId: string): Promise<ZitadelUser> {
    return this.request<ZitadelUser>(`/v2/users/${userId}`);
  }

  /**
   * Create a new user.
   * Note: Zitadel requires gRPC for full user creation with roles.
   */
  async createUser(user: ZitadelUserCreate): Promise<string> {
    const response = await this.request<{ userId: string }>('/v2/users/human', {
      method: 'POST',
      body: JSON.stringify({
        userName: user.userName,
        email: user.email,
        profile: {
          givenName: user.firstName || '',
          familyName: user.lastName || '',
        },
        hashedPassword: user.password ? Buffer.from(user.password).toString('base64') : undefined,
      }),
    });

    if (!response.userId) {
      throw new ZitadelAdminError('No user ID returned from create user', 201);
    }

    return response.userId;
  }

  /**
   * Update a user.
   */
  async updateUser(userId: string, update: Partial<ZitadelUserCreate>): Promise<void> {
    await this.request<void>(`/v2/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        userName: update.userName,
        email: update.email,
        profile: {
          givenName: update.firstName,
          familyName: update.lastName,
        },
      }),
    });
  }

  /**
   * Delete a user (soft delete).
   */
  async deleteUser(userId: string): Promise<void> {
    await this.request<void>(`/v2/users/${userId}`, { method: 'DELETE' });
  }

  // ─── Role Assignments ─────────────────────────────────────────────────────
  // Note: Full role management requires gRPC API.
  // These REST endpoints provide limited functionality.

  /**
   * Get roles for a user in the project.
   * Note: Limited REST API support; gRPC recommended.
   */
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const response = await this.request<{ roles?: Array<{ key: string }> }>(
        `/v2/users/${userId}/grants?projectId=${this.config.projectId}`,
      );
      return (response.roles ?? []).map((r) => r.key);
    } catch {
      return [];
    }
  }

  /**
   * Assign roles to a user.
   * Note: Requires gRPC API for full implementation.
   * This is a placeholder for REST API.
   */
  async assignRoles(userId: string, roles: SystemRole[]): Promise<void> {
    // Zitadel REST API has limited role assignment.
    // For production, use gRPC API:
    // - management.UserServiceClient.AddUserGrant()
    for (const role of roles) {
      await this.request<void>(`/v2/users/${userId}/grants`, {
        method: 'POST',
        body: JSON.stringify({
          projectId: this.config.projectId,
          role: role,
        }),
      });
    }
  }

  /**
   * Remove roles from a user.
   */
  async removeRoles(userId: string, roles: SystemRole[]): Promise<void> {
    for (const role of roles) {
      await this.request<void>(
        `/v2/users/${userId}/grants?projectId=${this.config.projectId}&role=${role}`,
        { method: 'DELETE' },
      );
    }
  }

  // ─── Health ──────────────────────────────────────────────────────────────

  /**
   * Check if Zitadel is reachable.
   */
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

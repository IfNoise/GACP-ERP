import { type SystemRole } from '@gacp-erp/shared-schemas';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  clientSecret: string;
}

export interface KeycloakTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  emailVerified: boolean;
  realmRoles?: string[];
  requiredActions?: string[];
}

export interface KeycloakUserCreate {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  credentials?: Array<{ type: 'password'; value: string; temporary?: boolean }>;
  realmRoles?: SystemRole[];
  requiredActions?: string[];
}

// ─── Client ───────────────────────────────────────────────────────────────────

/**
 * Typed Keycloak Admin REST API client.
 * Uses the admin-cli service account for operations.
 *
 * All methods throw on non-2xx responses with structured error info.
 */
export class KeycloakAdminClient {
  private adminToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: KeycloakConfig) {}

  // ─── Auth ─────────────────────────────────────────────────────────────────

  private get adminBaseUrl(): string {
    return `${this.config.url}/admin/realms/${this.config.realm}`;
  }

  private async getAdminToken(): Promise<string> {
    if (this.adminToken && Date.now() < this.tokenExpiresAt - 10_000) {
      return this.adminToken;
    }

    const url = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!res.ok) {
      throw new KeycloakAdminError('Failed to obtain admin token', res.status);
    }

    const data = (await res.json()) as KeycloakTokenResponse;
    this.adminToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.adminToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAdminToken();
    const res = await fetch(`${this.adminBaseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new KeycloakAdminError(
        `Keycloak admin request failed: ${options.method ?? 'GET'} ${path} → ${res.status}`,
        res.status,
        body,
      );
    }

    // 204 No Content
    if (res.status === 204) return undefined as unknown as T;

    return (await res.json()) as T;
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  async getUsers(params?: { search?: string; max?: number }): Promise<KeycloakUser[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.max !== undefined) qs.set('max', String(params.max));
    const query = qs.toString() ? `?${qs}` : '';
    return this.request<KeycloakUser[]>(`/users${query}`);
  }

  async getUserById(userId: string): Promise<KeycloakUser> {
    return this.request<KeycloakUser>(`/users/${userId}`);
  }

  async getUserByUsername(username: string): Promise<KeycloakUser | null> {
    const users = await this.getUsers({ search: username, max: 1 });
    return users.find((u) => u.username === username) ?? null;
  }

  async createUser(user: KeycloakUserCreate): Promise<string> {
    const { realmRoles, ...keycloakUser } = user;

    // POST /users returns 201 with Location header containing the new user ID
    const token = await this.getAdminToken();
    const res = await fetch(`${this.adminBaseUrl}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(keycloakUser),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new KeycloakAdminError(`Failed to create user`, res.status, body);
    }

    const location = res.headers.get('Location') ?? '';
    const userId = location.split('/').pop();
    if (!userId) throw new KeycloakAdminError('No user ID in Location header', 201);

    if (realmRoles?.length) {
      await this.assignRealmRoles(userId, realmRoles);
    }

    return userId;
  }

  async updateUser(userId: string, update: Partial<KeycloakUserCreate>): Promise<void> {
    const { realmRoles, ...keycloakUpdate } = update;
    await this.request<void>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(keycloakUpdate),
    });
    if (realmRoles?.length) {
      await this.assignRealmRoles(userId, realmRoles);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request<void>(`/users/${userId}`, { method: 'DELETE' });
  }

  // ─── Role Assignments ─────────────────────────────────────────────────────

  async getUserRealmRoles(userId: string): Promise<string[]> {
    const mappings = await this.request<{ realmMappings?: Array<{ name: string }> }>(
      `/users/${userId}/role-mappings`,
    );
    return (mappings.realmMappings ?? []).map((r) => r.name);
  }

  async assignRealmRoles(userId: string, roles: SystemRole[]): Promise<void> {
    // Resolve role representations from realm roles
    const roleReps = await Promise.all(
      roles.map((name) => this.request<{ id: string; name: string }>(`/roles/${name}`)),
    );
    await this.request<void>(`/users/${userId}/role-mappings/realm`, {
      method: 'POST',
      body: JSON.stringify(roleReps),
    });
  }

  async removeRealmRoles(userId: string, roles: SystemRole[]): Promise<void> {
    const roleReps = await Promise.all(
      roles.map((name) => this.request<{ id: string; name: string }>(`/roles/${name}`)),
    );
    await this.request<void>(`/users/${userId}/role-mappings/realm`, {
      method: 'DELETE',
      body: JSON.stringify(roleReps),
    });
  }

  // ─── Sessions ────────────────────────────────────────────────────────────

  /** Invalidate all active sessions for a user (forces re-login) */
  async logoutUser(userId: string): Promise<void> {
    await this.request<void>(`/users/${userId}/logout`, { method: 'POST' });
  }

  /** Reset user's required actions (e.g. force TOTP reconfiguration) */
  async setRequiredActions(userId: string, actions: string[]): Promise<void> {
    await this.request<void>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ requiredActions: actions }),
    });
  }

  // ─── Health ──────────────────────────────────────────────────────────────

  /** Ping the realm to verify Keycloak is reachable and the realm exists */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.config.url}/realms/${this.config.realm}/.well-known/openid-configuration`,
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class KeycloakAdminError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = 'KeycloakAdminError';
  }
}

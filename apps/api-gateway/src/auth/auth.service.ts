import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type LoginRequest,
  type TokenResponse,
  type RefreshTokenRequest,
  type JwtPayload,
} from '@gacp-erp/shared-schemas';

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Password-grant login via Keycloak Token endpoint.
   * Used by web-portal for direct credential auth.
   */
  async login(dto: LoginRequest): Promise<TokenResponse> {
    const url = `${this.config.getOrThrow<string>('KEYCLOAK_URL')}/realms/${this.config.getOrThrow<string>('KEYCLOAK_REALM')}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.config.getOrThrow<string>('KEYCLOAK_CLIENT_ID'),
      client_secret: this.config.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET'),
      username: dto.username,
      password: dto.password,
      scope: 'openid profile email',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      this.logger.warn(`Keycloak login failed: ${JSON.stringify(body)}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = (await response.json()) as KeycloakTokenResponse;

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      refresh_expires_in: tokens.refresh_expires_in,
      token_type: 'Bearer' as const,
      scope: '',
    };
  }

  /**
   * Refresh access token using a valid refresh_token.
   */
  async refresh(dto: RefreshTokenRequest): Promise<TokenResponse> {
    const url = `${this.config.getOrThrow<string>('KEYCLOAK_URL')}/realms/${this.config.getOrThrow<string>('KEYCLOAK_REALM')}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.getOrThrow<string>('KEYCLOAK_CLIENT_ID'),
      client_secret: this.config.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET'),
      refresh_token: dto.refresh_token,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const tokens = (await response.json()) as KeycloakTokenResponse;

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      refresh_expires_in: tokens.refresh_expires_in,
      token_type: 'Bearer' as const,
      scope: '',
    };
  }

  /**
   * Logout — revokes the token in Keycloak.
   */
  async logout(refreshToken: string): Promise<void> {
    const url = `${this.config.getOrThrow<string>('KEYCLOAK_URL')}/realms/${this.config.getOrThrow<string>('KEYCLOAK_REALM')}/protocol/openid-connect/logout`;

    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('KEYCLOAK_CLIENT_ID'),
      client_secret: this.config.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET'),
      refresh_token: refreshToken,
    });

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  }

  /**
   * Re-authentication for 21 CFR §11.200 critical operations.
   * Returns a short-lived re-auth token (5 minutes) after credential verification.
   */
  async reauthenticate(
    user: JwtPayload,
    password: string,
  ): Promise<{ reauth_token: string; expires_in: number }> {
    // Verify credentials by attempting a new password grant
    await this.login({ username: user.preferred_username, password });

    // Generate a short-lived HMAC reauth token scoped to this user
    const { createHmac } = await import('crypto');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const payload = `${user.sub}:${user.preferred_username}:${expiresAt}`;
    const secret = this.config.getOrThrow<string>('REAUTH_SECRET');
    const signature = createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}:${signature}`).toString('base64url');

    return { reauth_token: token, expires_in: 300 };
  }
}

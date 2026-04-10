import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type TokenResponse,
  type RefreshTokenRequest,
  type JwtPayload,
} from '@gacp-erp/shared-schemas';

interface ZitadelTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Refresh access token using a valid refresh_token.
   */
  async refresh(dto: RefreshTokenRequest): Promise<TokenResponse> {
    const zitadelUrl = this.config.getOrThrow<string>('ZITADEL_URL');
    const projectId = this.config.getOrThrow<string>('ZITADEL_PROJECT_ID');
    const url = `${zitadelUrl}/oauth/v2/token`;

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.getOrThrow<string>('ZITADEL_API_GW_CLIENT_ID'),
      client_secret: this.config.getOrThrow<string>('ZITADEL_API_GW_CLIENT_SECRET'),
      refresh_token: dto.refresh_token,
      scope: [
        'openid profile email',
        'urn:zitadel:iam:org:projects:roles',
        `urn:zitadel:iam:org:project:id:${projectId}:aud`,
      ].join(' '),
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const tokens = (await response.json()) as ZitadelTokenResponse;

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      refresh_expires_in: tokens.refresh_expires_in || tokens.expires_in,
      token_type: 'Bearer' as const,
      scope: '',
    };
  }

  /**
   * Logout — revokes the token in Zitadel.
   */
  async logout(refreshToken: string): Promise<void> {
    const zitadelUrl = this.config.getOrThrow<string>('ZITADEL_URL');
    const url = `${zitadelUrl}/oauth/v2/revocation`;

    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('ZITADEL_API_GW_CLIENT_ID'),
      client_secret: this.config.getOrThrow<string>('ZITADEL_API_GW_CLIENT_SECRET'),
      token: refreshToken,
    });

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  }

  /**
   * Re-authentication for 21 CFR §11.200 critical operations.
   * Uses Zitadel Session API v2 to verify credentials server-side without ROPC.
   * Returns a short-lived re-auth token (5 minutes) on success.
   */
  async reauthenticate(
    user: JwtPayload,
    password: string,
  ): Promise<{ reauth_token: string; expires_in: number }> {
    const zitadelUrl = this.config.getOrThrow<string>('ZITADEL_URL');
    const adminPat = this.config.getOrThrow<string>('ZITADEL_ADMIN_PAT');

    // Verify credentials via Zitadel Session API v2 (POST /v2/sessions)
    // Uses userId (sub) for unambiguous user lookup
    const response = await fetch(`${zitadelUrl}/v2/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminPat}`,
      },
      body: JSON.stringify({
        checks: {
          user: { userId: user.sub },
          password: { password },
        },
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      this.logger.warn(`Zitadel credential verification failed: ${JSON.stringify(body)}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Session created = credentials valid; issue HMAC reauth token
    const { createHmac } = await import('crypto');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const payload = `${user.sub}:${user.preferred_username}:${expiresAt}`;
    const secret = this.config.getOrThrow<string>('REAUTH_SECRET');
    const signature = createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}:${signature}`).toString('base64url');

    return { reauth_token: token, expires_in: 300 };
  }
}

import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  LoginRequestSchema,
  RefreshTokenRequestSchema,
  type LoginRequest,
  type RefreshTokenRequest,
  type JwtPayload,
} from '@gacp-erp/shared-schemas';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodBody } from '../common/decorators/zod-body.decorator';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/v1/auth/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@ZodBody(LoginRequestSchema) dto: LoginRequest) {
    return this.authService.login(dto);
  }

  /** POST /api/v1/auth/refresh */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@ZodBody(RefreshTokenRequestSchema) dto: RefreshTokenRequest) {
    return this.authService.refresh(dto);
  }

  private static readonly LogoutSchema = z.object({
    refresh_token: z.string().min(1, 'refresh_token is required'),
  });

  private static readonly ReauthSchema = z.object({
    password: z.string().min(1, 'password is required'),
  });

  /** POST /api/v1/auth/logout */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  logout(@ZodBody(AuthController.LogoutSchema) dto: { refresh_token: string }) {
    return this.authService.logout(dto.refresh_token);
  }

  /** GET /api/v1/auth/me */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return {
      sub: user.sub,
      email: user.email,
      preferred_username: user.preferred_username,
      given_name: user.given_name,
      family_name: user.family_name,
      roles: user.realm_access?.roles ?? [],
    };
  }

  /**
   * POST /api/v1/auth/reauth
   * 21 CFR §11.200 re-authentication before critical operations.
   * Returns a short-lived reauth_token (5 min) for subsequent signature endpoints.
   */
  @Post('reauth')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  reauthenticate(
    @CurrentUser() user: JwtPayload,
    @ZodBody(AuthController.ReauthSchema) dto: { password: string },
  ) {
    return this.authService.reauthenticate(user, dto.password);
  }
}

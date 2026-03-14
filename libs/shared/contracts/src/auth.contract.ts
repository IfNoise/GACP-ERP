import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  LoginRequestSchema,
  RefreshTokenRequestSchema,
  TokenResponseSchema,
  UserPublicSchema,
} from '@gacp-erp/shared-schemas';

const c = initContract();

/**
 * Authentication contract — Keycloak-backed auth endpoints.
 * Route: /auth/*
 */
export const authContract = c.router({
  /**
   * Login with username/password (+ optional TOTP).
   * Proxies to Keycloak token endpoint and returns JWT tokens.
   */
  login: {
    method: 'POST',
    path: '/auth/login',
    body: LoginRequestSchema,
    responses: {
      200: TokenResponseSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      423: ApiErrorSchema, // Account locked
    },
    summary: 'Login and obtain JWT tokens',
  },

  /**
   * Refresh access token using refresh token.
   */
  refresh: {
    method: 'POST',
    path: '/auth/refresh',
    body: RefreshTokenRequestSchema,
    responses: {
      200: TokenResponseSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
    },
    summary: 'Refresh access token',
  },

  /**
   * Logout — invalidates the session in Keycloak.
   */
  logout: {
    method: 'POST',
    path: '/auth/logout',
    body: z.object({ refresh_token: z.string() }),
    responses: {
      204: z.undefined(),
      400: ApiErrorSchema,
      401: ApiErrorSchema,
    },
    summary: 'Logout and invalidate session',
  },

  /**
   * Get current authenticated user profile.
   * Requires: Bearer token
   */
  me: {
    method: 'GET',
    path: '/auth/me',
    responses: {
      200: UserPublicSchema,
      401: ApiErrorSchema,
    },
    summary: 'Get current user profile',
  },

  /**
   * Re-authenticate for electronic signature purposes.
   * Required by 21 CFR Part 11 §11.200 — each signature requires fresh credential check.
   */
  reauthenticate: {
    method: 'POST',
    path: '/auth/reauth',
    body: z.object({
      password: z.string().min(1),
      totp_code: z.string().length(6).optional(),
      /** Purpose of re-authentication (for audit trail) */
      reason: z.string().min(1).max(500),
    }),
    responses: {
      200: z.object({
        /** Short-lived re-auth token for signing operations (5 min expiry) */
        reauth_token: z.string(),
        expires_at: z.string().datetime({ offset: true }),
      }),
      401: ApiErrorSchema,
      423: ApiErrorSchema,
    },
    summary: 'Re-authenticate for electronic signature (21 CFR §11.200)',
  },
});

export type AuthContract = typeof authContract;

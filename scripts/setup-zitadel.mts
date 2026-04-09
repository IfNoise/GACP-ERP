#!/usr/bin/env node
/**
 * Zitadel Bootstrap Script
 * ------------------------
 * Creates the GACP-ERP project structure in a fresh Zitadel instance:
 *   - Project: GACP-ERP
 *   - Project roles (SUPER_ADMIN, QUALITY_MANAGER, CULTIVATION_MANAGER, OPERATOR, AUDITOR, READONLY)
 *   - web-portal OIDC app (public SPA, Authorization Code + PKCE)
 *   - admin-service machine user + PAT (for workforce-service employee provisioning)
 *
 * Usage:
 *   ZITADEL_URL=http://localhost:8080 ZITADEL_ADMIN_PAT=<pat> pnpm tsx scripts/setup-zitadel.mts
 *
 * Prerequisites:
 *   1. Zitadel running (pnpm infra:up or docker compose -f docker/docker-compose.light.yml up -d)
 *   2. Admin PAT — generate one via:
 *      a) Zitadel console → IAM Users → zitadel-admin → Personal Access Tokens → New Token
 *      b) Or use the login-client PAT from docker/docker-compose.light.yml bootstrap volume
 *
 * Output:
 *   Prints .env entries for ZITADEL_PROJECT_ID, ZITADEL_CLIENT_ID, ZITADEL_CLIENT_SECRET,
 *   ZITADEL_ADMIN_CLIENT_ID, ZITADEL_ADMIN_CLIENT_SECRET. Copy these into docker/.env
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Config ───────────────────────────────────────────────────────────────────

const ZITADEL_URL = process.env['ZITADEL_URL'] ?? 'http://localhost:8080';
const PAT =
  process.env['ZITADEL_ADMIN_PAT'] ??
  tryReadFile('docker/bootstrap/admin.pat') ??
  die('Set ZITADEL_ADMIN_PAT env var or create docker/bootstrap/admin.pat');

const WEB_PORTAL_REDIRECT_URIS = [
  'http://localhost:3000/api/auth/callback/zitadel',
  'http://localhost:3000',
];

const PROJECT_ROLES = [
  { key: 'SUPER_ADMIN', display: 'Super Administrator', group: 'ADMIN' },
  { key: 'QUALITY_MANAGER', display: 'Quality Manager', group: 'MANAGEMENT' },
  { key: 'CULTIVATION_MANAGER', display: 'Cultivation Manager', group: 'MANAGEMENT' },
  { key: 'OPERATOR', display: 'Operator', group: 'OPERATIONS' },
  { key: 'AUDITOR', display: 'Auditor', group: 'AUDIT' },
  { key: 'READONLY', display: 'Read-Only', group: 'READONLY' },
] as const;

// ─── API helpers ─────────────────────────────────────────────────────────────

async function api<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const res = await fetch(`${ZITADEL_URL}${path}`, {
    method: body ? method : 'GET',
    headers: {
      Authorization: `Bearer ${PAT}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }

  const ct = res.headers.get('content-type') ?? '';
  if (res.status === 204 || !ct.includes('json')) return undefined as unknown as T;
  return (await res.json()) as T;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀 GACP-ERP Zitadel Bootstrap');
  console.log(`   URL: ${ZITADEL_URL}\n`);

  // 1. Verify connectivity
  const oidc = await fetch(`${ZITADEL_URL}/.well-known/openid-configuration`);
  if (!oidc.ok) die(`Cannot reach Zitadel at ${ZITADEL_URL}`);
  console.log('✅ Zitadel reachable');

  // 2. Create project
  console.log('\n📁 Creating project GACP-ERP...');
  const { id: projectId } = await api<{ id: string }>('/management/v1/projects', {
    name: 'GACP-ERP',
    projectRoleAssertion: true,
    projectRoleCheck: true,
    hasProjectCheck: false,
  });
  console.log(`   Project ID: ${projectId}`);

  // 3. Create project roles
  console.log('\n🎭 Creating project roles...');
  for (const role of PROJECT_ROLES) {
    await api(`/management/v1/projects/${projectId}/roles`, {
      roleKey: role.key,
      displayName: role.display,
      group: role.group,
    }).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('already exists') || msg.includes('6')) {
        console.log(`   ⚠️  ${role.key} already exists — skipping`);
      } else {
        throw e;
      }
    });
    console.log(`   ✅ ${role.key}`);
  }

  // 4. Create web-portal OIDC app (public SPA)
  console.log('\n🌐 Creating web-portal OIDC application...');
  const webPortal = await api<{ appId: string; clientId: string }>(
    `/management/v1/projects/${projectId}/apps/oidc`,
    {
      name: 'web-portal',
      redirectUris: WEB_PORTAL_REDIRECT_URIS,
      postLogoutRedirectUris: ['http://localhost:3000'],
      responseTypes: ['OIDC_RESPONSE_TYPE_CODE'],
      grantTypes: ['OIDC_GRANT_TYPE_AUTHORIZATION_CODE', 'OIDC_GRANT_TYPE_REFRESH_TOKEN'],
      appType: 'OIDC_APP_TYPE_USER_AGENT',
      authMethodType: 'OIDC_AUTH_METHOD_TYPE_NONE', // Public client — PKCE only
      accessTokenType: 'OIDC_TOKEN_TYPE_JWT',
      accessTokenRoleAssertion: true,
      idTokenRoleAssertion: true,
      idTokenUserinfoAssertion: true,
      devMode: true, // Allow http:// redirect URIs in dev
    },
  );
  console.log(`   App ID:    ${webPortal.appId}`);
  console.log(`   Client ID: ${webPortal.clientId}`);

  // 5. Create api-gateway OIDC app (confidential — password grant + client_credentials)
  console.log('\n🔐 Creating api-gateway OIDC application...');
  const apiGateway = await api<{ appId: string; clientId: string; clientSecret?: string }>(
    `/management/v1/projects/${projectId}/apps/oidc`,
    {
      name: 'api-gateway',
      redirectUris: [],
      postLogoutRedirectUris: [],
      responseTypes: ['OIDC_RESPONSE_TYPE_CODE'],
      grantTypes: [
        'OIDC_GRANT_TYPE_AUTHORIZATION_CODE',
        'OIDC_GRANT_TYPE_REFRESH_TOKEN',
        'OIDC_GRANT_TYPE_CLIENT_CREDENTIALS',
      ],
      appType: 'OIDC_APP_TYPE_WEB',
      authMethodType: 'OIDC_AUTH_METHOD_TYPE_BASIC', // Confidential client
      accessTokenType: 'OIDC_TOKEN_TYPE_JWT',
      accessTokenRoleAssertion: true,
      idTokenRoleAssertion: true,
      idTokenUserinfoAssertion: true,
    },
  );
  console.log(`   App ID:     ${apiGateway.appId}`);
  console.log(`   Client ID:  ${apiGateway.clientId}`);
  console.log(`   Has Secret: ${Boolean(apiGateway.clientSecret)}`);

  // 6. Create admin-service machine user (for workforce-service provisioning)
  console.log('\n🤖 Creating admin-service machine user...');
  const machineUser = await api<{ userId: string }>('/v2/users/machine', {
    userName: 'admin-service',
    name: 'GACP-ERP Admin Service',
    description: 'Service account for workforce-service user provisioning',
    accessTokenType: 'ACCESS_TOKEN_TYPE_JWT',
  });
  console.log(`   User ID: ${machineUser.userId}`);

  // Grant admin-service the IAM_OWNER role so it can provision users
  await api(`/management/v1/users/${machineUser.userId}/grants`, {
    projectId,
    roleKeys: ['SUPER_ADMIN'],
  });

  // Create PAT for admin-service
  const { token: adminPat } = await api<{ token: string }>(
    `/v2/users/${machineUser.userId}/pats`,
    { expirationDate: '2030-12-31T23:59:59Z' },
  );
  console.log('   PAT created (shown below)');

  // 7. Print results
  const separator = '─'.repeat(60);
  const output = [
    `\n${separator}`,
    '  Copy these values into docker/.env',
    separator,
    `ZITADEL_PROJECT_ID=${projectId}`,
    `# web-portal (public SPA — no secret)`,
    `ZITADEL_CLIENT_ID=${webPortal.clientId}`,
    `ZITADEL_CLIENT_SECRET=`,
    `# api-gateway (confidential)`,
    `ZITADEL_API_GW_CLIENT_ID=${apiGateway.clientId}`,
    `ZITADEL_API_GW_CLIENT_SECRET=${apiGateway.clientSecret ?? 'REGENERATE_IN_CONSOLE'}`,
    `# admin-service machine user PAT`,
    `ZITADEL_ADMIN_CLIENT_ID=admin-service`,
    `ZITADEL_ADMIN_PAT=${adminPat}`,
    separator,
    '',
    '⚠️  The api-gateway secret and admin-service PAT will NOT be shown again.',
    '    Save them immediately.',
    separator,
  ].join('\n');

  console.log(output);

  // Write to file
  const outPath = resolve('.zitadel-setup.env');
  writeFileSync(
    outPath,
    [
      `# Generated by setup-zitadel.mts on ${new Date().toISOString()}`,
      `ZITADEL_PROJECT_ID=${projectId}`,
      `ZITADEL_CLIENT_ID=${webPortal.clientId}`,
      `ZITADEL_CLIENT_SECRET=`,
      `ZITADEL_API_GW_CLIENT_ID=${apiGateway.clientId}`,
      `ZITADEL_API_GW_CLIENT_SECRET=${apiGateway.clientSecret ?? ''}`,
      `ZITADEL_ADMIN_CLIENT_ID=admin-service`,
      `ZITADEL_ADMIN_PAT=${adminPat}`,
    ].join('\n') + '\n',
    'utf-8',
  );
  console.log(`\n📄 Values also written to: ${outPath}`);
  console.log('   Add this file to .gitignore if not already done.\n');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tryReadFile(path: string): string | null {
  try {
    return readFileSync(resolve(path), 'utf-8').trim();
  } catch {
    return null;
  }
}

function die(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err: unknown) => {
  console.error('\n❌ Bootstrap failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});

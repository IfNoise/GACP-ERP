import { KeycloakAdminClient, KeycloakAdminError } from './keycloak-admin.client';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const cfg = {
  url: 'http://kc:8080',
  realm: 'gacp',
  clientId: 'admin-cli',
  clientSecret: 'secret',
};

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(headers),
  }) as unknown as Promise<Response>;
}

function noContentResponse() {
  return Promise.resolve({
    ok: true,
    status: 204,
    json: () => Promise.reject(new Error('no body')),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  }) as unknown as Promise<Response>;
}

function errorResponse(status: number, body = '') {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.reject(new Error('err')),
    text: () => Promise.resolve(body),
    headers: new Headers(),
  }) as unknown as Promise<Response>;
}

const tokenBody = { access_token: 'tok', expires_in: 3600, token_type: 'Bearer' as const };

/* ── setup ───────────────────────────────────────────────────────────────── */

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock;
});

afterEach(() => jest.restoreAllMocks());

/* ── tests ───────────────────────────────────────────────────────────────── */

describe('KeycloakAdminClient', () => {
  let client: KeycloakAdminClient;

  beforeEach(() => {
    client = new KeycloakAdminClient(cfg);
  });

  /* ── getAdminToken / caching ────────────────────────────────────────── */

  it('fetches a new admin token on first call', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody)) // token
      .mockReturnValueOnce(jsonResponse([])); // getUsers

    await client.getUsers();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/openid-connect/token'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('caches the admin token on subsequent calls', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(jsonResponse([])) // first getUsers
      .mockReturnValueOnce(jsonResponse([])); // second getUsers

    await client.getUsers();
    await client.getUsers();

    // token fetched only once
    const tokenCalls = fetchMock.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && args[0].includes('/openid-connect/token'),
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it('throws when token request fails', async () => {
    fetchMock.mockReturnValueOnce(errorResponse(401));

    await expect(client.getUsers()).rejects.toThrow(KeycloakAdminError);
  });

  /* ── request() – 204 branch ────────────────────────────────────────── */

  it('handles 204 No Content', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(noContentResponse());

    await expect(client.deleteUser('u1')).resolves.toBeUndefined();
  });

  it('throws on non-ok response with body', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(errorResponse(404, 'not found'));

    await expect(client.getUserById('bad')).rejects.toThrow(KeycloakAdminError);
  });

  /* ── getUsers ───────────────────────────────────────────────────────── */

  it('getUsers without params', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(jsonResponse([]));

    const users = await client.getUsers();
    expect(users).toEqual([]);

    const url: string = fetchMock.mock.calls[1][0];
    expect(url).toBe('http://kc:8080/admin/realms/gacp/users');
  });

  it('getUsers with search & max', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(jsonResponse([]));

    await client.getUsers({ search: 'joe', max: 5 });

    const url: string = fetchMock.mock.calls[1][0];
    expect(url).toContain('search=joe');
    expect(url).toContain('max=5');
  });

  /* ── getUserById ────────────────────────────────────────────────────── */

  it('getUserById returns a user', async () => {
    const user = { id: 'u1', username: 'joe' };
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(jsonResponse(user));

    const result = await client.getUserById('u1');
    expect(result).toEqual(user);
  });

  /* ── getUserByUsername ──────────────────────────────────────────────── */

  it('getUserByUsername finds matching user', async () => {
    const user = { id: 'u1', username: 'joe' };
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(jsonResponse([user]));

    const result = await client.getUserByUsername('joe');
    expect(result).toEqual(user);
  });

  it('getUserByUsername returns null when not found', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(jsonResponse([]));

    const result = await client.getUserByUsername('missing');
    expect(result).toBeNull();
  });

  /* ── createUser ─────────────────────────────────────────────────────── */

  it('createUser returns user id from Location header', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(
        jsonResponse(null, 201, { Location: 'http://kc:8080/admin/realms/gacp/users/new-id' }),
      );

    const id = await client.createUser({ username: 'u', email: 'u@e.com' });
    expect(id).toBe('new-id');
  });

  it('createUser assigns realm roles when provided', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      // createUser POST
      .mockReturnValueOnce(jsonResponse(null, 201, { Location: 'http://kc:8080/.../users/uid' }))
      // resolve role reps (1 role)
      .mockReturnValueOnce(jsonResponse({ id: 'r1', name: 'operator' }))
      // POST role mapping
      .mockReturnValueOnce(noContentResponse());

    const id = await client.createUser({
      username: 'u',
      email: 'u@e.com',
      realmRoles: ['operator' as never],
    });
    expect(id).toBe('uid');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('createUser throws when POST fails', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(errorResponse(409, 'conflict'));

    await expect(client.createUser({ username: 'u', email: 'u@e.com' })).rejects.toThrow(
      KeycloakAdminError,
    );
  });

  it('createUser throws when Location header is empty', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(jsonResponse(null, 201)); // no Location header

    await expect(client.createUser({ username: 'u', email: 'u@e.com' })).rejects.toThrow(
      'No user ID in Location header',
    );
  });

  /* ── updateUser ─────────────────────────────────────────────────────── */

  it('updateUser without roles', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(noContentResponse());

    await expect(client.updateUser('u1', { firstName: 'Joe' })).resolves.toBeUndefined();
  });

  it('updateUser with realm roles', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(noContentResponse()) // PUT user
      .mockReturnValueOnce(jsonResponse({ id: 'r1', name: 'admin' })) // role lookup
      .mockReturnValueOnce(noContentResponse()); // POST role mapping

    await client.updateUser('u1', { realmRoles: ['admin' as never] });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  /* ── deleteUser ─────────────────────────────────────────────────────── */

  it('deleteUser sends DELETE', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(noContentResponse());

    await client.deleteUser('u1');

    const [url, opts] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toContain('/users/u1');
    expect(opts.method).toBe('DELETE');
  });

  /* ── getUserRealmRoles ──────────────────────────────────────────────── */

  it('getUserRealmRoles maps role names', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(
        jsonResponse({ realmMappings: [{ name: 'admin' }, { name: 'operator' }] }),
      );

    const roles = await client.getUserRealmRoles('u1');
    expect(roles).toEqual(['admin', 'operator']);
  });

  it('getUserRealmRoles returns empty when no mappings', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(jsonResponse({}));

    const roles = await client.getUserRealmRoles('u1');
    expect(roles).toEqual([]);
  });

  /* ── assignRealmRoles / removeRealmRoles ────────────────────────────── */

  it('assignRealmRoles resolves role reps and POSTs', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(jsonResponse({ id: 'r1', name: 'admin' }))
      .mockReturnValueOnce(noContentResponse());

    await client.assignRealmRoles('u1', ['admin' as never]);
    const [url, opts] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(url).toContain('/role-mappings/realm');
    expect(opts.method).toBe('POST');
  });

  it('removeRealmRoles resolves role reps and sends DELETE', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(tokenBody))
      .mockReturnValueOnce(jsonResponse({ id: 'r1', name: 'operator' }))
      .mockReturnValueOnce(noContentResponse());

    await client.removeRealmRoles('u1', ['operator' as never]);
    const [url, opts] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(url).toContain('/role-mappings/realm');
    expect(opts.method).toBe('DELETE');
  });

  /* ── logoutUser / setRequiredActions ────────────────────────────────── */

  it('logoutUser sends POST to logout endpoint', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(noContentResponse());

    await client.logoutUser('u1');
    const [url, opts] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toContain('/users/u1/logout');
    expect(opts.method).toBe('POST');
  });

  it('setRequiredActions sends PUT with actions', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(tokenBody)).mockReturnValueOnce(noContentResponse());

    await client.setRequiredActions('u1', ['CONFIGURE_TOTP']);
    const [, opts] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(opts.method).toBe('PUT');
    expect(opts.body).toContain('CONFIGURE_TOTP');
  });

  /* ── healthCheck ────────────────────────────────────────────────────── */

  it('healthCheck returns true when ok', async () => {
    fetchMock.mockReturnValueOnce(Promise.resolve({ ok: true }));

    await expect(client.healthCheck()).resolves.toBe(true);
  });

  it('healthCheck returns false on non-ok', async () => {
    fetchMock.mockReturnValueOnce(Promise.resolve({ ok: false }));

    await expect(client.healthCheck()).resolves.toBe(false);
  });

  it('healthCheck returns false on fetch error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'));

    await expect(client.healthCheck()).resolves.toBe(false);
  });
});

/* ── KeycloakAdminError ──────────────────────────────────────────────── */

describe('KeycloakAdminError', () => {
  it('has correct properties', () => {
    const err = new KeycloakAdminError('msg', 403, 'body');
    expect(err.name).toBe('KeycloakAdminError');
    expect(err.statusCode).toBe(403);
    expect(err.responseBody).toBe('body');
    expect(err.message).toBe('msg');
  });

  it('responseBody is optional', () => {
    const err = new KeycloakAdminError('msg', 500);
    expect(err.responseBody).toBeUndefined();
  });
});

import { ZitadelAdminClient, ZitadelAdminError } from './zitadel-admin.client';

describe('ZitadelAdminClient', () => {
  let client: ZitadelAdminClient;

  beforeEach(() => {
    client = new ZitadelAdminClient({
      url: 'http://localhost:8080',
      clientId: 'test-client',
      clientSecret: 'test-secret',
      projectId: 'test-project',
    });
  });

  describe('healthCheck', () => {
    it('should return true when Zitadel is reachable', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when Zitadel is not reachable', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection error'));

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('getAdminToken', () => {
    it('should obtain an access token', async () => {
      const mockToken = {
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockToken,
      });

      const result = await (
        client as unknown as { getAdminToken(): Promise<string> }
      ).getAdminToken();
      expect(result).toBe('test-token');
    });

    it('should throw ZitadelAdminError on token fetch failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        (client as unknown as { getAdminToken(): Promise<string> }).getAdminToken(),
      ).rejects.toThrow(ZitadelAdminError);
    });
  });

  describe('getUserByUsername', () => {
    it('should return null when user not found', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Not found'));

      const result = await client.getUserByUsername('nonexistent');
      expect(result).toBeNull();
    });
  });
});

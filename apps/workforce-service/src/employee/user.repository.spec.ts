import { type UserRepository as UserRepositoryType } from './user.repository';

const { UserRepository } = require('./user.repository') as {
  UserRepository: new (...args: unknown[]) => UserRepositoryType;
};

const fakeUserRow = {
  id: 'user-uuid-1',
  keycloak_id: 'kc-uuid-1',
  username: 'john_doe',
  email: 'john@test.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'OPERATOR',
  is_active: true,
  failed_login_count: 0,
  last_login_at: null,
  auditor_certification: null,
  auditor_agency: null,
  temporary_access_expires: null,
  created_at: new Date(),
  updated_at: new Date(),
};

function makeSelectChain(rows: unknown[]) {
  const limitFn = jest.fn().mockResolvedValue(rows);
  const whereFn = jest.fn().mockReturnValue({ limit: limitFn });
  const fromFn = jest.fn().mockReturnValue({ where: whereFn });
  return { from: fromFn, whereFn, limitFn };
}

function makeInsertChain(rows: unknown[]) {
  const returningFn = jest.fn().mockResolvedValue(rows);
  const valuesFn = jest.fn().mockReturnValue({ returning: returningFn });
  return { values: valuesFn, returningFn };
}

describe('UserRepository', () => {
  describe('createWithTx', () => {
    it('should insert into users table and return id, keycloak_id, username', async () => {
      const ins = makeInsertChain([fakeUserRow]);
      const tx = { insert: jest.fn().mockReturnValue(ins) };
      const db = {};
      const repo = new UserRepository(db as never);

      const result = await repo.createWithTx(tx as never, {
        keycloak_id: 'kc-uuid-1',
        email: 'john@test.com',
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        role: 'OPERATOR' as never,
      });

      expect(result.id).toBe('user-uuid-1');
      expect(result.keycloak_id).toBe('kc-uuid-1');
      expect(result.username).toBe('john_doe');
      expect(tx.insert).toHaveBeenCalled();
    });

    it('should throw when insert returns no rows', async () => {
      const ins = makeInsertChain([]);
      ins.returningFn.mockResolvedValue([]);
      const tx = { insert: jest.fn().mockReturnValue(ins) };
      const db = {};
      const repo = new UserRepository(db as never);

      await expect(
        repo.createWithTx(tx as never, {
          keycloak_id: 'kc-uuid-1',
          email: 'john@test.com',
          username: 'john_doe',
          first_name: 'John',
          last_name: 'Doe',
          role: 'OPERATOR' as never,
        }),
      ).rejects.toThrow('User insert returned no rows');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const sel = makeSelectChain([{ id: 'user-uuid-1' }]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new UserRepository(db as never);

      const result = await repo.findByEmail('john@test.com');
      expect(result).toEqual({ id: 'user-uuid-1' });
    });

    it('should return null when not found', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new UserRepository(db as never);

      expect(await repo.findByEmail('nobody@test.com')).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
      const sel = makeSelectChain([{ id: 'user-uuid-1' }]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new UserRepository(db as never);

      const result = await repo.findByUsername('john_doe');
      expect(result).toEqual({ id: 'user-uuid-1' });
    });

    it('should return null when not found', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new UserRepository(db as never);

      expect(await repo.findByUsername('nobody')).toBeNull();
    });
  });
});
